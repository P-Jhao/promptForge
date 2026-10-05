#!/usr/bin/env bash
set -Eeuo pipefail

readonly registry="ghcr.io"
readonly image_namespace="p-jhao"
readonly compose_dir="/opt/promptforge"
readonly compose_file="$compose_dir/docker-compose.yml"
readonly local_tags=(
  promptforge-backend:latest
  promptforge-frontend:latest
  promptforge-nginx:latest
)
readonly image_names=(
  promptforge-backend
  promptforge-frontend
  promptforge-nginx
)
readonly services=(backend frontend nginx)

if [[ $# -ne 1 ]]; then
  echo "Usage: deploy-ghcr.sh <40-character-commit-sha>" >&2
  exit 2
fi

readonly image_sha="$1"
if [[ ! "$image_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "The image tag must be a full lowercase Git commit SHA" >&2
  exit 2
fi
if [[ "$EUID" -ne 0 ]]; then
  echo "Run this deployment script as root so it can use /opt/promptforge" >&2
  exit 1
fi
if [[ ! -f "$compose_file" || ! -r "$compose_dir/backend/.env" ]]; then
  echo "Expected Compose file or server-only backend/.env is missing" >&2
  exit 1
fi

cd "$compose_dir"
docker compose --file "$compose_file" config --quiet
for service in "${services[@]}"; do
  if ! docker compose --file "$compose_file" config --services | grep -Fxq "$service"; then
    echo "Compose service '$service' is missing; refusing to deploy" >&2
    exit 1
  fi
done

IFS= read -r ghcr_token || {
  echo "No GHCR read token was received on standard input" >&2
  exit 1
}
IFS= read -r ghcr_username || {
  echo "No GHCR username was received on standard input" >&2
  exit 1
}
if [[ -z "$ghcr_token" ]]; then
  echo "The GHCR read token is empty" >&2
  exit 1
fi
if [[ ! "$ghcr_username" =~ ^[A-Za-z0-9-]{1,39}$ ]]; then
  echo "The GHCR username contains unsupported characters" >&2
  exit 2
fi

docker_config="$(mktemp -d /tmp/promptforge-docker-config.XXXXXX)"
chmod 700 "$docker_config"
cleanup() {
  rm -rf -- "$docker_config"
}
trap cleanup EXIT
export DOCKER_CONFIG="$docker_config"
printf '%s' "$ghcr_token" | docker login "$registry" \
  --username "$ghcr_username" --password-stdin >/dev/null
unset ghcr_token

declare -a previous_ids=()
for tag in "${local_tags[@]}"; do
  image_id="$(docker image inspect --format '{{.Id}}' "$tag")" || {
    echo "Cannot find the current image '$tag'; refusing to risk a no-rollback deployment" >&2
    exit 1
  }
  previous_ids+=("$image_id")
done

updated=0
rollback() {
  local failed_status="$1"
  trap - ERR
  set +e
  echo "Deployment failed; restoring the previous image tags and Compose stack." >&2
  for index in "${!local_tags[@]}"; do
    docker image tag "${previous_ids[$index]}" "${local_tags[$index]}"
  done
  docker compose --file "$compose_file" up -d --no-build
  wait_for_health || echo "Rollback was attempted, but the previous stack did not become healthy." >&2
  exit "$failed_status"
}
on_error() {
  local failed_status="$1"
  local failed_line="$2"
  echo "Deployment command failed at line $failed_line (exit $failed_status)." >&2
  docker compose --file "$compose_file" ps >&2 || true
  if [[ "$updated" -eq 1 ]]; then
    rollback "$failed_status"
  fi
  exit "$failed_status"
}
wait_for_health() {
  local deadline=$((SECONDS + 180))
  local all_healthy container_id status health
  while (( SECONDS < deadline )); do
    all_healthy=1
    for service in "${services[@]}"; do
      container_id="$(docker compose --file "$compose_file" ps -q "$service")"
      if [[ -z "$container_id" ]]; then
        all_healthy=0
        continue
      fi
      read -r status health < <(docker inspect --format \
        '{{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' \
        "$container_id")
      if [[ "$status" == "exited" || "$status" == "dead" ]]; then
        echo "Service '$service' container is $status." >&2
        return 1
      fi
      if [[ "$status" != "running" || "$health" != "healthy" ]]; then
        all_healthy=0
      fi
    done
    if [[ "$all_healthy" -eq 1 ]]; then
      return 0
    fi
    sleep 5
  done
  echo "Timed out waiting for all PromptForge containers to become healthy." >&2
  docker compose --file "$compose_file" ps >&2
  return 1
}
trap 'on_error "$?" "$LINENO"' ERR

echo "Pulling PromptForge images for commit $image_sha."
for image_name in "${image_names[@]}"; do
  docker pull "$registry/$image_namespace/$image_name:$image_sha"
done

updated=1
for index in "${!image_names[@]}"; do
  docker image tag \
    "$registry/$image_namespace/${image_names[$index]}:$image_sha" \
    "${local_tags[$index]}"
done

echo "Recreating PromptForge services without building on ECS."
docker compose --file "$compose_file" up -d --no-build
wait_for_health

echo "PromptForge deployment $image_sha is healthy."
