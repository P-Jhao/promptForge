// 代码下载工具函数
import JSZip from "jszip";
import type { SandpackFiles } from "@/types/store";
import {
  validateResourceManifest,
  type CaseResourceManifest,
} from "@/cases/resourceManifest";

/**
 * 生成 index.html 文件内容
 */
function generateIndexHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
    <!-- Tailwind CSS CDN (与 Sandpack 保持一致) -->
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`;
}

/**
 * 生成 vite.config.ts 文件内容
 */
function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
})
`;
}

/**
 * 生成 tsconfig.json 文件内容
 */
function generateTsConfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`;
}

/**
 * 生成 tsconfig.node.json 文件内容
 */
function generateTsConfigNode(): string {
  return `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`;
}

/**
 * 下载生成的代码为 zip 文件
 * @param generatedFiles - Sandpack 格式的生成文件
 * @param templateFiles - 模板文件（package.json, index.tsx, styles.css）
 */
export async function downloadGeneratedCode(
  generatedFiles: SandpackFiles,
  templateFiles: SandpackFiles,
  resourceManifest?: CaseResourceManifest,
): Promise<void> {
  const zip = new JSZip();
  const allFiles = { ...templateFiles, ...generatedFiles };
  const relocatedResourcePaths = new Set<string>();

  if (resourceManifest !== undefined) {
    validateResourceManifest(allFiles, resourceManifest);
    // External resources remain URL metadata in the manifest; their remote
    // bytes are never copied into the generated project or ZIP.
    for (const resource of resourceManifest.resources) {
      if (toZipPath(resource.exportPath) !== toZipPath(resource.sandpackPath)) {
        relocatedResourcePaths.add(resource.sandpackPath);
      }
    }
    zip.file(
      "promptforge-resource-manifest.json",
      JSON.stringify(resourceManifest, null, 2),
    );
  }

  // 1. 添加必需的配置文件（Sandpack 内置但下载时需要）
  zip.file("index.html", generateIndexHtml());
  zip.file("vite.config.ts", generateViteConfig());
  zip.file("tsconfig.json", generateTsConfig());
  zip.file("tsconfig.node.json", generateTsConfigNode());

  // 2. 添加模板文件（保持 Sandpack 的扁平结构）
  Object.entries(templateFiles).forEach(([path, file]) => {
    if (relocatedResourcePaths.has(path)) return;
    zip.file(toZipPath(path), file.code);
  });

  // 3. 添加生成的文件（保持 Sandpack 的扁平结构，包括子目录）
  Object.entries(generatedFiles).forEach(([path, file]) => {
    if (relocatedResourcePaths.has(path)) return;
    zip.file(toZipPath(path), file.code);
  });

  if (resourceManifest !== undefined) {
    // Only local Sandpack resources are materialized. Remote URLs stay in
    // promptforge-resource-manifest.json for source traceability.
    for (const resource of resourceManifest.resources) {
      const file = allFiles[resource.sandpackPath];
      if (file === undefined) {
        if (resource.required) {
          throw new Error(`资源导出失败：缺少 ${resource.sandpackPath}`);
        }
        continue;
      }
      const exportPath = toZipPath(resource.exportPath);
      if (exportPath !== toZipPath(resource.sandpackPath)) {
        zip.file(exportPath, file.code);
      }
    }
  }

  // 4. 生成 zip 文件
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: {
      level: 6, // 压缩级别 1-9，6 是平衡值
    },
  });

  // 5. 触发浏览器下载
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, -5); // 格式: 2026-02-05_14-42-35
  const filename = `promptforge-project-${timestamp}.zip`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // 清理
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toZipPath(path: string): string {
  const cleanPath = path.replace(/^\/+/, "");
  const segments = cleanPath.split("/");
  if (
    cleanPath.length === 0 ||
    segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")
  ) {
    throw new Error(`导出文件路径无效：${path}`);
  }
  return cleanPath;
}
