"use client";

import { useState, useRef, useEffect } from "react";
import { streamChat, streamChatKure, ChatSource } from "@/utils/streamChat";
import {
  searchDocuments,
  searchDocumentsKure,
  SearchResult,
  SearchParams,
  searchDocumentsOpenAI,
  SearchParamsOpenAI,
} from "@/utils/searchApi";
import "@ant-design/v5-patch-for-react-19";
import {
  Button,
  Input,
  notification,
  Card,
  Typography,
  Space,
  Spin,
  Tabs,
} from "antd";
import {
  SendOutlined,
  StopOutlined,
  FileTextOutlined,
  SearchOutlined,
  OpenAIOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function Home() {
  const [input, setInput] = useState("HDA BIM 어워드");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<ChatSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("openai");
  const [openAISummary, setOpenAISummary] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<
    "bge-m3" | "kure" | "full"
  >("bge-m3");
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
      const streamFunction =
        selectedModel === "kure" ? streamChatKure : streamChat;
      await streamFunction(
        {
          messages: [{ role: "user", content: input }],
          top_k: 5,
          use_context: 4,
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1024,
        },
        (delta) => setAnswer((prev) => prev + delta),
        (srcs) => setSources(srcs),
        ac.signal
      );
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("errorMessage: ", errorMessage);
      if (errorMessage === "NO_MATCH") {
        console.log("NO_MATCH");
        notification.warning({ message: "일치하는 답변이 없습니다." });
      } else {
        setAnswer((prev) => prev + `\n\n[에러] ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const onStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const onSearch = async () => {
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
  };

  const onSearchOpenAI = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    setSearchLoading(true);
    setSearchResults([]);
    setOpenAISummary("");

    try {
      const searchParams: SearchParamsOpenAI = {
        query: input,
        top_k: 10,
        use_context: 5,
        temperature: 0.5,
        max_tokens: 2048,
        model: selectedModel,
      };
      console.log("searchParams: ", searchParams);
      const response = await searchDocumentsOpenAI(searchParams);
      // SearchSource를 SearchResult 형식으로 변환
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
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* 헤더 */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Title level={1} style={{ color: "white", margin: 0 }}>
            러닝웹 RAG 시스템
          </Title>
          <Text
            style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px" }}
          ></Text>
        </div>

        {/* 모델 선택 버튼 */}
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "none",
            marginBottom: "16px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <Text
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "12px",
                display: "block",
              }}
            >
              검색 모델을 선택하세요
            </Text>
            <Space>
              <Button
                type={selectedModel === "bge-m3" ? "primary" : "default"}
                size="large"
                onClick={() => setSelectedModel("bge-m3")}
                style={{
                  borderRadius: "8px",
                  minWidth: "140px",
                  ...(selectedModel === "bge-m3" && {
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    border: "none",
                  }),
                }}
              >
                BAAI/bge-m3
              </Button>
              <Button
                type={selectedModel === "full" ? "primary" : "default"}
                size="large"
                onClick={() => setSelectedModel("full")}
                style={{
                  borderRadius: "8px",
                  minWidth: "140px",
                  ...(selectedModel === "full" && {
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    border: "none",
                  }),
                }}
              >
                BAAI/bge-m3 Full Docs
              </Button>
              <Button
                type={selectedModel === "kure" ? "primary" : "default"}
                size="large"
                onClick={() => setSelectedModel("kure")}
                style={{
                  borderRadius: "8px",
                  minWidth: "140px",
                  ...(selectedModel === "kure" && {
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    border: "none",
                  }),
                }}
              >
                nlpai-lab/KURE-v1
              </Button>
            </Space>
            <div style={{ marginTop: "12px" }}>
              <Text style={{ color: "#667eea", fontSize: "12px" }}>
                선택된 모델:{" "}
                {selectedModel === "bge-m3"
                  ? "BAAI/bge-m3"
                  : "nlpai-lab/KURE-v1"}
              </Text>
            </div>
          </div>
        </Card>

        {/* 입력 폼 */}
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "none",
          }}
        >
          <form
            onSubmit={
              activeTab === "chat"
                ? onSubmit
                : activeTab === "openai"
                ? onSearchOpenAI
                : (e) => {
                    e.preventDefault();
                    onSearch();
                  }
            }
          >
            <Space.Compact style={{ width: "100%" }}>
              <Input
                size="large"
                placeholder={
                  activeTab === "chat"
                    ? "질문을 입력해주세요..."
                    : "검색어를 입력해주세요..."
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  borderRadius: "12px 0 0 12px",
                  border: "2px solid #e0e0e0",
                  fontSize: "16px",
                }}
                onPressEnter={
                  activeTab === "chat"
                    ? onSubmit
                    : activeTab === "openai"
                    ? onSearchOpenAI
                    : onSearch
                }
              />
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                disabled={
                  (activeTab === "chat" ? loading : searchLoading) ||
                  !input.trim()
                }
                icon={
                  activeTab === "chat" ? <SendOutlined /> : <SearchOutlined />
                }
                style={{
                  borderRadius: "0 12px 12px 0",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  border: "none",
                  height: "48px",
                }}
              >
                {activeTab === "chat"
                  ? loading
                    ? "생성 중..."
                    : "질문하기"
                  : searchLoading
                  ? "검색 중..."
                  : "검색하기"}
              </Button>
              {loading && activeTab === "chat" && (
                <Button
                  size="large"
                  icon={<StopOutlined />}
                  onClick={onStop}
                  style={{
                    borderRadius: "0 12px 12px 0",
                    marginLeft: "8px",
                  }}
                >
                  중지
                </Button>
              )}
            </Space.Compact>
          </form>
        </Card>

        {/* 탭 영역 */}
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            border: "none",
            minHeight: "400px",
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "openai",
                label: (
                  <span>
                    <OpenAIOutlined />
                    OpenAI
                  </span>
                ),
                children: (
                  <div
                    style={{
                      minHeight: "300px",
                      maxHeight: "500px",
                      overflow: "auto",
                    }}
                  >
                    {searchLoading ? (
                      <div style={{ textAlign: "center", padding: "40px" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: "16px", color: "#666" }}>
                          검색 중입니다...
                        </div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        {openAISummary && (
                          <div
                            style={{
                              marginBottom: "20px",
                              padding: "16px",
                              background: "#f0f8ff",
                              borderRadius: "8px",
                              border: "1px solid #d0e7ff",
                            }}
                          >
                            <Text
                              strong
                              style={{ color: "#1890ff", fontSize: "14px" }}
                            >
                              AI 요약
                            </Text>
                            <div
                              style={{ marginTop: "8px", lineHeight: "1.6" }}
                            >
                              {openAISummary}
                            </div>
                          </div>
                        )}
                        <div
                          style={{
                            marginBottom: "16px",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          총 {searchResults.length}개의 결과를 찾았습니다
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          {searchResults.map((result, index) => (
                            <Card
                              key={result.doc_id || index}
                              size="small"
                              style={{
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0",
                                background: "#f8f9fa",
                              }}
                            >
                              <div style={{ marginBottom: "8px" }}>
                                <Text strong style={{ fontSize: "14px" }}>
                                  {result.title}
                                </Text>
                                <div
                                  style={{ fontSize: "12px", color: "#999" }}
                                >
                                  ID: {result.doc_id}
                                </div>
                              </div>
                              {result.snippet && (
                                <Text
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {result.snippet}
                                </Text>
                              )}
                              {result.video_url && (
                                <div style={{ marginTop: "8px" }}>
                                  <a
                                    href={result.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize: "12px",
                                      color: "#667eea",
                                    }}
                                  >
                                    {result.video_label || "영상 보기"}
                                  </a>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        OpenAI 검색어를 입력하고 검색해보세요
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "search",
                label: (
                  <span>
                    <SearchOutlined />
                    검색
                  </span>
                ),
                children: (
                  <div
                    style={{
                      minHeight: "300px",
                      maxHeight: "500px",
                      overflow: "auto",
                    }}
                  >
                    {searchLoading ? (
                      <div style={{ textAlign: "center", padding: "40px" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: "16px", color: "#666" }}>
                          검색 중입니다...
                        </div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div
                          style={{
                            marginBottom: "16px",
                            color: "#666",
                            fontSize: "14px",
                          }}
                        >
                          총 {searchResults.length}개의 결과를 찾았습니다
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(300px, 1fr))",
                            gap: "12px",
                          }}
                        >
                          {searchResults.map((result, index) => (
                            <Card
                              key={result.doc_id || index}
                              size="small"
                              style={{
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0",
                                background: "#f8f9fa",
                              }}
                            >
                              <div style={{ marginBottom: "8px" }}>
                                <Text strong style={{ fontSize: "14px" }}>
                                  {result.title}
                                </Text>
                                <div
                                  style={{ fontSize: "12px", color: "#999" }}
                                >
                                  ID: {result.doc_id}
                                </div>
                              </div>
                              {result.snippet && (
                                <Text
                                  style={{ fontSize: "12px", color: "#666" }}
                                >
                                  {result.snippet}
                                </Text>
                              )}
                              {result.video_url && (
                                <div style={{ marginTop: "8px" }}>
                                  <a
                                    href={result.video_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize: "12px",
                                      color: "#667eea",
                                    }}
                                  >
                                    {result.video_label || "영상 보기"}
                                  </a>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        검색어를 입력하고 검색해보세요
                      </div>
                    )}
                  </div>
                ),
              },
              {
                key: "chat",
                label: (
                  <span>
                    <SendOutlined />
                    채팅
                  </span>
                ),
                children: (
                  <div
                    ref={viewRef}
                    style={{
                      minHeight: "300px",
                      maxHeight: "500px",
                      overflow: "auto",
                      padding: "16px",
                      background: "#f8f9fa",
                      borderRadius: "12px",
                      border: "1px solid #e0e0e0",
                      whiteSpace: "pre-wrap",
                      lineHeight: "1.6",
                      fontSize: "16px",
                    }}
                  >
                    {loading ? (
                      <div style={{ textAlign: "center", padding: "40px" }}>
                        <Spin size="large" />
                        <div style={{ marginTop: "16px", color: "#666" }}>
                          답변을 생성하고 있습니다...
                        </div>
                      </div>
                    ) : answer ? (
                      answer
                    ) : (
                      <div
                        style={{
                          color: "#999",
                          textAlign: "center",
                          padding: "40px",
                        }}
                      >
                        질문을 입력하고 답변을 받아보세요
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* 출처 영역 */}
        {sources.length > 0 && (
          <Card
            style={{
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              border: "none",
            }}
          >
            <Title level={4} style={{ margin: "0 0 16px 0" }}>
              참고 자료
            </Title>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "12px",
              }}
            >
              {sources
                .filter((source, index, array) => {
                  if (source.doc_id) {
                    return (
                      array.findIndex((s) => s.doc_id === source.doc_id) ===
                      index
                    );
                  }
                  return true;
                })
                .map((s, i) => (
                  <Card
                    key={`${s.doc_id ?? s.video_url ?? i}`}
                    size="small"
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      background: "#f8f9fa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <FileTextOutlined
                        style={{ marginRight: "8px", color: "#667eea" }}
                      />
                      <div style={{ flex: 1 }}>
                        {s.title ? (
                          s.video_url ? (
                            <a
                              href={s.video_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: "#667eea",
                                textDecoration: "none",
                                fontWeight: "500",
                              }}
                            >
                              {s.title}
                            </a>
                          ) : (
                            <Text strong>{s.title}</Text>
                          )
                        ) : (
                          <Text>문서</Text>
                        )}
                        {s.doc_id && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#999",
                              marginTop: "4px",
                            }}
                          >
                            ID: {s.doc_id}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
