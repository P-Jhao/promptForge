"use client";

import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { CasePreview } from "@/components/cases/CasePreview";
import type { NovelCaseScene } from "@/cases/novelCase";

export function LandingPage() {
  const [scene, setScene] = useState<NovelCaseScene>("library");

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link className="brand" href="/" aria-label="PromptForge 首页">
          <span className="brand-mark">P</span>
          <span>PromptForge</span>
          <span className="brand-beta">Beta</span>
        </Link>
        <nav aria-label="主导航">
          <a href="#hero-case">案例</a>
          <a href="#workflow">流程</a>
          <Link href="/workspace">工作台</Link>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="hero-eyebrow"><span />给前端开发者与产品原型用的生成工作台</div>
            <h1>把产品需求，变成可交互的 React 原型。</h1>
            <p className="hero-lede">
              用自然语言描述场景、数据和关键动作，PromptForge 会把需求拆成页面结构、组件和代码，让你在一个工作台里继续确认与调整。
            </p>
            <div className="hero-actions">
              <a className="button-primary" href="#hero-case">查看案例 <ArrowRight size={16} /></a>
              <Link className="button-secondary" href="/workspace">开始生成 <ChevronRight size={16} /></Link>
            </div>
            <p className="hero-note">预置案例无需调用模型；输入自己的需求后，才会发起一次新的生成请求。</p>
          </div>
          <div className="hero-case" id="hero-case">
            <CasePreview scene={scene} onSceneChange={setScene} compact />
          </div>
        </section>

        <section className="trust-row" aria-label="产品能力">
          <span><Check size={15} />前端开发者可读源码</span>
          <span><Check size={15} />需求到页面的完整链路</span>
          <span><Check size={15} />预览与源码一起交付</span>
        </section>

        <section className="landing-section" id="case-details">
          <div className="section-intro"><span className="section-kicker">CASE STUDY</span><h2>先看两份真实可操作的成果。</h2><p>首屏预览加载小说案例的两个场景；下方同时列出独立任务看板案例。每个入口都说明成果来源和人工修正范围，便于你判断哪些内容来自已有结果。</p></div>
          <div className="case-brief-grid">
            <article><span>需求摘要</span><h3>小说阅读管理</h3><p>书库支持书名或作者搜索、阅读状态筛选和详情入口；详情展示阅读进度、笔记与书签；阅读页支持翻页、字号、主题和会话内书签。</p></article>
            <article><span>人工修正说明</span><h3>让预置结果可以直接操作</h3><p>案例由 <code>backend/mock</code> 的节点结果组装而来，并补充了新增书籍、阅读笔记和书签的会话内写入、固定远程封面 URL、路由入口与边界提示。封面依赖网络；这里是需求摘要，不是原始完整 prompt；正文内容也只用于演示。</p></article>
            <article><span>独立真实案例</span><h3>任务看板</h3><p>案例来自真实 EVAL-01/EVAL-02 产物，并记录了人工修正；临时 Vite 人工验收覆盖三列、筛选、新增、编辑、校验和状态切换。它不代表 Sandpack、离线或原生 ZIP 已验证。</p><Link className="button-secondary" href="/workspace?case=task-board-real-eval">在工作台打开任务看板 <ArrowRight size={15} /></Link></article>
          </div>
        </section>

        <section className="landing-section" id="workflow">
          <div className="section-intro"><span className="section-kicker">FROM WORDS TO UI</span><h2>每一步都能看见正在发生什么。</h2><p>生成过程中会展示当前阶段、已完成步骤和失败位置，完成后再把文件交给预览与代码编辑器。</p></div>
          <div className="workflow-grid"><article><span>01</span><h3>描述需求</h3><p>说清楚用户、场景、数据和必须完成的动作。</p></article><article><span>02</span><h3>查看生成过程</h3><p>观察规划、组件和代码阶段，及时发现需求理解偏差。</p></article><article><span>03</span><h3>继续交付</h3><p>在浏览器里预览，打开文件查看实现，导出当前源码。</p></article></div>
        </section>

        <section className="boundary-section">
          <div><span className="section-kicker">现在适合什么</span><h2>从明确的小范围场景开始。</h2></div>
          <div className="boundary-columns"><div><h3>适合</h3><p>后台列表、表单、详情、仪表盘和产品流程原型。需求越具体，生成结果越容易评估。</p></div><div><h3>需要知道</h3><p>示例体验展示固定成果；真实请求会调用模型，可能耗时或失败，系统会结合当前项目和描述处理新页面、现有页面调整或问题讨论。生成或调整结果会先进入候选，确认应用后才更新预览；需求不清楚时会先请你补充信息。</p></div></div>
        </section>

        <section className="landing-cta"><div><span className="section-kicker">READY TO BUILD</span><h2>带着一个具体页面，进入工作台。</h2></div><Link className="button-primary" href="/workspace">开始生成 <ArrowRight size={16} /></Link></section>
      </main>
      <footer className="landing-footer"><span>PromptForge · AI 前端原型工作台</span><Link href="/workspace">进入工作台</Link></footer>
    </div>
  );
}
