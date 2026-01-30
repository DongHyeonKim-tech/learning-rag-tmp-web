"use client";

import { useState, useRef, useCallback } from "react";
import { Button, Flex, Typography, Card, Space } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";
import SearchForm from "@/app/components/SearchForm";
import styles from "@/styles/search.module.css";

const { Text } = Typography;

export type LearningRef = { search: () => void };
export type FrameworkRef = { search: () => void; stop: () => void };

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");
  const [selectedModel, setSelectedModel] = useState<
    "bge-m3" | "kure" | "full" | "json"
  >("bge-m3");
  const [searchInput, setSearchInput] = useState("HDA BIM 어워드");
  const [searchLoading, setSearchLoading] = useState(false);
  const [frameworkLoading, setFrameworkLoading] = useState(false);

  const learningRef = useRef<LearningRef>(null);
  const frameworkRef = useRef<FrameworkRef>(null);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (activeTab === "learning") {
        learningRef.current?.search();
      } else {
        frameworkRef.current?.search();
      }
    },
    [activeTab]
  );

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageContainer}>
        <Card className={styles.headerCard}>
          <Flex
            vertical
            gap={24}
            align="center"
          >
            <div className={styles.pageTitle}>BIM RAG</div>
            <Flex
              gap={8}
              align="center"
              wrap="wrap"
              justify="center"
            >
              <Button
                type={activeTab === "learning" ? "primary" : "default"}
                onClick={() => {
                  setActiveTab("learning");
                  setSearchInput("HDA BIM 어워드");
                }}
                className={`${styles.tabButton} ${activeTab === "learning" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Learning
              </Button>
              <Button
                type={activeTab === "framework" ? "primary" : "default"}
                onClick={() => {
                  setActiveTab("framework");
                  setSearchInput("프로젝트 파일 생성");
                }}
                className={`${styles.tabButton} ${activeTab === "framework" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Framework
              </Button>
            </Flex>

            <Flex
              gap={12}
              align="center"
              className={styles.modelSection}
              justify="center"
              vertical
            >
              {activeTab === "learning" && (
                <Flex
                  gap={12}
                  align="center"
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
              <div style={{ width: "100%" }}>
                <SearchForm
                  value={searchInput}
                  onChange={setSearchInput}
                  onSubmit={handleSearchSubmit}
                  loading={searchLoading}
                  showStopButton={activeTab === "framework" && frameworkLoading}
                  onStop={() => frameworkRef.current?.stop()}
                />
              </div>
            </Flex>
          </Flex>
        </Card>
        {activeTab === "learning" ? (
          <Learning
            ref={learningRef}
            input={searchInput}
            searchLoading={searchLoading}
            setSearchLoading={setSearchLoading}
            selectedModel={selectedModel}
          />
        ) : (
          <Framework
            ref={frameworkRef}
            input={searchInput}
            searchLoading={searchLoading}
            setSearchLoading={setSearchLoading}
            onLoadingChange={setFrameworkLoading}
          />
        )}
      </div>
    </div>
  );
}
