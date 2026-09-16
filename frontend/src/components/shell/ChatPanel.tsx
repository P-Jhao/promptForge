"use client";

import { Bubble, Sender } from "@ant-design/x";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useChat } from "@/hooks/useChat";
import type { ProjectPersistenceApi } from "@/hooks/useProjectPersistence";
import { useChatStore } from "@/store/chatStore";
import { MockModeToggle } from "./MockModeToggle";
import { ThoughtChain } from "./ThoughtChain";
import { VersionCard } from "./VersionCard";
import { GenerationStatusPanel } from "./GenerationStatusPanel";
import { CandidatePanel } from "./CandidatePanel";
import type { MockConfig } from "@/types/mock";

const REQUEST_SUGGESTIONS = [
  "做一个支持搜索和状态筛选的小说书库管理页",
  "做一个带进度、笔记和书签的阅读详情页",
  "做一个面向前端开发者的项目管理后台",
];

export function ChatPanel({ persistence }: { persistence: ProjectPersistenceApi }) {
  const { messages, isLoading, sendMessage, cancelMessage, retryLastMessage, canRetry, candidate, applyCandidate, repairCandidate, discardCandidate } = useChat();
  const thoughts = useChatStore((state) => state.messageThoughts);
  const versions = useChatStore((state) => state.versions);
  const currentVersion = useChatStore((state) => state.currentVersion);
  const projectName = useChatStore((state) => state.projectName);
  const generation = useChatStore((state) => state.generation);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [mockConfig, setMockConfig] = useState<MockConfig>({ global: true });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const submit = (value: string) => {
    const content = value.trim();
    if (!content || isLoading || mockConfig.global || candidate !== null) return;
    void sendMessage(content, undefined, mockConfig);
    setInputValue("");
  };

  const setExampleMode = (enabled: boolean) => {
    setMockConfig({ global: enabled });
    if (enabled) {
      setInputValue("");
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="chat-panel-intro">
        <div>
          <span className="chat-kicker">PROMPTFORGE WORKSPACE</span>
          <h2>描述你想交付的前端页面</h2>
          <p>从用户、数据和关键动作开始，生成可预览的 React/TypeScript 原型。</p>
        </div>
        <Link href="/#hero-case" className="chat-case-link">看案例 <ArrowUpRight size={14} /></Link>
      </div>

      <GenerationStatusPanel />
      {candidate !== null && (
        <CandidatePanel candidate={candidate} onApply={() => void applyCandidate()} onRepair={() => void repairCandidate()} onDiscard={discardCandidate} disabled={isLoading} />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="chat-empty">
            {mockConfig.global ? (
              <div className="chat-example-empty">
                <p>当前为示例体验，下面的成果已预置，不会根据新输入伪生成。</p>
                <div className="chat-case-links">
                  <Link href="/workspace?case=novel&scene=library">打开书库管理案例</Link>
                  <Link href="/workspace?case=novel&scene=notes">打开阅读笔记案例</Link>
                </div>
                <p className="chat-example-hint">想描述自己的需求，请切换到真实生成。</p>
              </div>
            ) : (
              <>
                <p>还没有需求，试试：</p>
                <div className="chat-suggestions">
                  {REQUEST_SUGGESTIONS.map((suggestion) => (
                    <button type="button" key={suggestion} onClick={() => setInputValue(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : messages.map((message) => {
          const version = versions.find((item) => item.assistantMessageId === message.id);
          const messageThought = thoughts[message.id] ?? [];
          const isEmptyAssistant = message.role === "assistant" && message.content.length === 0 && messageThought.length === 0;
          return (
            <div key={message.id} className="mb-4">
              {!isEmptyAssistant && (message.content || message.attachments?.length) && (
                <Bubble.List items={[{
                  key: message.id,
                  role: message.role === "user" ? "user" : "model",
                  placement: message.role === "user" ? "end" : "start",
                  content: <div className="whitespace-pre-wrap">{message.content || "正在处理…"}</div>,
                }]} />
              )}
              {message.role === "assistant" && messageThought.length > 0 && <div className="mt-2"><ThoughtChain thoughts={messageThought} /></div>}
              {version && (
                <VersionCard
                  version={version}
                  projectName={projectName}
                  isCurrentVersion={version.versionNumber === currentVersion}
                  onMetadataSave={persistence.updateVersionMetadata}
                />
              )}
            </div>
          );
        })}
        {generation.status === "error" && (
          <button type="button" className="chat-retry" onClick={() => void retryLastMessage()} disabled={isLoading || !canRetry} title={canRetry ? "重新执行原始请求" : "当前页面已丢失原始请求，无法重试"}>
            <RotateCcw size={14} /> {canRetry ? "重新执行原始请求" : "无法重试：请求上下文已丢失"}
          </button>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-200 p-2">
        <MockModeToggle enabled={mockConfig.global === true} onChange={setExampleMode} />
        <p className="chat-boundary">当前为{mockConfig.global ? "示例体验" : "真实体验"}。示例体验只加载预置成果；真实请求会结合当前项目和你的描述处理新页面、现有页面调整或问题讨论，需要补充信息时会先请你澄清。</p>
        <Sender
          value={inputValue}
          onChange={setInputValue}
          placeholder="例如：做一个带搜索和筛选的内容管理后台"
          loading={isLoading}
          disabled={mockConfig.global || candidate !== null}
          onCancel={cancelMessage}
          onSubmit={submit}
        />
      </div>
    </div>
  );
}
