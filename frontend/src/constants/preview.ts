const DEFAULT_LONG_WAIT_MS = 30_000;
const DEFAULT_TIMEOUT_MS = 120_000;

function readDuration(
  preferred: string | undefined,
  alternate: string | undefined,
  fallback: number,
  label: string,
): number {
  const rawValue = preferred ?? alternate;
  if (rawValue === undefined || rawValue.trim().length === 0) return fallback;
  const duration = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(duration) || duration <= 0) {
    throw new Error(`${label} must be a positive integer in milliseconds`);
  }
  return duration;
}

const longWaitMs = readDuration(
  process.env.NEXT_PUBLIC_PREVIEW_LONG_WAIT_MS,
  process.env.NEXT_PUBLIC_SANDPACK_LONG_WAIT_MS,
  DEFAULT_LONG_WAIT_MS,
  "NEXT_PUBLIC_PREVIEW_LONG_WAIT_MS",
);
const timeoutMs = readDuration(
  process.env.NEXT_PUBLIC_PREVIEW_TIMEOUT_MS,
  process.env.NEXT_PUBLIC_SANDPACK_TIMEOUT_MS,
  DEFAULT_TIMEOUT_MS,
  "NEXT_PUBLIC_PREVIEW_TIMEOUT_MS",
);

if (timeoutMs <= longWaitMs) {
  throw new Error("NEXT_PUBLIC_PREVIEW_TIMEOUT_MS must be greater than the long wait threshold");
}

export const PREVIEW_TIMINGS = Object.freeze({ longWaitMs, timeoutMs });
