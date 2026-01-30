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

const Learning = ({
  selectedModel,
}: {
  selectedModel: "bge-m3" | "kure" | "full" | "json";
}) => {
  const [input, setInput] = useState("HDA BIM 어워드");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("openai");
  const [openAISummary, setOpenAISummary] = useState<string>("");

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
    <>
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
            activeTab === "openai"
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
              placeholder={"검색어를 입력해주세요."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                borderRadius: "12px 0 0 12px",
                border: "2px solid #e0e0e0",
                fontSize: "16px",
              }}
              onPressEnter={activeTab === "openai" ? onSearchOpenAI : onSearch}
            />
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              disabled={searchLoading || !input.trim()}
              icon={<SearchOutlined />}
              style={{
                borderRadius: "0 12px 12px 0",
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                border: "none",
                height: "48px",
              }}
            >
              {searchLoading ? "검색 중..." : "검색하기"}
            </Button>
          </Space.Compact>
        </form>
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
                    height: "460px",
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
                          <div style={{ marginTop: "8px", lineHeight: "1.6" }}>
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
                              <Text
                                strong
                                style={{ fontSize: "14px" }}
                              >
                                {result.title}
                              </Text>
                              <div style={{ fontSize: "12px", color: "#999" }}>
                                ID: {result.doc_id}
                              </div>
                            </div>
                            {result.snippet && (
                              <Text style={{ fontSize: "12px", color: "#666" }}>
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
                    height: "460px",
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
                              <Text
                                strong
                                style={{ fontSize: "14px" }}
                              >
                                {result.title}
                              </Text>
                              <div style={{ fontSize: "12px", color: "#999" }}>
                                ID: {result.doc_id}
                              </div>
                            </div>
                            {result.snippet && (
                              <Text style={{ fontSize: "12px", color: "#666" }}>
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
            // {
            //   key: "chat",
            //   label: (
            //     <span>
            //       <SendOutlined />
            //       채팅
            //     </span>
            //   ),
            //   children: (
            //     <div
            //       ref={viewRef}
            //       style={{
            //         height: "260px",
            //         overflow: "auto",
            //         padding: "16px",
            //         background: "#f8f9fa",
            //         borderRadius: "12px",
            //         border: "1px solid #e0e0e0",
            //         whiteSpace: "pre-wrap",
            //         lineHeight: "1.6",
            //         fontSize: "16px",
            //       }}
            //     >
            //       {loading ? (
            //         <div style={{ textAlign: "center", padding: "40px" }}>
            //           <Spin size="large" />
            //           <div style={{ marginTop: "16px", color: "#666" }}>
            //             답변을 생성하고 있습니다...
            //           </div>
            //         </div>
            //       ) : answer ? (
            //         answer
            //       ) : (
            //         <div
            //           style={{
            //             color: "#999",
            //             textAlign: "center",
            //             padding: "40px",
            //           }}
            //         >
            //           질문을 입력하고 답변을 받아보세요
            //         </div>
            //       )}
            //     </div>
            //   ),
            // },
          ]}
        />
      </Card>
    </>
  );
};

export default Learning;
