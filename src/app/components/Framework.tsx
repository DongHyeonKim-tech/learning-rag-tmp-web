"use client";

import { useState, useRef } from "react";
import {
  SearchResponseFramework,
  searchFrameworkDocuments,
  SearchParamsFramework,
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
  Flex,
  Image,
} from "antd";
import { StopOutlined, SearchOutlined } from "@ant-design/icons";

const { Text } = Typography;

const Framework = () => {
  const [input, setInput] = useState("프로젝트 파일 생성");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponseFramework>({
    prompt: "",
    answer: "",
    images: [],
    links: [],
    sources: [],
    total_sources: 0,
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  const abortRef = useRef<AbortController | null>(null);

  const onStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const onSearch = async () => {
    if (!input.trim()) return;

    setSearchLoading(true);
    setSearchResults({
      prompt: "",
      answer: "",
      images: [],
      links: [],
      sources: [],
      total_sources: 0,
    });
    ("");

    try {
      const searchParams: SearchParamsFramework = {
        query: input,
        top_k: 10,
        use_context: 5,
        filters: {
          category_path: ["string"],
        },
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 1024,
        model: "json",
        use_kure: false,
      };

      const response = await searchFrameworkDocuments(searchParams);
      setSearchResults(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("Search error:", errorMessage);
      notification.error({ message: "검색 중 오류가 발생했습니다." });
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: "16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        border: "none",
        minHeight: "400px",
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
      >
        <Space.Compact style={{ width: "100%" }}>
          <Input
            size="large"
            placeholder={"검색어를 입력해주세요..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              borderRadius: "12px 0 0 12px",
              border: "2px solid #e0e0e0",
              fontSize: "16px",
            }}
            onPressEnter={onSearch}
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
          {loading && (
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
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
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
                  height: "533px",
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
                ) : searchResults.answer ? (
                  <Flex vertical>
                    {searchResults.images &&
                      searchResults.images.map((image) => (
                        <div key={image.id}>
                          <Image
                            src={image.file_path}
                            alt={image.id}
                            style={{ maxWidth: 1100 }}
                          />
                        </div>
                      ))}
                    <div
                      style={{
                        display: "flex",
                      }}
                    >
                      <Card
                        size="small"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                          background: "#f8f9fa",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: "12px",
                            color: "#666",
                            whiteSpace: "pre-line",
                          }}
                        >
                          {searchResults.answer
                            .split(/\*\*(.*?)\*\*/g)
                            .map((part, idx) =>
                              idx % 2 === 1 ? <b key={idx}>{part}</b> : part
                            )}
                        </Text>
                      </Card>
                    </div>
                  </Flex>
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
        ]}
      />
    </Card>
  );
};

export default Framework;
