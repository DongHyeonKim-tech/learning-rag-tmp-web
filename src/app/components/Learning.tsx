"use client";

import {
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  searchDocuments,
  searchDocumentsKure,
  SearchResult,
  SearchParams,
  searchDocumentsOpenAI,
  SearchParamsOpenAI,
  searchLearningOpenAIStream,
} from "@/utils/searchApi";
import "@ant-design/v5-patch-for-react-19";
import { notification, Card, Typography, Spin, Switch } from "antd";
import { SearchOutlined, OpenAIOutlined } from "@ant-design/icons";
import type { LearningRef } from "@/app/page";
import styles from "@/styles/search.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const { Text } = Typography;

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <b key={i}>{part}</b> : <span key={i}>{part}</span>
  );
}

const SUMMARY_HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

function renderSummaryContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const headingMatch = line.match(/^(#+)\s*(.*)$/);
    if (headingMatch) {
      const level = Math.min(6, headingMatch[1].length) - 1;
      const Tag = SUMMARY_HEADING_TAGS[level];
      return (
        <Tag
          key={i}
          className={styles.summaryHeading}
        >
          {renderBold(headingMatch[2])}
        </Tag>
      );
    }
    return (
      <div
        key={i}
        className={styles.summaryLine}
      >
        {renderBold(line)}
      </div>
    );
  });
}

const Learning = forwardRef<
  LearningRef,
  {
    input: string;
    searchLoading: boolean;
    setSearchLoading: (v: boolean) => void;
    selectedModel: "bge-m3" | "kure" | "full" | "json";
  }
>(function Learning(
  { input, searchLoading, setSearchLoading, selectedModel },
  ref
) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState("openai");
  const [openAISummary, setOpenAISummary] = useState<string>("");
  const [stream, setStream] = useState<boolean>(true);
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const SCROLL_BOTTOM_THRESHOLD = 24;

  const checkAtBottom = useCallback((el: HTMLDivElement | null) => {
    if (!el) return false;
    const { scrollTop, clientHeight, scrollHeight } = el;
    return scrollTop + clientHeight >= scrollHeight - SCROLL_BOTTOM_THRESHOLD;
  }, []);

  const onScrollPanel = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setStickToBottom(checkAtBottom(el));
  }, [checkAtBottom]);

  useEffect(() => {
    if (!stickToBottom || !searchLoading || !stream) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [openAISummary, searchLoading, stream, stickToBottom]);

  const onSearch = useCallback(async () => {
    if (!input.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    setOpenAISummary("");
    try {
      const searchParams: SearchParams = {
        messages: [{ role: "user", content: input }],
        top_k: 5,
        use_context: 5,
      };
      const searchFunction =
        selectedModel === "kure" ? searchDocumentsKure : searchDocuments;
      const response = await searchFunction(searchParams);
      setSearchResults(response.results);
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("Search error:", errorMessage);
      notification.error({ message: "검색 중 오류가 발생했습니다." });
    } finally {
      setSearchLoading(false);
    }
  }, [input, selectedModel, setSearchLoading]);

  const onSearchOpenAI = useCallback(async () => {
    if (!input.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    setOpenAISummary("");
    setStickToBottom(true);
    const searchParams: SearchParamsOpenAI = {
      query: input,
      top_k: 10,
      use_context: 5,
      temperature: 0.5,
      max_tokens: 1024,
      model: selectedModel,
    };
    try {
      if (stream) {
        const response = await searchLearningOpenAIStream(searchParams, {
          onDelta(content) {
            setOpenAISummary((prev) => prev + content);
          },
        });
        const convertedResults: SearchResult[] = response.sources.map(
          (source) => ({
            doc_id: source.doc_id,
            title: source.title,
            snippet: source.snippet,
            video_url: source.video_url,
            video_label: source.video_label,
          })
        );
        setSearchResults(convertedResults);
      } else {
        const response = await searchDocumentsOpenAI(searchParams);
        const convertedResults: SearchResult[] = response.sources.map(
          (source) => ({
            doc_id: source.doc_id,
            title: source.title,
            snippet: source.snippet,
            video_url: source.video_url,
            video_label: source.video_label,
          })
        );
        setSearchResults(convertedResults);
        setOpenAISummary(response.summary);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("OpenAI Search error:", errorMessage);
      notification.error({
        message: "OpenAI 검색 중 오류가 발생했습니다.",
        description: errorMessage,
      });
    } finally {
      setSearchLoading(false);
    }
  }, [input, selectedModel, setSearchLoading, stream]);

  useImperativeHandle(
    ref,
    () => ({
      search: () => {
        if (activeTab === "openai") onSearchOpenAI();
        else onSearch();
      },
    }),
    [activeTab, onSearch, onSearchOpenAI]
  );

  const tabPanelClass = `${styles.tabPanel} ${styles.tabPanel500}`;
  const loadingBlock = (
    <div className={styles.loadingWrap}>
      <Spin size="large" />
      <div className={styles.loadingText}>검색 중입니다...</div>
    </div>
  );
  const emptyBlock = (msg: string) => (
    <div className={styles.emptyState}>{msg}</div>
  );
  const resultCountText = (count: number) => (
    <div className={styles.resultCount}>총 {count}개의 결과를 찾았습니다</div>
  );
  const resultGridClass = styles.resultGrid;
  const resultCard = (result: SearchResult, index: number) => (
    <Card
      key={result.doc_id || index}
      size="small"
      className={styles.smallCard}
    >
      <div className={styles.resultItemBlock}>
        <Text
          strong
          className={styles.resultTitle}
        >
          {result.title}
        </Text>
        <div className={styles.resultMeta}>ID: {result.doc_id}</div>
      </div>
      {result.snippet && (
        <Text className={styles.resultSnippet}>{result.snippet}</Text>
      )}
      {result.video_url && (
        <div className={styles.resultLinkWrap}>
          <a
            href={result.video_url}
            target="_blank"
            rel="noreferrer"
            className={styles.resultLink}
          >
            {result.video_label || "영상 보기"}
          </a>
        </div>
      )}
    </Card>
  );

  return (
    <>
      <Card className={styles.contentCard}>
        <div
          ref={scrollContainerRef}
          className={tabPanelClass}
          onScroll={onScrollPanel}
        >
          <div className={styles.streamOption}>
            <Text>스트리밍 응답</Text>
            <Switch
              checked={stream}
              onChange={setStream}
              size="small"
            />
          </div>
          {searchLoading && !openAISummary ? (
            loadingBlock
          ) : searchResults.length > 0 || openAISummary ? (
            <div>
              {openAISummary && (
                <div className={styles.summaryBox}>
                  <Text
                    strong
                    className={styles.summaryTitle}
                  >
                    AI 요약
                  </Text>
                  <div className={"markdown"}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {openAISummary}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              {searchResults.length > 0 &&
                resultCountText(searchResults.length)}
              <div className={resultGridClass}>
                {searchResults.map((result, index) =>
                  resultCard(result, index)
                )}
              </div>
            </div>
          ) : (
            emptyBlock("OpenAI 검색어를 입력하고 검색해보세요")
          )}
        </div>
      </Card>
    </>
  );
});

export default Learning;
