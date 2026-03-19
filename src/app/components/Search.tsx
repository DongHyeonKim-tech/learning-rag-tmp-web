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
import {
  SearchResult,
  SearchParamsOpenAI,
  Turn,
  ChatRoomData,
} from "@/app/Interface";
import "@ant-design/v5-patch-for-react-19";
import { notification, Card, Spin, Flex, Button, Space } from "antd";
import styles from "@/styles/search.module.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import SearchForm from "@/app/components/SearchForm";
import { openNotification } from "@/utils/common";
import {
  BookOutlined,
  CommentOutlined,
  CompassOutlined,
  CopyOutlined,
  DislikeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LikeOutlined,
} from "@ant-design/icons";

const Search = ({
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
  setChatRooms,
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
  setChatRooms: Dispatch<SetStateAction<ChatRoomData[]>>;
}) => {
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedModel] = useState<"kure" | "baai" | "full" | "json">("kure");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "Learning" | "MeetUp / Seminar" | "framework"
  >("all");

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
      filters:
        selectedCategory === "all"
          ? undefined
          : {
              categories: {
                top: selectedCategory,
              },
            },
      chat_id: chatId,
      embedding_model: "nlpai-lab/KURE-v1",
      emp_no: empNo,
    };
    try {
      setSearchLoading(true);

      setCurrentTurn((prev) =>
        prev
          ? { ...prev, summary: "", results: [], filters: selectedCategory }
          : {
              query: searchInput,
              summary: "",
              results: [],
              filters: selectedCategory,
            }
      );

      const response = await searchLearningOpenAIStream(searchParams, {
        onDelta(content) {
          setCurrentTurn((prev) =>
            prev
              ? {
                  ...prev,
                  summary: (prev.summary ?? "") + content,
                  filters: selectedCategory,
                }
              : {
                  query: searchInput,
                  summary: content,
                  results: [],
                  filters: selectedCategory,
                }
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
            ? {
                ...prev,
                summary: "관련 정보가 없습니다.",
                results: [],
                filters: selectedCategory,
              }
            : {
                query: searchInput,
                summary: "관련 정보가 없습니다.",
                results: [],
                filters: selectedCategory,
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
              filters: selectedCategory,
            }
          : {
              query: searchInput,
              summary: response.summary || "",
              results: convertedResults,
              filters: selectedCategory,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, selectedModel, setSearchInput]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!searchInput.trim()) return;
      if (!chatId) {
        setChatRooms((prev) => [{ chatId: null, title: "새 채팅방" }, ...prev]);
      }
      if (currentTurn?.query && !searchLoading) {
        setMessageTurns((prev) => [...prev, currentTurn]);
      }
      setCurrentTurn({
        query: searchInput,
        summary: "",
        results: [],
        filters: selectedCategory,
      });
      setSearchLoading(true);
      onSearchOpenAI();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchInput, currentTurn, searchLoading, onSearchOpenAI]
  );

  const tabPanelClass = `${styles.tabPanel} ${styles.tabPanel500}`;

  const renderAssistantContent = (turn: Turn) => (
    <div className={styles.chatTurnBlock}>
      {turn.summary ? (
        <div className={styles.chatBubbleAssistant}>
          <div className="markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {turn.summary}
            </ReactMarkdown>
          </div>
          <Flex
            gap={12}
            align="center"
            justify="flex-start"
          >
            <LikeOutlined style={{ fontSize: 24 }} />
            <DislikeOutlined style={{ fontSize: 24 }} />
            <CommentOutlined style={{ fontSize: 24 }} />
            <CopyOutlined
              style={{ fontSize: 24 }}
              onClick={() => {
                console.log("turn.summary: ", turn.summary);
                navigator.clipboard.writeText(turn.summary);
                openNotification("success", "복사되었습니다.");
              }}
            />
          </Flex>
        </div>
      ) : (
        <div className={styles.chatBubbleAssistant}>
          답변을 불러올 수 없습니다.
        </div>
      )}
    </div>
  );

  const hasContent =
    messageTurns.length > 0 ||
    currentTurn?.query ||
    (currentTurn && (currentTurn.summary || currentTurn.results.length > 0));

  const renderFilterIcon = (filters: string) => {
    switch (filters) {
      case "Learning":
        return <BookOutlined />;
      case "MeetUp / Seminar":
        return <CompassOutlined />;
      case "framework":
        return <FileTextOutlined />;
      case "all":
        return <GlobalOutlined />;
    }
  };

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
                  className={`${styles.chatBubble} ${styles.chatBubbleUser} ${turn.filters ? styles.chatBubbleUserWithFilter : ""}`}
                >
                  {turn.filters && (
                    <span className={styles.chatBubbleUserIcon}>
                      {renderFilterIcon(turn.filters)}
                    </span>
                  )}
                  <span className={styles.chatBubbleUserText}>
                    {turn.query}
                  </span>
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
                    className={`${styles.chatBubble} ${styles.chatBubbleUser} ${currentTurn.filters ? styles.chatBubbleUserWithFilter : ""}`}
                  >
                    {currentTurn.filters && (
                      <span className={styles.chatBubbleUserIcon}>
                        {renderFilterIcon(currentTurn.filters)}
                      </span>
                    )}
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
          <Flex
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
              <Space
                size="small"
                wrap
                className={styles.modelButtonWrap}
              >
                {(
                  [
                    ["all", "통합", <GlobalOutlined key="icon-global" />],
                    ["Learning", "학습", <BookOutlined key="icon-book" />],
                    [
                      "MeetUp / Seminar",
                      "사례",
                      <CompassOutlined key="icon-compass" />,
                    ],
                    [
                      "framework",
                      "문서",
                      <FileTextOutlined key="icon-filetext" />,
                    ],
                  ] as const
                ).map(([key, label, icon]) => (
                  <Button
                    key={key}
                    type={selectedCategory === key ? "primary" : "default"}
                    size="middle"
                    onClick={() => {
                      setSelectedCategory(key);
                      setSearchInput(
                        key === "all"
                          ? ""
                          : key === "Learning"
                            ? "캐드 import 하는 방법 알려줘"
                            : key === "MeetUp / Seminar"
                              ? "HDA BIM 어워드에 대해 알려줘"
                              : "프로젝트 파일 생성"
                      );
                    }}
                    className={`${styles.modelButton} ${selectedCategory === key ? styles.modelButtonActive : ""}`}
                  >
                    {icon} {label}
                  </Button>
                ))}
              </Space>
            </Flex>
          </Flex>

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

export default Search;
