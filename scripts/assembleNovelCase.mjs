import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(dirname(fileURLToPath(import.meta.url))));
const mockDir = join(root, "backend", "mock");
const templateDir = join(root, "backend", "templates", "react-ts");
const generatedDir = join(root, "frontend", "src", "cases", "generated");
const outputFile = join(root, "frontend", "src", "cases", "generatedFiles.ts");
const coverAssetPath = join(root, "frontend", "public", "book-cover.svg");

async function readText(path) {
  return readFile(path, "utf8");
}

async function readJson(name) {
  return JSON.parse(await readText(join(mockDir, name)));
}

function createResourceMetadata(content) {
  return {
    id: "book-cover",
    kind: "image",
    required: true,
    hostPath: "/book-cover.svg",
    sandpackPath: "/book-cover.svg",
    exportPath: "public/book-cover.svg",
    contentType: "image/svg+xml",
    sizeBytes: Buffer.byteLength(content, "utf8"),
    sha256: createHash("sha256").update(content, "utf8").digest("hex"),
  };
}

function assertContains(source, needle, label) {
  if (!source.includes(needle)) {
    throw new Error(`Novel case patch target not found: ${label}`);
  }
}

function add(files, path, content) {
  if (typeof content !== "string" || content.length === 0) {
    throw new Error(`Novel case source is empty: ${path}`);
  }
  files[path] = content;
}

function addFileList(files, items, field = "content") {
  for (const item of items ?? []) {
    const content = item[field];
    add(files, item.path, content);
  }
}

function patchNovelService(source) {
  const marker = "export function getNovelsByStatus";
  assertContains(source, marker, "novelService query functions");
  return `${source}\n\nexport function createNovel(input: Pick<Novel, "title" | "author" | "description">): Novel {\n  const now = new Date().toISOString();\n  const novel: Novel = {\n    id: \`novel_session_\${Date.now()}\`,\n    title: input.title,\n    author: input.author,\n    coverImage: "/book-cover.svg",\n    description: input.description,\n    filePath: "",\n    totalPages: 100,\n    currentPage: 0,\n    lastReadAt: now,\n    createdAt: now,\n    updatedAt: now,\n    status: "unread",\n    progressPercentage: 0,\n  };\n  MOCK_NOVELS.push(novel);\n  return novel;\n}\n`;
}

function patchNoteService(source) {
  const marker = "export function getReadingNotesByNovelId";
  assertContains(source, marker, "readingNoteService query functions");
  return `${source}\n\nexport function createReadingNote(input: Pick<ReadingNote, "novelId" | "pageNumber" | "content">): ReadingNote {\n  const now = new Date().toISOString();\n  const note: ReadingNote = {\n    id: \`note_session_\${Date.now()}\`,\n    novelId: input.novelId,\n    pageNumber: input.pageNumber,\n    content: input.content,\n    createdAt: now,\n    updatedAt: now,\n  };\n  MOCK_READING_NOTES.unshift(note);\n  return note;\n}\n`;
}

function patchBookmarkService(source) {
  const marker = "export function getBookmarksByNovelId";
  assertContains(source, marker, "bookmarkService query functions");
  return `${source}\n\nexport function createBookmark(input: Pick<Bookmark, "novelId" | "pageNumber" | "description">): Bookmark {\n  const bookmark: Bookmark = {\n    id: \`bookmark_session_\${Date.now()}\`,\n    novelId: input.novelId,\n    pageNumber: input.pageNumber,\n    description: input.description,\n    createdAt: new Date().toISOString(),\n  };\n  MOCK_BOOKMARKS.unshift(bookmark);\n  return bookmark;\n}\n`;
}

function patchNovelForm(source) {
  const target = "import NovelFormCard from '../components/NovelFormCard';";
  const log = "console.log('submit novel:', data);";
  assertContains(source, target, "NovelForm service import");
  assertContains(source, log, "NovelForm submit handler");
  return source
    .replace(target, `${target}\nimport { createNovel } from '../services/novelService';`)
    .replace(log, "createNovel(data);");
}

function patchNoteForm(source) {
  const target = "import NoteFormCard from '../components/NoteFormCard';";
  const log = "console.log('submit note:', { novelId: id, ...data });";
  assertContains(source, target, "NoteForm service import");
  assertContains(source, log, "NoteForm submit handler");
  return source
    .replace(target, `${target}\nimport { createReadingNote } from '../services/readingNoteService';`)
    .replace(log, "if (!id) { throw new Error('Cannot create a note without a novel id'); }\n    createReadingNote({ novelId: id, ...data });");
}

function patchReadingWorkspace(source) {
  const importTarget = "import ProgressSlider from '../components/ProgressSlider';";
  const log = "console.log('bookmark at page', currentPage);";
  assertContains(source, importTarget, "ReadingWorkspace service import");
  assertContains(source, log, "ReadingWorkspace bookmark handler");
  const articleTarget = '<article className="max-w-2xl mx-auto px-6 py-8" style={{ fontSize: fontSize + \'px\' }}>';
  assertContains(source, articleTarget, "ReadingWorkspace article");
  return source
    .replace(importTarget, `${importTarget}\nimport { createBookmark } from '../services/bookmarkService';`)
    .replace("const [currentPage, setCurrentPage] = useState(1);", "const [currentPage, setCurrentPage] = useState(1);\n  const [bookmarkMessage, setBookmarkMessage] = useState('');")
    .replace(log, "createBookmark({ novelId: novel.id, pageNumber: currentPage, description: '阅读中标记的页面' });\n    setBookmarkMessage('书签已加入当前会话');")
    .replace("<div className=\"flex-1 overflow-auto\">", "{bookmarkMessage && <div className=\"px-4 py-2 text-sm text-green-700 bg-green-50\">{bookmarkMessage}</div>}\n      <div className=\"flex-1 overflow-auto\">")
    .replace(articleTarget, `${articleTarget}\n          <p className="mb-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">示意正文：此案例用于展示阅读界面交互，不包含完整原书内容。</p>`);
}

function patchNovelDetail(source) {
  const target = "import BookmarksList from '../components/BookmarksList';";
  const detailTarget = "      <BookmarksList bookmarks={bookmarks || []} />";
  assertContains(source, target, "NovelDetail imports");
  assertContains(source, detailTarget, "NovelDetail bookmarks section");
  return source.replace(
    detailTarget,
    "<div className=\"flex justify-end\"><Link to={'/novels/' + novel.id + '/notes/new?page=' + novel.currentPage} className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700\">添加阅读笔记</Link></div>\n      <BookmarksList bookmarks={bookmarks || []} />",
  );
}

function patchNovelList(source) {
  const stateTarget = "const [statusFilter, setStatusFilter] = useState('all');";
  const filterTarget = "return novels.filter((novel) => statusFilter === 'all' || novel.status === statusFilter);";
  const dependencyTarget = "  }, [novels, statusFilter]);";
  const headingTarget = "<p className=\"text-sm text-gray-500 mt-1\">共 {novels?.length || 0} 本小说</p>";
  assertContains(source, stateTarget, "NovelList state");
  assertContains(source, filterTarget, "NovelList filter");
  assertContains(source, dependencyTarget, "NovelList filter dependencies");
  assertContains(source, headingTarget, "NovelList heading");
  return source
    .replace(stateTarget, `${stateTarget}\n  const [query, setQuery] = useState('');`)
    .replace(filterTarget, "return novels.filter((novel) => (statusFilter === 'all' || novel.status === statusFilter) && (novel.title.includes(query) || novel.author.includes(query)));" )
    .replace(dependencyTarget, "  }, [novels, statusFilter, query]);")
    .replace(headingTarget, `${headingTarget}\n          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder=\"搜索书名或作者\" className=\"mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm\" />`);
}

function patchNovelTable(source) {
  const importTarget = "import { Book, Clock, MoreVertical } from 'lucide-react';";
  const rowTarget = "onClick={() => onRowClick?.(novel)}";
  const actionTarget = "<td className=\"py-3 px-4\">\n                  <button className=\"p-1 hover:bg-gray-100 rounded\">\n                    <MoreVertical className=\"h-4 w-4 text-gray-400\" />\n                  </button>\n                </td>";
  const tableTarget = "<table className=\"w-full\">";
  const imageTarget = "src={novel.coverImage}";
  assertContains(source, importTarget, "NovelTable icon import");
  assertContains(source, rowTarget, "NovelTable row action");
  assertContains(source, actionTarget, "NovelTable trailing action");
  assertContains(source, imageTarget, "NovelTable cover image");
  assertContains(source, tableTarget, "NovelTable scroll width");
  return source
    .replace(importTarget, "import { Book, Clock } from 'lucide-react';\nimport { Link } from 'react-router-dom';")
    .replace(rowTarget, "onClick={() => onRowClick?.(novel)}\n                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onRowClick?.(novel); } }}\n                tabIndex={0}\n                role=\"button\"\n                aria-label={'打开 ' + novel.title}")
    .replace(imageTarget, "src={novel.coverImage || '/book-cover.svg'}")
    .replace("<span className=\"font-medium text-gray-900\">{novel.title}</span>", "<Link to={'/novels/' + novel.id} onClick={(event) => event.stopPropagation()} className=\"font-medium text-blue-700 hover:underline\">{novel.title}</Link>")
    .replace(actionTarget, "<td className=\"py-3 px-4 text-right\"><span className=\"text-xs text-gray-400\">打开详情</span></td>")
    .replace(tableTarget, "<table className=\"w-full min-w-[560px]\">");
}

function patchNovelData(source) {
  const matches = source.match(/coverImage: 'https:\/\/images\.unsplash\.com\/[^']+'/g) ?? [];
  if (matches.length === 0) {
    throw new Error("Novel data has no remote cover images to normalize");
  }
  return source.replace(/coverImage: 'https:\/\/images\.unsplash\.com\/[^']+'/g, "coverImage: '/book-cover.svg'");
}

function patchMainLayout(source) {
  const containerTarget = "<div className='max-w-6xl mx-auto px-6 py-4 flex items-center justify-between'>";
  const titleTarget = "<span className='text-xl font-bold text-gray-900'>小说阅读管理器</span>";
  const navTarget = "<nav className='flex items-center gap-6'>";
  const toolsTarget = "<div className='flex items-center gap-4'>";
  const searchTarget = "<div className='relative'>";
  assertContains(source, containerTarget, "MainLayout header container");
  assertContains(source, titleTarget, "MainLayout title");
  assertContains(source, navTarget, "MainLayout navigation");
  assertContains(source, toolsTarget, "MainLayout utility tools");
  assertContains(source, searchTarget, "MainLayout search tool");
  return source
    .replace(containerTarget, "<div className='max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4'>")
    .replace("<Link to='/' className='flex items-center gap-2'>", "<Link to='/' className='flex min-w-0 items-center gap-2'>")
    .replace(titleTarget, "<span className='truncate whitespace-nowrap text-sm font-bold text-gray-900 sm:text-xl'>小说阅读管理器</span>")
    .replace(navTarget, "<nav className='flex shrink-0 items-center gap-3 sm:gap-6'>")
    .replace(toolsTarget, "<div className='flex shrink-0 items-center gap-2 sm:gap-4'>")
    .replace(searchTarget, "<div className='relative hidden sm:block'>");
}

function patchCaseEntry(source) {
  const normalized = source.replace(/\r\n/g, "\n");
  const nocheckTarget = "// @ts-nocheck\n";
  const boundaryTarget = `class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {`;
  const rootTarget = "const root = createRoot(document.getElementById(\"root\") as HTMLElement);";
  assertContains(normalized, nocheckTarget, "case entry ts-nocheck directive");
  assertContains(normalized, boundaryTarget, "case entry error boundary");
  assertContains(normalized, rootTarget, "case entry root lookup");
  return normalized
    .replace(nocheckTarget, "")
    .replace(boundaryTarget, `interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {`)
    .replace(rootTarget, `const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("案例入口缺少 root 元素");
}
const root = createRoot(rootElement);`);
}

function patchFilterPanel(source) {
  const panelTarget = "<div className=\"flex items-center gap-4 p-4 bg-gray-50 rounded-lg\">";
  const optionsTarget = "<div className=\"flex gap-2\">";
  const buttonTarget = "className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${";
  assertContains(source, panelTarget, "FilterPanel container");
  assertContains(source, optionsTarget, "FilterPanel options");
  assertContains(source, buttonTarget, "FilterPanel buttons");
  return source
    .replace(panelTarget, "<div className=\"flex items-center gap-3 overflow-hidden rounded-lg bg-gray-50 p-3 sm:gap-4 sm:p-4\">")
    .replace("<div className=\"flex items-center gap-2 text-gray-600\">", "<div className=\"flex shrink-0 items-center gap-2 text-gray-600\">")
    .replace(optionsTarget, "<div className=\"flex min-w-0 gap-2 overflow-x-auto pb-1\">")
    .replace(buttonTarget, "className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm rounded-lg transition-colors ${");
}

async function main() {
  const [app, index, templateStyles, dependency, structure, types, mockData, service, hooks, components, pages, layouts, utils, generatedStyles, coverAsset] = await Promise.all([
    readJson("appGenResult.json"),
    readText(join(templateDir, "index.tsx")),
    readText(join(templateDir, "styles.css")),
    readJson("dependencyResult.json"),
    readJson("structureResult.json"),
    readJson("typeResult.json"),
    readJson("mockDataResult.json"),
    readJson("serviceResult.json"),
    readJson("hooksResult.json"),
    readJson("compGenResult.json"),
    readJson("pageGenResult.json"),
    readJson("layoutResult.json"),
    readJson("utilsResult.json"),
    readJson("styleGenResult.json"),
    readText(coverAssetPath),
  ]);
  const files = {};
  add(files, "/index.tsx", patchCaseEntry(index));
  add(files, "/styles.css", templateStyles);
  add(files, "/book-cover.svg", coverAsset);
  add(files, app.path, app.content);
  addFileList(files, utils.files, "code");
  if (generatedStyles.path !== undefined && generatedStyles.content !== undefined) {
    add(files, `/${generatedStyles.path.replace(/^\/+/, "")}`, generatedStyles.content);
  } else {
    throw new Error("Novel case assembly is missing generated styles");
  }
  addFileList(files, types.files, "code");
  addFileList(files, mockData.files);
  addFileList(files, service.files);
  addFileList(files, hooks.files);
  addFileList(files, components.componentsCode);
  addFileList(files, pages.pagesCode);
  addFileList(files, layouts.layoutsCode);
  files["/services/novelService.ts"] = patchNovelService(files["/services/novelService.ts"]);
  files["/services/readingNoteService.ts"] = patchNoteService(files["/services/readingNoteService.ts"]);
  files["/services/bookmarkService.ts"] = patchBookmarkService(files["/services/bookmarkService.ts"]);
  files["/pages/NovelForm.tsx"] = patchNovelForm(files["/pages/NovelForm.tsx"]);
  files["/pages/NoteForm.tsx"] = patchNoteForm(files["/pages/NoteForm.tsx"]);
  files["/pages/ReadingWorkspace.tsx"] = patchReadingWorkspace(files["/pages/ReadingWorkspace.tsx"]);
  files["/pages/NovelDetail.tsx"] = patchNovelDetail(files["/pages/NovelDetail.tsx"]);
  files["/pages/NovelList.tsx"] = patchNovelList(files["/pages/NovelList.tsx"]);
  files["/components/NovelTable.tsx"] = patchNovelTable(files["/components/NovelTable.tsx"]);
  files["/layouts/MainLayout.tsx"] = patchMainLayout(files["/layouts/MainLayout.tsx"]);
  files["/components/FilterPanel.tsx"] = patchFilterPanel(files["/components/FilterPanel.tsx"]);
  files["/data/novels.ts"] = patchNovelData(files["/data/novels.ts"]);
  const packageJson = JSON.parse(await readText(join(templateDir, "package.json")));
  packageJson.dependencies["react-router-dom"] = "^6.28.0";
  add(files, "/package.json", JSON.stringify(packageJson, null, 2));
  const expectedMinimum = structure.files.length;
  if (Object.keys(files).length < expectedMinimum) {
    throw new Error(`Novel case assembly produced ${Object.keys(files).length} files; expected at least ${expectedMinimum}`);
  }

  await mkdir(generatedDir, { recursive: true });
  await rm(join(generatedDir, "book-cover.svg"), { force: true });
  await rm(join(generatedDir, "public", "book-cover.svg"), { force: true });
  for (const [path, content] of Object.entries(files)) {
    const output = join(generatedDir, path.slice(1));
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, content, "utf8");
  }
  const serialized = `/* Generated by scripts/assembleNovelCase.mjs from backend/mock. */\nexport const NOVEL_CASE_FILES = ${JSON.stringify(files, null, 2)} as const;\n`;
  await writeFile(outputFile, serialized, "utf8");
  await writeFile(join(generatedDir, "manifest.json"), JSON.stringify({
    schemaVersion: 1,
    caseId: "novel-reading-management",
    source: "backend/mock",
    files: Object.keys(files),
    resources: [createResourceMetadata(coverAsset)],
    patched: ["NovelForm", "NoteForm", "NovelList", "NovelDetail", "ReadingWorkspace", "novelService", "readingNoteService", "bookmarkService", "MainLayout", "FilterPanel"],
  }, null, 2), "utf8");
  console.log(`Assembled ${Object.keys(files).length} novel case files from backend/mock`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
