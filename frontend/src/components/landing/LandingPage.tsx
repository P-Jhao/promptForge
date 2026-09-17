"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import styles from "./LandingPage.module.css";

const novelFeatures = ["书名与作者搜索", "阅读状态筛选", "进度、笔记与书签"];
const taskBoardFeatures = ["三列任务看板", "关键词与优先级筛选", "新增、编辑与状态切换"];

export function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.navShell}>
        <div className={styles.nav}>
          <Link className={styles.brand} href="/" aria-label="PromptForge 首页">
            <span className={styles.brandMark}>
              <Image src="/logo.png" alt="PromptForge 标志" width={30} height={30} priority className={styles.brandMarkImage} />
            </span>
            <span>PromptForge</span>
            <span className={styles.brandBeta}>Beta</span>
          </Link>
          <nav className={styles.navLinks} aria-label="主导航">
            <a href="#hero-case">案例</a>
            <a href="#workflow">流程</a>
            <Link href="/workspace">工作台</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={styles.heroShell} id="hero-case">
          <div className={styles.hero}>
            <div className={styles.heroGlow} aria-hidden="true" />
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}><span aria-hidden="true" />前端原型工作台</p>
              <h1><span>从一个想法，到</span><span><em className={styles.gradientText}>可交互的前端原型</em>。</span></h1>
              <p className={styles.heroLede}>
                描述需求，查看结果，继续调整。PromptForge 把场景、数据和关键动作整理成可预览的页面与代码。
              </p>
              <div className={styles.tagRow} aria-label="支持技术">
                <span>React</span>
                <span>TypeScript</span>
              </div>
              <div className={styles.actions}>
                <Link className={styles.primaryButton} href="/workspace?case=novel&scene=library">
                  查看案例 <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link className={styles.secondaryButton} href="/workspace">
                  开始生成 <ChevronRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <p className={styles.heroNote}>示例是固定成果；真实请求会调用模型，并先进入可确认的候选。</p>
            </div>

            <Link className={styles.heroVisual} href="/workspace?case=task-board-real-eval" aria-label="打开任务看板预生成成果">
              <span className={styles.visualLabel}>
                <span className={styles.statusDot} aria-hidden="true" />
                工作台实拍
                <span className={styles.visualSource}>预生成成果 · 人工修正</span>
              </span>
              <span className={styles.visualFrame}>
                <Image
                  src="/task-board-workspace.webp"
                  alt="任务看板工作台截图，展示看板列、筛选控件和任务卡片"
                  fill
                  sizes="(max-width: 820px) 100vw, 55vw"
                  className={styles.visualImage}
                  priority
                />
              </span>
              <span className={styles.visualCaption}>
                <span><strong>任务看板</strong><small>三列、筛选与任务卡片</small></span>
                <ArrowRight size={17} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>

        <section className={styles.proofBar} aria-label="当前能力">
          <div><Check size={15} aria-hidden="true" /><span>源码可读</span><small>React / TypeScript</small></div>
          <div><Check size={15} aria-hidden="true" /><span>结果可预览</span><small>确认后继续调整</small></div>
          <div><Check size={15} aria-hidden="true" /><span>项目可保存</span><small>本地浏览器手动保存</small></div>
        </section>

        <section className={styles.section} id="case-details">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionKicker}>CASE STUDY</p>
            <h2>先看已经做好的，再决定从哪里开始。</h2>
            <p>两份预置成果都可以直接进入工作台体验；它们展示的是已有结果，不会因首页浏览而启动 Sandpack 或新的生成请求。</p>
          </div>

          <div className={styles.caseGrid}>
            <article className={styles.caseCard}>
              <div className={`${styles.caseVisual} ${styles.novelVisual}`} aria-label="小说阅读管理能力示意">
                <div className={styles.novelVisualTop}><span>小说阅读管理</span><span>固定成果</span></div>
                <div className={styles.novelPanel}>
                  <div className={styles.mockSearch}><span>⌕</span> 搜索书名或作者 <b>阅读中⌄</b></div>
                  <div className={styles.mockBook}><span className={styles.bookCover} /><span><strong>星辰之上</strong><small>阅读中 · 68%</small></span><em>详情</em></div>
                  <div className={styles.mockBook}><span className={`${styles.bookCover} ${styles.bookCoverAlt}`} /><span><strong>远方的灯塔</strong><small>未开始 · 0%</small></span><em>详情</em></div>
                </div>
                <span className={styles.visualHint}>能力示意 · 无自动预览</span>
              </div>
              <div className={styles.caseBody}>
                <p className={styles.cardKicker}>案例 01 · 预置成果</p>
                <h3>小说阅读管理</h3>
                <p>书库、阅读详情和阅读页串起一条可操作的内容管理路径。</p>
                <ul>{novelFeatures.map((feature) => <li key={feature}><Check size={14} aria-hidden="true" />{feature}</li>)}</ul>
                <p className={styles.sourceNote}>来源：backend/mock 组装结果；补充了会话内交互与固定远程封面 URL，封面依赖网络。</p>
                <Link className={styles.cardLink} href="/workspace?case=novel&scene=library">体验小说案例 <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </article>

            <article className={styles.caseCard}>
              <div className={`${styles.caseVisual} ${styles.taskVisual}`}>
                <Image
                  src="/task-board-workspace.webp"
                  alt="任务看板工作台截图，展示三列任务和筛选控件"
                  fill
                  sizes="(max-width: 820px) 100vw, 50vw"
                  className={styles.cardImage}
                />
                <span className={styles.imageBadge}>实际工作台截图</span>
              </div>
              <div className={styles.caseBody}>
                <p className={styles.cardKicker}>案例 02 · 独立真实案例</p>
                <h3>任务看板</h3>
                <p>从真实 EVAL-01/EVAL-02 产物固化而来，经过必要的类型、样式和交互人工修正。</p>
                <ul>{taskBoardFeatures.map((feature) => <li key={feature}><Check size={14} aria-hidden="true" />{feature}</li>)}</ul>
                <p className={styles.sourceNote}>临时 Vite 人工验收覆盖上述交互；不代表 Sandpack、离线或原生 ZIP 已完整验证。</p>
                <Link className={styles.cardLink} href="/workspace?case=task-board-real-eval">打开任务看板案例 <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </article>
          </div>
        </section>

        <section className={`${styles.section} ${styles.workflowSection}`} id="workflow">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionKicker}>FROM WORDS TO UI</p>
            <h2>描述需求 → 查看结果 → 继续完善。</h2>
            <p>每一步都保留在工作台里，让你能看见结果、判断差异，再决定是否继续。</p>
          </div>
          <div className={styles.stepGrid}>
            <article><span>01</span><h3>描述需求</h3><p>说清楚用户、场景、数据和必须完成的动作。</p></article>
            <article><span>02</span><h3>查看结果</h3><p>在预览和源码之间切换，检查页面是否符合预期。</p></article>
            <article><span>03</span><h3>继续完善</h3><p>保留手动调整，再用新的描述提出下一次修改。</p></article>
          </div>
        </section>

        <section className={styles.capability}>
          <div className={styles.capabilityIntro}>
            <p className={styles.sectionKicker}>现在适合什么</p>
            <h2>从明确的小范围场景开始。</h2>
          </div>
          <div className={styles.capabilityGrid}>
            <div><h3>当前支持</h3><p>React / TypeScript 页面原型、预览、源码查看和候选确认。需求不清楚时会先请你补充信息。</p></div>
            <div><h3>保存边界</h3><p>项目数据使用当前浏览器的本地存储，并由用户手动保存；这不等于云同步或离线导出包。</p></div>
          </div>
        </section>

        <section className={styles.cta}>
          <div><p className={styles.sectionKicker}>READY TO BUILD</p><h2>带着一个具体页面，进入工作台。</h2><p>先从固定成果开始，再切换到真实体验描述自己的需求。</p></div>
          <Link className={styles.ctaButton} href="/workspace">开始生成 <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className={styles.footer}><span>PromptForge · AI 前端原型工作台</span><Link href="/workspace">进入工作台</Link></footer>
    </div>
  );
}
