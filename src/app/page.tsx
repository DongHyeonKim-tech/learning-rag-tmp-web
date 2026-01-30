"use client";

import { useState } from "react";
import { Button, Flex, Typography, Card, Space } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";
import styles from "@/styles/search.module.css";

const { Title, Text } = Typography;

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");
  const [selectedModel, setSelectedModel] = useState<
    "bge-m3" | "kure" | "full" | "json"
  >("bge-m3");

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageContainer}>
        <Card className={styles.headerCard}>
          <Flex
            vertical
            gap={24}
            align="center"
          >
            <Title
              level={1}
              className={styles.pageTitle}
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
                className={`${styles.tabButton} ${activeTab === "learning" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Learning
              </Button>
              <Button
                type={activeTab === "framework" ? "primary" : "default"}
                onClick={() => setActiveTab("framework")}
                className={`${styles.tabButton} ${activeTab === "framework" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Framework
              </Button>
            </Flex>
            {activeTab === "learning" && (
              <Flex
                gap={12}
                align="center"
                className={styles.modelSection}
                justify="center"
              >
                <Text className={styles.modelLabel}>검색 모델 선택</Text>
                <Space
                  size="small"
                  wrap
                  className={styles.modelButtonWrap}
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
                      className={`${styles.modelButton} ${selectedModel === key ? styles.modelButtonActive : ""}`}
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
