"use client";

import Image from "next/image";
import styles from "./page.module.css";
import { useState, useRef, useEffect } from "react";
import { streamChat, ChatSource } from "@/utils/streanChat";

export default function Home() {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const viewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 토큰 들어올 때 자동 스크롤
    if (viewRef.current)
      viewRef.current.scrollTop = viewRef.current.scrollHeight;
  }, [answer]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 진행 중이면 중단
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setAnswer("");
    setSources([]);
    setLoading(true);

    try {
      await streamChat(
        {
          messages: [{ role: "user", content: input }],
          top_k: 5,
          use_context: 4,
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1024,
          // 필요하면 필터:
          // filters: { categories: { top: 'EV', upper: '...' } }
        },
        (delta) => setAnswer((prev) => prev + delta),
        (srcs) => setSources(srcs),
        ac.signal
      );
    } catch (err) {
      setAnswer((prev) => prev + `\n\n[에러] ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const onStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "64px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "64px",
        }}
      >
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="질문 입력"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "생성 중…" : "질문"}
          </button>
          {loading && (
            <button
              type="button"
              onClick={onStop}
              className="px-4 py-2 rounded-lg border"
            >
              중지
            </button>
          )}
        </form>

        {/* 답변 뷰 */}
        <div
          ref={viewRef}
          className="border rounded-lg p-4 h-72 overflow-auto whitespace-pre-wrap"
        >
          {answer || (loading ? "스트리밍 시작…" : "답변")}
        </div>

        {/* 출처 */}
        {sources.length > 0 && (
          <div className="border rounded-lg p-3 space-y-2">
            <div className="font-semibold">출처</div>
            <ul className="list-disc list-inside space-y-1">
              {sources
                .filter((source, index, array) => {
                  // doc_id가 있는 경우, 같은 doc_id를 가진 첫 번째 항목만 유지
                  if (source.doc_id) {
                    return (
                      array.findIndex((s) => s.doc_id === source.doc_id) ===
                      index
                    );
                  }
                  // doc_id가 없는 경우는 모두 유지
                  return true;
                })
                .map((s, i) => (
                  <li key={`${s.doc_id ?? s.video_url ?? i}`}>
                    {s.title ? (
                      s.video_url ? (
                        <a
                          href={s.video_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium underline"
                        >
                          {s.title}
                        </a>
                      ) : (
                        <span className="font-medium">{s.title}</span>
                      )
                    ) : (
                      "문서"
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
