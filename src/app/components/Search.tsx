"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  Dispatch,
  SetStateAction,
} from "react";
import {
  searchLearningOpenAIStream,
  updateChatMessageRating,
} from "@/utils/searchApi";
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
import { CommentOutlined } from "@ant-design/icons";
import Image from "next/image";
import FeedbackModal from "@/app/components/modal/FeedbackModal";

const searchCategoryList: {
  key: "all" | "Learning" | "MeetUp / Seminar" | "framework";
  label: string;
  icon: React.ReactNode;
  iconActive: React.ReactNode;
}[] = [
  {
    key: "all",
    label: "통합",
    icon: (
      <Image
        src="/search/images/globe-filled.svg"
        alt="globe-filled"
        width={16}
        height={16}
      />
    ),
    iconActive: (
      <Image
        src="/search/images/globe-active.svg"
        alt="globe-active"
        width={16}
        height={16}
      />
    ),
  },
  {
    key: "Learning",
    label: "학습",
    icon: (
      <Image
        src="/search/images/learning-filled.svg"
        alt="learning-filled"
        width={18}
        height={18}
      />
    ),
    iconActive: (
      <Image
        src="/search/images/learning-active.svg"
        alt="learning-active"
        width={17}
        height={17}
      />
    ),
  },
  {
    key: "MeetUp / Seminar",
    label: "사례",
    icon: (
      <Image
        src="/search/images/meetup-filled.svg"
        alt="meetup-filled"
        width={18}
        height={18}
      />
    ),
    iconActive: (
      <Image
        src="/search/images/meetup-active.svg"
        alt="meetup-active"
        width={18}
        height={18}
      />
    ),
  },
  {
    key: "framework",
    label: "문서",
    icon: (
      <Image
        src="/search/images/framework-filled.svg"
        alt="framework-filled"
        width={18}
        height={18}
      />
    ),
    iconActive: (
      <Image
        src="/search/images/framework-active.svg"
        alt="framework-active"
        width={18}
        height={18}
      />
    ),
  },
];

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
  const [selectedFeedbackModalMessageId, setSelectedFeedbackModalMessageId] =
    useState<number | null>(null);
  const [selectedFeedbackModalFeedbackId, setSelectedFeedbackModalFeedbackId] =
    useState<number | null>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  useEffect(() => {
    console.log("messageTurns: ", messageTurns);
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current?.scrollHeight,
      behavior: "smooth",
    });
  }, [messageTurns]);

  const SCROLL_BOTTOM_THRESHOLD = 24;

  const onCancelFeedbackModal = useCallback(() => {
    setSelectedFeedbackModalMessageId(null);
    setSelectedFeedbackModalFeedbackId(null);
    setFeedbackModalOpen(false);
  }, []);

  const openFeedbackModal = useCallback((messageId: number) => {
    setSelectedFeedbackModalMessageId(messageId);
    setFeedbackModalOpen(true);
  }, []);

  const updateMessageTurns = useCallback(
    (messageId: number, feedbackId: number) => {
      console.log("updateMessageTurns: ", messageId, feedbackId);
      setMessageTurns((prev) =>
        prev.map((turn) =>
          turn.messageId === messageId
            ? { ...turn, feedbackId: feedbackId }
            : turn
        )
      );
    },
    []
  );

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
              messageId: null,
              query: searchInput,
              summary: "",
              results: [],
              filters: selectedCategory,
              rating: 0,
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
                  rating: 0,
                }
              : {
                  messageId: null,
                  query: searchInput,
                  summary: content,
                  results: [],
                  filters: selectedCategory,
                  rating: 0,
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
                rating: 0,
              }
            : {
                messageId: null,
                query: searchInput,
                summary: "관련 정보가 없습니다.",
                results: [],
                filters: selectedCategory,
                rating: 0,
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
          images: source.images,
        })
      );

      setCurrentTurn((prev) =>
        prev
          ? {
              ...prev,
              summary: prev.summary || response.summary || "",
              results: convertedResults,
              filters: selectedCategory,
              rating: 0,
            }
          : {
              messageId: null,
              query: searchInput,
              summary: response.summary || "",
              results: convertedResults,
              filters: selectedCategory,
              rating: 0,
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
        messageId: null,
        query: searchInput,
        summary: "",
        results: [],
        filters: selectedCategory,
        rating: 0,
      });
      setSearchLoading(true);
      onSearchOpenAI();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchInput, currentTurn, searchLoading, onSearchOpenAI]
  );

  const handleUpdateChatMessageRating = useCallback(
    async (messageId: number, rating: number) => {
      try {
        const response = await updateChatMessageRating(messageId, rating);
        if (response) {
          notification.success({ message: "평점이 업데이트되었습니다." });
          setMessageTurns((prev) =>
            prev.map((turn) =>
              turn.messageId === messageId ? { ...turn, rating: rating } : turn
            )
          );
        }
      } catch (err) {
        notification.error({
          message: "평점 업데이트 중 오류가 발생했습니다.",
        });
      }
    },
    [messageTurns]
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
            <Image
              src={
                turn.rating === 1
                  ? "/search/images/thumbs-up-active.svg"
                  : "/search/images/thumbs-up.svg"
              }
              alt="thumbs-up"
              width={24}
              height={24}
              className={styles.iconButton}
              onClick={() => {
                if (turn.messageId) {
                  handleUpdateChatMessageRating(
                    turn.messageId,
                    turn.rating === 1 ? 0 : 1
                  );
                }
              }}
            />
            <Image
              src={
                turn.rating === -1
                  ? "/search/images/thumbs-down-active.svg"
                  : "/search/images/thumbs-down.svg"
              }
              alt="thumbs-down"
              width={24}
              height={24}
              className={styles.iconButton}
              onClick={() => {
                if (turn.messageId) {
                  handleUpdateChatMessageRating(
                    turn.messageId,
                    turn.rating === -1 ? 0 : -1
                  );
                }
              }}
            />
            {turn.feedbackId ? (
              <CommentOutlined
                style={{ fontSize: 24 }}
                className={styles.iconButton}
                onClick={() => {
                  console.log("turn: ", turn);
                  openFeedbackModal(turn.messageId ?? 0);
                  setSelectedFeedbackModalFeedbackId(turn.feedbackId ?? 0);
                }}
              />
            ) : (
              <CommentOutlined
                style={{ fontSize: 24 }}
                className={styles.iconButton}
                onClick={() => {
                  console.log("turn: ", turn);
                  openFeedbackModal(turn.messageId ?? 0);
                }}
              />
            )}
            {/* <Image
              src="/search/images/copy.svg"
              alt="copy"
              width={24}
              height={24}
              className={styles.iconButton}
              onClick={() => {
                navigator.clipboard.writeText(turn.summary);
                notification.success({ message: "복사되었습니다." });
              }}
            /> */}
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
        return (
          <Image
            src="/search/images/learning.svg"
            alt="learning"
            width={14}
            height={14}
          />
        );
      case "MeetUp / Seminar":
        return (
          <Image
            src="/search/images/meetup.svg"
            alt="meetup"
            width={14}
            height={14}
          />
        );
      case "framework":
        return (
          <Image
            src="/search/images/framework.svg"
            alt="framework"
            width={14}
            height={14}
          />
        );
      case "all":
        return (
          <Image
            src="/search/images/globe.svg"
            alt="filter_all"
            width={14}
            height={14}
          />
        );
    }
  };

  return (
    <>
      <div
        ref={scrollContainerRef}
        className={tabPanelClass}
        onScroll={onScrollPanel}
        onClick={(e) => {
          const target = e.target as HTMLElement;

          // a 태그 찾기 (안쪽 클릭까지 대비)
          const anchor = target.closest("a");

          if (anchor) {
            e.preventDefault();

            const href = anchor.getAttribute("href");
            if (href) {
              window.open(href, "_blank");
            }
          }
        }}
      >
        <div className={styles.chatScroll}>
          {messageTurns.flatMap((turn, i) => [
            <div
              key={`turn-${i}`}
              className={styles.chatTurnBlockWrapper}
            >
              <div
                key={`u-${i}`}
                className={styles.chatRowUser}
              >
                <div
                  className={`${styles.chatBubble} ${styles.chatBubbleUser} ${turn.filters ? styles.chatBubbleUserWithFilter : ""}`}
                >
                  <span className={styles.chatBubbleUserText}>
                    {turn.query}
                  </span>
                </div>
              </div>

              <div
                key={`a-${i}`}
                className={`${styles.chatRow} ${styles.chatRowAssistant}`}
              >
                <div className={styles.chatBubbleUserIconWrapper}>
                  {turn.filters && (
                    <span className={styles.chatBubbleUserIcon}>
                      {renderFilterIcon(turn.filters)}
                    </span>
                  )}
                </div>
                {renderAssistantContent(turn)}
              </div>
            </div>,
          ])}
          {currentTurn?.query && (
            <div className={styles.chatTurnBlockWrapper}>
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
                    <span className={styles.loadingText}>검색 중입니다...</span>
                  </div>
                </div>
              ) : (
                <div className={`${styles.chatRow} ${styles.chatRowAssistant}`}>
                  {renderAssistantContent(currentTurn)}
                </div>
              )}
            </div>
          )}
          {!hasContent && (
            <div className={styles.emptyState}>
              BIM에 관련된 질문을 입력하고 검색해보세요
            </div>
          )}
        </div>
      </div>

      <div className={styles.searchForm}>
        <div className={styles.searchCategorySection}>
          <div className={styles.searchCategoryWrapper}>
            {searchCategoryList.map((item) => (
              <Button
                key={item.key}
                type={selectedCategory === item.key ? "primary" : "default"}
                size="middle"
                onClick={() => {
                  setSelectedCategory(item.key);
                  setSearchInput(
                    item.key === "all"
                      ? ""
                      : item.key === "Learning"
                        ? "캐드 import 하는 방법 알려줘"
                        : item.key === "MeetUp / Seminar"
                          ? "HDA BIM 어워드에 대해 알려줘"
                          : "프로젝트 파일 생성"
                  );
                }}
                className={`${styles.modelButton} ${selectedCategory === item.key ? styles.modelButtonActive : ""}`}
              >
                {selectedCategory === item.key ? item.iconActive : item.icon}{" "}
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className={styles.fullWidth}>
          <SearchForm
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            loading={searchLoading}
          />
        </div>
      </div>
      <FeedbackModal
        open={feedbackModalOpen}
        onCancel={onCancelFeedbackModal}
        messageId={selectedFeedbackModalMessageId}
        feedbackId={selectedFeedbackModalFeedbackId ?? undefined}
        updateMessageTurns={updateMessageTurns}
      />
    </>
  );
};

export default Search;
