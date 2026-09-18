"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleUserRound,
  Code2,
  Eye,
  FileText,
  LayoutDashboard,
  Play,
  Plus,
  Search,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import styles from "./LandingPage.module.css";

function ProductPreview() {
  return (
    <Link className={styles.heroProduct} href="/workspace?case=customer-management-demo" aria-label="打开客户管理后台案例">
      <div className={styles.windowChrome}><span /><span /><span /><small>客户管理后台 · PromptForge</small><CircleUserRound size={16} aria-hidden="true" /></div>
      <div className={styles.productLayout}>
        <aside className={styles.productSidebar}>
          <div className={styles.miniBrand}><span className={styles.miniBrandMark}><Sparkles size={11} /></span><strong>PromptForge</strong></div>
          <div className={styles.sidebarNew}><Plus size={13} /> 新建项目</div>
          <p>工作台</p><span className={styles.sidebarItemActive}><LayoutDashboard size={13} /> 概览</span><span className={styles.sidebarItem}><Users size={13} /> 客户管理</span><span className={styles.sidebarItem}><BarChart3 size={13} /> 数据分析</span>
          <p>最近项目</p><span className={styles.sidebarItem}><FileText size={13} /> 个人博客</span><span className={styles.sidebarItem}><Code2 size={13} /> 阅读清单</span>
        </aside>
        <div className={styles.productMain}>
          <div className={styles.productTopbar}><span>项目 / 客户管理后台</span><span className={styles.topbarAvatar}>陈</span></div>
          <div className={styles.productIntro}><div><span className={styles.productKicker}>客户管理</span><h3>客户管理后台</h3><p>轻松管理客户信息、跟进状态和团队协作。</p></div><span className={styles.productButton}><Sparkles size={12} /> 生成页面 <ArrowRight size={12} /></span></div>
          <div className={styles.productTabs}><span className={styles.productTabActive}><Eye size={12} /> 预览</span><span><Code2 size={12} /> 代码</span><span><WandSparkles size={12} /> 调整</span></div>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}><strong>客户列表</strong><span className={styles.tableSearch}><Search size={11} /> 搜索客户...</span><span className={styles.tableAdd}><Plus size={11} /> 新增客户</span></div>
            <div className={styles.tableLabels}><span>客户</span><span>邮箱</span><span>状态</span></div>
            <div className={styles.tableRow}><span className={styles.person}><i className={styles.avatarBlue}>张</i><b>张三</b></span><span>zhangsan@acme.com</span><em>活跃</em></div>
            <div className={styles.tableRow}><span className={styles.person}><i className={styles.avatarPurple}>李</i><b>李四</b></span><span>lisi@company.com</span><em>活跃</em></div>
            <div className={styles.tableRow}><span className={styles.person}><i className={styles.avatarOrange}>王</i><b>王晓</b></span><span>wangxiao@startup.com</span><em>跟进中</em></div>
            <div className={styles.tableRow}><span className={styles.person}><i className={styles.avatarGreen}>赵</i><b>赵六</b></span><span>zhaoliu@demo.com</span><em>活跃</em></div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CustomerCasePreview() {
  return <div className={styles.caseMockCustomer}><div className={styles.caseMockNav}><span /><span /><span /><i /></div><div className={styles.caseMockBody}><aside><b>PromptForge</b><span /><span /><span /><span /><span /></aside><div><strong>客户管理</strong><div className={styles.caseMockLine} /><div className={styles.caseMockRows}><i /><i /><i /><i /></div></div></div></div>;
}

function AnalyticsCasePreview() {
  return <div className={styles.caseMockAnalytics}><div className={styles.caseMockNav}><span /><span /><span /><i /></div><div className={styles.caseMockAnalyticsBody}><strong>数据分析看板</strong><div className={styles.metricRow}><i /><i /><i /></div><div className={styles.chartArea}><div className={styles.lineChart}><span /><span /><span /><span /><span /></div><div className={styles.barChart}><i /><i /><i /><i /><i /><i /></div></div></div></div>;
}

function BlogCasePreview() {
  return <div className={styles.caseMockBlog}><div className={styles.caseMockNav}><span /><span /><span /><i /></div><div className={styles.blogImage}><small>清川的博客</small><strong>在山野与日常之间<br />寻找新的灵感</strong></div><div className={styles.blogLines}><i /><i /><i /></div></div>;
}

export function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <Link className={styles.brand} href="/" aria-label="PromptForge 首页"><span className={styles.brandMark}><Image src="/logo.png" alt="" width={30} height={30} priority className={styles.brandMarkImage} /></span><strong>PromptForge</strong><span className={styles.brandBeta}>Beta</span></Link>
        <nav className={styles.navLinks} aria-label="主导航"><a href="#workflow">产品</a><a href="#examples">案例</a></nav>
        <div className={styles.navActions}><Link className={styles.navCta} href="/workspace">开始使用 <ArrowRight size={14} /></Link></div>
      </header>

      <main>
        <section className={styles.hero} id="hero">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroCopy}><p className={styles.eyebrow}>AI FRONTEND WORKSPACE</p><h1>从一个想法，<br />到可交互的前端原型。</h1><p className={styles.heroLede}>用自然语言描述你的需求，PromptForge 帮你生成可预览、可编辑、可导出的 React 页面。让想法更快变成可用的产品原型。</p><div className={styles.actions}><Link className={styles.primaryButton} href="/workspace">开始生成 <ArrowRight size={16} /></Link><a className={styles.secondaryButton} href="#workflow"><Play size={15} /> 查看演示</a></div><div className={styles.heroPoints}><span><Check size={14} /> 支持 React / TypeScript</span><span><Check size={14} /> 结果可预览、可编辑</span><span><Check size={14} /> 项目保存至本地</span></div></div>
          <div className={styles.heroVisualWrap}><p className={styles.heroAnnotation}>用自然语言<br />生成真实的前端页面 <ArrowRight size={18} /></p><ProductPreview /></div>
        </section>

        <section className={styles.techStrip} aria-label="支持的技术栈"><p>基于你熟悉的技术栈，生成可直接使用的代码</p><div><span className={styles.techReact}><i>⚛</i> React</span><span className={styles.techTypeScript}><i>TS</i> TypeScript</span><span className={styles.techTailwind}><i>≈</i> Tailwind CSS</span><span className={styles.techVite}><i>◆</i> Vite</span><span className={styles.techShadcn}><i>╱</i> shadcn/ui</span><span className={styles.techRadix}><i>▮</i> Radix UI</span></div></section>

        <section className={`${styles.section} ${styles.workflowSection}`} id="workflow"><div className={styles.sectionHeading}><p className={styles.sectionKicker}>HOW IT WORKS</p><h2>三步完成，从想法到可用页面</h2><p>无需复杂配置，专注于你的创意。</p></div><div className={styles.stepGrid}>
          <article className={styles.stepCard}><div className={styles.stepTitle}><span>01</span><i /></div><h3>描述需求</h3><p>用自然语言告诉我们你想要什么，可以是一句话、一段需求文档，或者一张截图。</p><div className={`${styles.workflowVisual} ${styles.promptVisual}`}><div className={styles.promptTabs}><span>文案输入</span><span>上传图片</span></div><div className={styles.promptText}>帮我生成一个客户管理系统，包含左侧导航、客户列表、搜索筛选和新增客户功能，风格简洁现代化。</div><button type="button"><ArrowRight size={15} /></button></div></article>
          <article className={styles.stepCard}><div className={styles.stepTitle}><span>02</span><i /></div><h3>查看结果</h3><p>AI 自动生成可交互的页面，你可以实时预览效果，检查是否符合预期。</p><div className={`${styles.workflowVisual} ${styles.resultVisual}`}><div className={styles.browserDots}><i /><i /><i /></div><strong>客户管理</strong><div className={styles.resultToolbar}><span /><b>+ 新增客户</b></div><div className={styles.resultRows}><i /><i /><i /></div></div></article>
          <article className={styles.stepCard}><div className={styles.stepTitle}><span>03</span><i /></div><h3>继续完善</h3><p>通过自然语言继续修改，调整样式、补充功能，直到满意为止。</p><div className={`${styles.workflowVisual} ${styles.reviseVisual}`}><div className={styles.reviseBubble}>把表格改成卡片样式，并增加编辑功能</div><p>正在生成新的版本...</p><div className={styles.progressBar}><span /></div><div className={styles.doneLine}><Check size={12} /> 已完成！你可以在右侧预览新效果。</div></div></article>
        </div></section>

        <section className={`${styles.section} ${styles.examplesSection}`} id="examples"><div className={styles.sectionHeadingRow}><div className={styles.sectionHeading}><p className={styles.sectionKicker}>REAL EXAMPLES</p><h2>看看他们用 PromptForge 做了什么</h2><p>从真实需求出发，生成可直接使用的前端页面。</p></div><Link className={styles.textLink} href="/workspace">查看更多案例 <ArrowRight size={15} /></Link></div><div className={styles.caseGrid}>
          <Link className={styles.caseCard} href="/workspace?case=customer-management-demo"><div className={styles.caseVisual}><CustomerCasePreview /></div><div className={styles.caseBody}><h3>客户管理后台</h3><p>完整的客户管理系统，包含数据搜集、搜索筛选和编辑互动功能。</p><div className={styles.cardTags}><span>React</span><span>TypeScript</span><span>Tailwind</span><b><ArrowRight size={14} /></b></div></div></Link>
          <Link className={styles.caseCard} href="/workspace?case=analytics-dashboard-demo"><div className={styles.caseVisual}><AnalyticsCasePreview /></div><div className={styles.caseBody}><h3>数据分析看板</h3><p>可视化数据看板，包含图表、指标卡片和时间筛选功能。</p><div className={styles.cardTags}><span>React</span><span>Recharts</span><span>Tailwind</span><b><ArrowRight size={14} /></b></div></div></Link>
          <Link className={styles.caseCard} href="/workspace?case=personal-blog-demo"><div className={styles.caseVisual}><BlogCasePreview /></div><div className={styles.caseBody}><h3>个人博客网站</h3><p>现代化的个人博客，支持文章列表、详情页和标签分类。</p><div className={styles.cardTags}><span>Next.js</span><span>TypeScript</span><span>MDX</span><b><ArrowRight size={14} /></b></div></div></Link>
        </div></section>

        <section className={`${styles.section} ${styles.testimonialsSection}`} id="testimonials"><div className={styles.sectionHeading}><p className={styles.sectionKicker}>WHAT USERS SAY</p><h2>开发者们怎么说</h2><p>来自真实用户的使用体验</p></div><div className={styles.testimonialGrid}><article><div className={styles.user}><span className={styles.userAvatar}>陈</span><span><b>@chenjiahao</b><small>独立开发者</small></span></div><p>“用自然语言就能生成这么完整的页面，真的很惊艳。节省了我大量的开发时间！”</p></article><article><div className={styles.user}><span className={`${styles.userAvatar} ${styles.userAvatarPink}`}>林</span><span><b>@linxiaoyu</b><small>产品经理</small></span></div><p>“原型设计从天想到几个小时，现在可以更快地验证我们的想法了。”</p></article><article><div className={styles.user}><span className={`${styles.userAvatar} ${styles.userAvatarGold}`}>王</span><span><b>@wangzhe</b><small>前端工程师</small></span></div><p>“生成的代码结构清晰，直接就能用在项目里，完全超出预期。”</p></article></div></section>

        <section className={styles.cta} id="pricing"><div><p className={styles.sectionKicker}>READY TO BUILD</p><h2>把你的<span>想法</span>，变成真实的页面。</h2><p>现在就开始，用 AI 加速你的产品开发。</p></div><Link className={styles.ctaButton} href="/workspace">开始使用 <ArrowRight size={16} /></Link></section>
      </main>

      <footer className={styles.footer}><div className={styles.footerBrand}><Link className={styles.brand} href="/"><span className={styles.brandMark}><Image src="/logo.png" alt="" width={25} height={25} className={styles.brandMarkImage} /></span><strong>PromptForge</strong><span className={styles.brandBeta}>Beta</span></Link><p>用 AI 连接想法与产品。</p></div><p className={styles.copyright}>© 2024 PromptForge. 让每一个想法，都能更快变成现实。</p></footer>
    </div>
  );
}
