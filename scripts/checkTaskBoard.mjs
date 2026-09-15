#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { classifyAssertionFailure } from "./lib/taskBoardAssertion.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const URL = process.env.TASK_BOARD_URL ?? readArgument("--url");
const SELECTORS = Object.freeze({
  root: '[data-testid="task-board"]',
  title: '[data-testid="task-board-title"]',
  columns: '[data-testid="task-column"]',
  list: '[data-testid="task-list"]',
  add: '[data-testid="task-add"]',
  form: '[data-testid="task-form"]',
  titleInput: '[data-testid="task-title"]',
  submit: '[data-testid="task-submit"]',
  edit: '[data-testid="task-edit"]',
  status: '[data-testid="task-status"]',
  filter: '[data-testid="task-filter"]',
  empty: '[data-testid="task-empty"]',
  formError: '[data-testid="task-form-error"]',
});

const ASSERTION_DEFINITIONS = [
  ["entry", "入口可达"],
  ["columns", "列和任务列表可见"],
  ["add", "新增任务"],
  ["edit", "编辑任务"],
  ["status", "切换任务状态"],
  ["filter", "关键词筛选"],
  ["empty-and-validation", "空状态和表单校验"],
  ["title-retention", "看板标题保留"],
];

class NotVerifiedError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotVerifiedError";
  }
}

async function main() {
  const assertions = ASSERTION_DEFINITIONS.map(([id, label]) => ({ id, label, status: "not-verified", evidence: "未执行" }));
  const playwright = loadPlaywright();
  const environment = {
    url: URL ?? null,
    playwrightAvailable: playwright !== undefined,
    selectorContract: "data-testid/task-board-v1",
    samplePool: "FIXED-INTERACTION",
  };

  if (playwright === undefined) {
    for (const assertion of assertions) assertion.evidence = "未安装 Playwright，固定任务板交互保持 skipped/not-verified";
    return printResult(environment, assertions);
  }
  if (URL === undefined || URL.length === 0) {
    for (const assertion of assertions) assertion.evidence = "未配置 TASK_BOARD_URL/--url，未连接真实任务板页面";
    return printResult(environment, assertions);
  }

  let browser;
  let assertionFailure;
  try {
    browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await runAssertion(assertions[0], () => verifyEntry(page, assertions[0]));
    await runAssertion(assertions[1], () => verifyColumns(page, assertions[1]));
    const title = await readBoardTitle(page);
    await runAssertion(assertions[2], () => verifyAdd(page, assertions[2]));
    await runAssertion(assertions[3], () => verifyEdit(page, assertions[3]));
    await runAssertion(assertions[4], () => verifyStatus(page, assertions[4]));
    await runAssertion(assertions[5], () => verifyFilter(page, assertions[5]));
    await runAssertion(assertions[6], () => verifyEmptyAndValidation(page, assertions[6]));
    await runAssertion(assertions[7], () => verifyTitleRetention(page, assertions[7], title));
  } catch (error) {
    if (assertionFailure === undefined) {
      const result = classifyAssertionFailure(error, true);
      for (const assertion of assertions) {
        if (assertion.status === "not-verified" || assertion.status === "skipped") assertion.evidence = result.evidence;
      }
    } else {
      const failed = assertionFailure.assertion;
      for (const assertion of assertions) {
        if (assertion !== failed && (assertion.status === "not-verified" || assertion.status === "skipped")) {
          assertion.evidence = `未执行：断言 ${failed.id} 已${failed.status === "fail" ? "失败" : "未验证"}`;
        }
      }
    }
  } finally {
    await browser?.close();
  }
  return printResult(environment, assertions);

  async function runAssertion(assertion, action) {
    try {
      await action();
    } catch (error) {
      const result = classifyAssertionFailure(error);
      assertion.status = result.status;
      assertion.evidence = result.evidence;
      assertionFailure = { assertion, result };
      throw error;
    }
  }
}

async function verifyEntry(page, assertion) {
  await expectVisible(page, SELECTORS.root, "任务板根节点");
  assertion.status = "pass";
  assertion.evidence = `${SELECTORS.root} 可见`;
}

async function verifyColumns(page, assertion) {
  const columns = await page.locator(SELECTORS.columns).count();
  const lists = await page.locator(SELECTORS.list).count();
  if (columns < 3 || lists < 1) throw new Error(`需要至少 3 列和 1 个任务列表，当前 columns=${columns}, lists=${lists}`);
  assertion.status = "pass";
  assertion.evidence = `columns=${columns}, lists=${lists}`;
}

async function verifyAdd(page, assertion) {
  const title = `phase-d-task-${Date.now()}`;
  await expectVisible(page, SELECTORS.add, "新增按钮");
  await page.locator(SELECTORS.add).click();
  await expectVisible(page, SELECTORS.form, "新增表单");
  await page.locator(SELECTORS.titleInput).fill(title);
  await page.locator(SELECTORS.submit).click();
  if (await page.getByText(title, { exact: true }).count() === 0) throw new Error("新增任务标题未出现在列表中");
  assertion.status = "pass";
  assertion.evidence = `新增任务 ${title} 后列表可见`;
}

async function verifyEdit(page, assertion) {
  const editButton = page.locator(SELECTORS.edit).first();
  await expectVisibleLocator(editButton, "编辑按钮");
  await editButton.click();
  await expectVisible(page, SELECTORS.form, "编辑表单");
  const input = page.locator(SELECTORS.titleInput);
  const value = await input.inputValue();
  const edited = `${value}-edited`;
  await input.fill(edited);
  await page.locator(SELECTORS.submit).click();
  if (await page.getByText(edited, { exact: true }).count() === 0) throw new Error("编辑后的任务标题未出现在列表中");
  assertion.status = "pass";
  assertion.evidence = `编辑后标题 ${edited} 可见`;
}

async function verifyStatus(page, assertion) {
  const control = page.locator(SELECTORS.status).first();
  await expectVisibleLocator(control, "状态控件");
  const before = await control.inputValue().catch(() => "");
  try {
    await control.selectOption({ label: "进行中" });
  } catch {
    await control.click();
    const option = page.getByRole("option", { name: "进行中" }).first();
    await expectVisibleLocator(option, "进行中选项");
    await option.click();
  }
  const after = await control.inputValue().catch(() => "");
  if (after.length === 0 || after === before) throw new Error(`状态值没有变化：${before} -> ${after}`);
  assertion.status = "pass";
  assertion.evidence = `状态值由 ${before || "空"} 切换为 ${after}`;
}

async function verifyFilter(page, assertion) {
  const filter = page.locator(SELECTORS.filter);
  await expectVisibleLocator(filter, "关键词筛选输入");
  await filter.fill("edited");
  const list = page.locator(SELECTORS.list).first();
  await expectVisibleLocator(list, "筛选后的任务列表");
  if (await page.getByText(/edited/, { exact: false }).count() === 0) throw new Error("筛选关键词没有保留匹配任务");
  assertion.status = "pass";
  assertion.evidence = "填写 edited 后列表仍显示匹配任务";
}

async function verifyEmptyAndValidation(page, assertion) {
  const filter = page.locator(SELECTORS.filter);
  await filter.fill("__phase_d_no_match__");
  await expectVisible(page, SELECTORS.empty, "筛选空状态");
  await page.locator(SELECTORS.add).click();
  await expectVisible(page, SELECTORS.form, "空标题表单");
  await page.locator(SELECTORS.titleInput).fill("");
  await page.locator(SELECTORS.submit).click();
  await expectVisible(page, SELECTORS.formError, "表单错误");
  assertion.status = "pass";
  assertion.evidence = "无匹配关键词显示空状态，空标题提交显示表单错误";
}

async function verifyTitleRetention(page, assertion, title) {
  if (title === null) throw new NotVerifiedError("页面没有固定标题选择器，无法核对标题保留");
  const current = await readBoardTitle(page);
  if (current !== title) throw new Error(`看板标题发生变化：${title} -> ${current ?? "空"}`);
  assertion.status = "pass";
  assertion.evidence = `标题保持为 ${title}`;
}

async function readBoardTitle(page) {
  const title = page.locator(SELECTORS.title).first();
  if (await title.count() === 0) return null;
  if (!(await title.isVisible())) return null;
  return (await title.innerText()).trim();
}

async function expectVisible(page, selector, label) {
  await expectVisibleLocator(page.locator(selector).first(), label);
}

async function expectVisibleLocator(locator, label) {
  if (await locator.count() === 0 || !(await locator.isVisible())) throw new NotVerifiedError(`${label}不符合固定任务板选择器契约`);
}

function loadPlaywright() {
  const requests = ["playwright", "@playwright/test"];
  const requires = [
    createRequire(import.meta.url),
    createRequire(path.join(ROOT_DIR, "frontend/package.json")),
    createRequire(path.join(ROOT_DIR, "backend/package.json")),
  ];
  for (const localRequire of requires) {
    for (const request of requests) {
      try {
        const loaded = localRequire(request);
        if (loaded?.chromium !== undefined) return loaded;
      } catch {
        // The fixed check reports unavailable instead of installing or guessing a runner.
      }
    }
  }
  return undefined;
}

function printResult(environment, assertions) {
  const counts = assertions.reduce((result, assertion) => {
    result[assertion.status] = (result[assertion.status] ?? 0) + 1;
    return result;
  }, {});
  console.log(JSON.stringify({ tool: "checkTaskBoard", environment, assertions, summary: counts }, null, 2));
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  const value = index < 0 ? undefined : process.argv[index + 1];
  return value === undefined || value.startsWith("--") ? undefined : value;
}

function safeMessage(error) {
  return error instanceof Error ? error.message : "未知错误";
}

main().catch((error) => {
  console.error(`checkTaskBoard failed: ${safeMessage(error)}`);
  process.exitCode = 1;
});
