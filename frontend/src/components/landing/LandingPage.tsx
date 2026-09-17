"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import styles from "./LandingPage.module.css";

export function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
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
      </header>

      <main>
        <section className={styles.hero} id="hero-case">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" />前端原型工作台</p>
            <h1><span>从一个想法，到</span><span>可交互的前端原型。</span></h1>
            <p className={styles.heroLede}>
              描述需求，查看结果，继续调整。PromptForge 把场景、数据和关键动作整理成可预览的页面与代码。
            </p>
            <div className={styles.tagRow} aria-label="支持技术">
              <span>React</span>
              <span>TypeScript</span>
            </div>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href="/workspace?case=customer-management-demo">
                查看案例 <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link className={styles.secondaryButton} href="/workspace">
                开始生成 <ChevronRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <p className={styles.heroNote}>示例是固定成果；真实请求会调用模型，并先进入可确认的候选。</p>
          </div>

          <Link className={styles.heroVisual} href="/workspace?case=customer-management-demo" aria-label="打开客户管理后台案例">
            <span className={styles.visualLabel}>
              <span className={styles.statusDot} aria-hidden="true" />
              案例预览
              <span className={styles.visualSource}>预生成成果 · 待浏览器验收</span>
            </span>
            <span className={styles.visualFrame}>
              <span className={styles.demoHeroPreview} aria-hidden="true">
                <span className={styles.demoHeroTop}><strong>客户管理后台</strong><small>客户目录</small></span>
                <span className={styles.demoHeroMetrics}>
                  <span><strong>248</strong><small>客户总数</small></span>
                  <span><strong>32</strong><small>本月新增</small></span>
                  <span><strong>86%</strong><small>活跃率</small></span>
                </span>
                <span className={styles.demoHeroRows}>
                  <span /><span /><span />
                </span>
              </span>
            </span>
            <span className={styles.visualCaption}>
              <span><strong>客户管理后台</strong><small>搜索、筛选与客户详情</small></span>
              <ArrowRight size={17} aria-hidden="true" />
            </span>
          </Link>
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
            <p>已有案例成果可以直接进入工作台体验；首页浏览不会启动 Sandpack 或新的生成请求。</p>
          </div>

          <div className={styles.demoCaseGrid} aria-label="案例入口">
            <article className={styles.demoCaseCard}>
              <p className={styles.cardKicker}>案例 01 · 真实生成后固化 · 待浏览器验收</p>
              <h3>客户管理后台</h3>
              <p>搜索、状态筛选、新增校验、编辑同步与详情抽屉。</p>
              <Link className={styles.cardLink} href="/workspace?case=customer-management-demo">打开客户管理后台 <ArrowRight size={15} aria-hidden="true" /></Link>
            </article>
            <article className={styles.demoCaseCard}>
              <p className={styles.cardKicker}>案例 02 · 真实生成后固化 · 待浏览器验收</p>
              <h3>数据分析看板</h3>
              <p>固定演示数据、日期联动指标、趋势与分类图。</p>
              <Link className={styles.cardLink} href="/workspace?case=analytics-dashboard-demo">打开数据分析看板 <ArrowRight size={15} aria-hidden="true" /></Link>
            </article>
            <article className={styles.demoCaseCard}>
              <p className={styles.cardKicker}>案例 03 · 真实生成后固化 · 待浏览器验收</p>
              <h3>个人博客</h3>
              <p>文章列表、分类搜索、详情返回与明暗阅读主题。</p>
              <Link className={styles.cardLink} href="/workspace?case=personal-blog-demo">打开个人博客 <ArrowRight size={15} aria-hidden="true" /></Link>
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
