"use client";

import { useState, useRef, useCallback } from "react";
import {
  SearchResponseFramework,
  searchFrameworkDocuments,
  SearchParamsFramework,
} from "@/utils/searchApi";
import "@ant-design/v5-patch-for-react-19";
import { notification, Card, Typography, Spin, Flex, Image } from "antd";
import styles from "@/styles/search.module.css";
import SearchForm from "@/app/components/SearchForm";

const { Text } = Typography;

function Framework() {
  const [searchInput, setSearchInput] = useState("프로젝트 파일 생성");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponseFramework>({
    prompt: "",
    answer: "",
    images: [],
    links: [],
    sources: [],
    total_sources: 0,
  });

  const abortRef = useRef<AbortController | null>(null);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const onSearch = useCallback(async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    setSearchResults({
      prompt: "",
      answer: "",
      images: [],
      links: [],
      sources: [],
      total_sources: 0,
    });
    try {
      const searchParams: SearchParamsFramework = {
        query: searchInput,
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
      setLoading(false);
    }
  }, [searchInput]);

  const handleSearchSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      onSearch();
    },
    [onSearch]
  );

  return (
    <>
      <Card className={`${styles.contentCard} ${styles.contentCardMinHeight}`}>
        <div className={`${styles.tabPanel} ${styles.tabPanel544}`}>
          {loading ? (
            <div className={styles.loadingWrap}>
              <Spin size="large" />
              <div className={styles.loadingText}>검색 중입니다...</div>
            </div>
          ) : searchResults.answer ? (
            <Flex vertical>
              {searchResults.images &&
                searchResults.images.map((image) => (
                  <div key={image.id}>
                    <Image
                      src={image.file_path}
                      alt={image.id}
                      className={styles.frameworkImage}
                    />
                  </div>
                ))}
              <div className={styles.resultFlex}>
                <Card
                  size="small"
                  className={styles.smallCard}
                >
                  <Text className={styles.smallCardText}>
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
            <div className={styles.emptyState}>
              검색어를 입력하고 검색해보세요
            </div>
          )}
        </div>
        <Flex
          gap={12}
          align="center"
          className={styles.modelSection}
          justify="center"
          vertical
        >
          <div style={{ width: "100%" }}>
            <SearchForm
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              loading={loading}
              showStopButton={loading}
              onStop={onStop}
            />
          </div>
        </Flex>
      </Card>
    </>
  );
}

export default Framework;
