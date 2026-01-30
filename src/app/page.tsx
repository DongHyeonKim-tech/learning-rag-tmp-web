"use client";

import { useState } from "react";
import { Button, Flex, Typography, Card, Space } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";

const { Title, Text } = Typography;

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");
  const [selectedModel, setSelectedModel] = useState<
    "bge-m3" | "kure" | "full" | "json"
  >("bge-m3");

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
        {/* 헤더 + 모델 선택 통합 */}
        <Card
          style={{
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            border: "none",
            overflow: "hidden",
          }}
          bodyStyle={{
            padding: "24px 28px",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Flex
            vertical
            gap={24}
            align="center"
          >
            <Title
              level={1}
              style={{ color: "#667eea", margin: 0, fontSize: "28px" }}
            >
              BIM RAG
            </Title>
            <Flex
              gap={8}
              align="center"
              wrap="wrap"
              justify="center"
            >
              <Button
                type={activeTab === "learning" ? "primary" : "default"}
                onClick={() => setActiveTab("learning")}
                style={{
                  minWidth: "120px",
                  height: "40px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  ...(activeTab === "learning"
                    ? {
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        border: "none",
                        color: "#fff",
                      }
                    : { borderColor: "#ddd" }),
                }}
              >
                Learning
              </Button>
              <Button
                type={activeTab === "framework" ? "primary" : "default"}
                onClick={() => setActiveTab("framework")}
                style={{
                  minWidth: "120px",
                  height: "40px",
                  borderRadius: "8px",
                  fontWeight: 500,
                  transition: "all 0.3s ease",
                  ...(activeTab === "framework"
                    ? {
                        background: "linear-gradient(45deg, #667eea, #764ba2)",
                        border: "none",
                        color: "#fff",
                      }
                    : { borderColor: "#ddd" }),
                }}
              >
                Framework
              </Button>
            </Flex>
            {activeTab === "learning" && (
              <Flex
                gap={12}
                align="center"
                style={{
                  width: "100%",
                  paddingTop: "16px",
                  borderTop: "1px solid #f0f0f0",
                }}
                justify="center"
              >
                <Text style={{ color: "#666", fontSize: "13px" }}>
                  검색 모델 선택
                </Text>
                <Space
                  size="small"
                  wrap
                  style={{ justifyContent: "center" }}
                >
                  {(
                    [
                      ["bge-m3", "BAAI/bge-m3"],
                      ["kure", "nlpai-lab/KURE-v1"],
                      ["full", "BAAI/bge-m3 Full Docs"],
                      ["json", "JSON 원본 추가 검색"],
                    ] as const
                  ).map(([key, label]) => (
                    <Button
                      key={key}
                      type={selectedModel === key ? "primary" : "default"}
                      size="middle"
                      onClick={() => setSelectedModel(key)}
                      style={{
                        borderRadius: "8px",
                        minWidth: "120px",
                        ...(selectedModel === key && {
                          background:
                            "linear-gradient(45deg, #667eea, #764ba2)",
                          border: "none",
                        }),
                      }}
                    >
                      {label}
                    </Button>
                  ))}
                </Space>
              </Flex>
            )}
          </Flex>
        </Card>
        {activeTab === "learning" ? (
          <Learning selectedModel={selectedModel} />
        ) : (
          <Framework />
        )}
      </div>
    </div>
  );
}
