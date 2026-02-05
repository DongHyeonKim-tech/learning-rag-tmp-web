"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
import {
  notification,
  Card,
  Typography,
  Spin,
  Switch,
  Flex,
  Button,
  Space,
  Dropdown,
  MenuProps,
} from "antd";
import styles from "@/styles/search.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import SearchForm from "@/app/components/SearchForm";

const { Text } = Typography;

type Turn = { query: string; summary: string; results: SearchResult[] };

const Learning = () => {
  const [searchInput, setSearchInput] = useState("HDA BIM 어워드");
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    "kure" | "baai" | "full" | "json"
  >("kure");
  const [modelLabel, setModelLabel] = useState<string>("nlpai-lab/KURE-v1");
  const [selectedCategory, setSelectedCategory] = useState<
    "Learning" | "MeetUp / Seminar"
  >("Learning");

  const [messageTurns, setMessageTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [activeTab, setActiveTab] = useState("openai");
  const [stream, setStream] = useState<boolean>(true);
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("messageTurns: ", messageTurns);
  }, [messageTurns]);

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
  }, [currentTurn?.summary, searchLoading, stream, stickToBottom]);

  const onSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    try {
      const searchParams: SearchParams = {
        messages: [{ role: "user", content: searchInput }],
        top_k: 5,
        use_context: 5,
      };
      const searchFunction =
        selectedModel === "kure" ? searchDocumentsKure : searchDocuments;
      const response = await searchFunction(searchParams);
      setCurrentTurn((prev) =>
        prev ? { ...prev, results: response.results } : null
      );
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("Search error:", errorMessage);
      notification.error({ message: "검색 중 오류가 발생했습니다." });
    } finally {
      setSearchLoading(false);
    }
  }, [searchInput, selectedModel]);

  const onSearchOpenAI = useCallback(async () => {
    if (!searchInput.trim()) return;
    setStickToBottom(true);
    const searchParams: SearchParamsOpenAI = {
      query: searchInput,
      top_k: 10,
      use_context: 5,
      temperature: 0.5,
      model: selectedModel,
      filters: {
        categories: {
          top: selectedCategory,
        },
      },
    };
    try {
      if (stream) {
        const response = await searchLearningOpenAIStream(searchParams, {
          onDelta(content) {
            setCurrentTurn((prev) =>
              prev ? { ...prev, summary: prev.summary + content } : null
            );
          },
        });
        setSearchInput("");
        if (response.noContent) {
          setCurrentTurn((prev) =>
            prev
              ? { ...prev, summary: "관련 정보가 없습니다.", results: [] }
              : null
          );
          setSearchLoading(false);
          return;
        }
        const convertedResults: SearchResult[] = response.sources.map(
          (source) => ({
            doc_id: source.doc_id,
            title: source.title,
            snippet: source.snippet,
            video_url: source.video_url,
            video_label: source.video_label,
          })
        );
        setCurrentTurn((prev) =>
          prev ? { ...prev, results: convertedResults } : null
        );
      } else {
        const response = await searchDocumentsOpenAI(searchParams);
        setSearchInput("");
        const convertedResults: SearchResult[] = response.sources.map(
          (source) => ({
            doc_id: source.doc_id,
            title: source.title,
            snippet: source.snippet,
            video_url: source.video_url,
            video_label: source.video_label,
          })
        );
        setCurrentTurn((prev) =>
          prev
            ? {
                ...prev,
                summary: response.summary,
                results: convertedResults,
              }
            : null
        );
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
  }, [searchInput, selectedModel, stream]);

  const search = useCallback(() => {
    if (activeTab === "openai") onSearchOpenAI();
    else onSearch();
  }, [activeTab, onSearch, onSearchOpenAI]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchInput.trim()) return;
      if (currentTurn?.query && !searchLoading) {
        setMessageTurns((prev) => [...prev, currentTurn]);
      }
      setCurrentTurn({ query: searchInput, summary: "", results: [] });
      setSearchLoading(true);
      search();
    },
    [searchInput, currentTurn, searchLoading, search]
  );

  const tabPanelClass = `${styles.tabPanel} ${styles.tabPanel500}`;
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

  const renderAssistantContent = (turn: Turn) => (
    <div className={styles.chatTurnBlock}>
      {turn.summary && (
        <div className={styles.chatBubbleAssistant}>
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {turn.summary}
            </ReactMarkdown>
          </div>
        </div>
      )}
      {turn.results.length > 0 && (
        <>
          <div className={styles.resultCount}>
            총 {turn.results.length}개의 결과를 찾았습니다
          </div>
          <div className={styles.resultGrid}>
            {turn.results.map((result, index) => resultCard(result, index))}
          </div>
        </>
      )}
    </div>
  );

  const items: MenuProps["items"] = [
    {
      key: "kure",
      label: "nlpai-lab/KURE-v1",
      onClick: () => {
        setSelectedModel("kure");
        setModelLabel("nlpai-lab/KURE-v1");
      },
    },
    {
      key: "baai",
      label: "BAAI/bge-m3",
      onClick: () => {
        setSelectedModel("baai");
        setModelLabel("BAAI/bge-m3");
      },
    },
    {
      key: "full",
      label: "BAAI/bge-m3 Full Docs",
      onClick: () => {
        setSelectedModel("full");
        setModelLabel("BAAI/bge-m3 Full Docs");
      },
    },
    {
      key: "json",
      label: "JSON 원본 추가 검색",
      onClick: () => {
        setSelectedModel("json");
        setModelLabel("JSON 원본 추가 검색");
      },
    },
  ];

  const hasContent =
    messageTurns.length > 0 ||
    currentTurn?.query ||
    (currentTurn && (currentTurn.summary || currentTurn.results.length > 0));

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
          <div className={styles.chatScroll}>
            {messageTurns.flatMap((turn, i) => [
              <div
                key={`u-${i}`}
                className={styles.chatRow}
              >
                <div
                  className={`${styles.chatBubble} ${styles.chatBubbleUser}`}
                >
                  {turn.query}
                </div>
              </div>,
              <div
                key={`a-${i}`}
                className={`${styles.chatRow} ${styles.chatRowAssistant}`}
              >
                {renderAssistantContent(turn)}
              </div>,
            ])}
            {currentTurn?.query && (
              <>
                <div className={styles.chatRow}>
                  <div
                    className={`${styles.chatBubble} ${styles.chatBubbleUser}`}
                  >
                    {currentTurn.query}
                  </div>
                </div>
                {searchLoading &&
                !currentTurn.summary &&
                !currentTurn.results.length ? (
                  <div
                    className={`${styles.chatRow} ${styles.chatRowAssistantLoading}`}
                  >
                    <div
                      className={`${styles.chatBubble} ${styles.chatBubbleAssistant} ${styles.chatLoadingBubble}`}
                    >
                      <Spin size="small" />
                      <span className={styles.loadingText}>
                        검색 중입니다...
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`${styles.chatRow} ${styles.chatRowAssistant}`}
                  >
                    {renderAssistantContent(currentTurn)}
                  </div>
                )}
              </>
            )}
            {!hasContent && (
              <div className={styles.emptyState}>
                OpenAI 검색어를 입력하고 검색해보세요
              </div>
            )}
          </div>
        </div>

        <Flex
          gap={12}
          align="center"
          className={styles.modelSection}
          justify="center"
          vertical
        >
          <Flex
            gap={6}
            align="center"
            justify="space-around"
            style={{ width: "100%" }}
          >
            <Dropdown
              menu={{
                items: items,
              }}
              placement="topLeft"
            >
              <Text>모델: {modelLabel}</Text>
            </Dropdown>
            <Flex
              gap={12}
              align="center"
              justify="center"
            >
              <Text className={styles.modelLabel}>카테고리</Text>
              <Space
                size="small"
                wrap
                className={styles.modelButtonWrap}
              >
                {(
                  [
                    ["Learning", "학습"],
                    ["MeetUp / Seminar", "MeetUp"],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    type={selectedCategory === key ? "primary" : "default"}
                    size="middle"
                    onClick={() => setSelectedCategory(key)}
                    className={`${styles.modelButton} ${selectedCategory === key ? styles.modelButtonActive : ""}`}
                  >
                    {label}
                  </Button>
                ))}
              </Space>
            </Flex>
          </Flex>

          <div style={{ width: "100%" }}>
            <SearchForm
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              loading={searchLoading}
            />
          </div>
        </Flex>
      </Card>
    </>
  );
};

export default Learning;
