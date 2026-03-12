"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import { searchLearningOpenAIStream } from "@/utils/searchApi";
import { SearchResult, SearchParamsOpenAI, Turn } from "@/app/Interface";
import "@ant-design/v5-patch-for-react-19";
import {
  notification,
  Card,
  Typography,
  Spin,
  Flex,
  Button,
  Space,
} from "antd";
import styles from "@/styles/search.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import SearchForm from "@/app/components/SearchForm";
import { openNotification } from "@/utils/common";

const { Text } = Typography;

const Learning = ({
  searchInput,
  setSearchInput,
  chatId,
  onStreamMetaUpdate,
  messageTurns,
  setMessageTurns,
  empNo,
  currentTurn,
  setCurrentTurn,
  setNewChatLoading,
}: {
  searchInput: string;
  setSearchInput: (input: string) => void;
  chatId: number | null;
  onStreamMetaUpdate: (
    chatId: number | null,
    messageId: number | null,
    title: string | null
  ) => void;
  messageTurns: Turn[];
  setMessageTurns: Dispatch<SetStateAction<Turn[]>>;
  empNo: string;
  currentTurn: Turn | null;
  setCurrentTurn: Dispatch<SetStateAction<Turn | null>>;
  setNewChatLoading: Dispatch<SetStateAction<boolean>>;
}) => {
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    "kure" | "baai" | "full" | "json"
  >("kure");
  const [selectedCategory, setSelectedCategory] = useState<
    "Learning" | "MeetUp / Seminar"
  >("Learning");

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
    if (!stickToBottom || !searchLoading) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [currentTurn?.summary, searchLoading, stickToBottom]);

  const onSearchOpenAI = useCallback(async () => {
    if (!searchInput.trim()) return;
    setStickToBottom(true);
    if (!chatId) setNewChatLoading(true);
    const searchParams: SearchParamsOpenAI = {
      query: searchInput,
      top_k: 20,
      use_context: 5,
      temperature: 0.5,
      model: selectedModel,
      filters: {
        // categories: {
        //   top: selectedCategory,
        // },
      },
      chat_id: chatId,
      embedding_model: "nlpai-lab/KURE-v1",
      emp_no: empNo,
    };
    try {
      setSearchLoading(true);

      setCurrentTurn((prev) =>
        prev
          ? { ...prev, summary: "", results: [] }
          : { query: searchInput, summary: "", results: [] }
      );

      const response = await searchLearningOpenAIStream(searchParams, {
        onDelta(content) {
          setCurrentTurn((prev) =>
            prev
              ? { ...prev, summary: (prev.summary ?? "") + content }
              : { query: searchInput, summary: content, results: [] }
          );
        },
      });

      console.log("response: ", response);

      onStreamMetaUpdate(
        response.chat_id ?? null,
        response.user_message_id ?? null,
        response.title ?? null
      );

      setSearchInput("");

      if (response.noContent) {
        setCurrentTurn((prev) =>
          prev
            ? { ...prev, summary: "관련 정보가 없습니다.", results: [] }
            : {
                query: searchInput,
                summary: "관련 정보가 없습니다.",
                results: [],
              }
        );
        return;
      }

      const convertedResults: SearchResult[] = (response.sources ?? []).map(
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
              summary: prev.summary || response.summary || "",
              results: convertedResults,
            }
          : {
              query: searchInput,
              summary: response.summary || "",
              results: convertedResults,
            }
      );
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("OpenAI Search error:", errorMessage);
      notification.error({
        message: "OpenAI 검색 중 오류가 발생했습니다.",
        description: errorMessage,
      });
    } finally {
      setSearchLoading(false);
      setNewChatLoading(false);
    }
  }, [searchInput, selectedModel, setSearchInput]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchInput.trim()) return;
      if (currentTurn?.query && !searchLoading) {
        setMessageTurns((prev) => [...prev, currentTurn]);
      }
      setCurrentTurn({ query: searchInput, summary: "", results: [] });
      setSearchLoading(true);
      onSearchOpenAI();
    },
    [searchInput, currentTurn, searchLoading, onSearchOpenAI]
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
    </div>
  );

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
                BIM에 관련된 질문을 입력하고 검색해보세요
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
          {/* <Flex
            gap={6}
            align="center"
            justify="space-around"
            className={styles.fullWidth}
          >
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
                    onClick={() => {
                      setSelectedCategory(key);
                      setSearchInput(
                        key === "Learning"
                          ? "캐드 import 하는 방법 알려줘"
                          : "HDA BIM 어워드에 대해 알려줘"
                      );
                    }}
                    className={`${styles.modelButton} ${selectedCategory === key ? styles.modelButtonActive : ""}`}
                  >
                    {label}
                  </Button>
                ))}
              </Space>
            </Flex>
          </Flex> */}

          <div className={styles.fullWidth}>
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
