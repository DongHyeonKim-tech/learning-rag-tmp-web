"use client";

import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
} from "react";
import {
  SearchResponseFramework,
  searchFrameworkDocuments,
  SearchParamsFramework,
} from "@/utils/searchApi";
import "@ant-design/v5-patch-for-react-19";
import { notification, Card, Typography, Spin, Tabs, Flex, Image } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FrameworkRef } from "@/app/page";
import styles from "@/styles/search.module.css";

const { Text } = Typography;

const Framework = forwardRef<
  FrameworkRef,
  {
    input: string;
    searchLoading: boolean;
    setSearchLoading: (v: boolean) => void;
    onLoadingChange: (v: boolean) => void;
  }
>(function Framework(
  { input, searchLoading, setSearchLoading, onLoadingChange },
  ref
) {
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponseFramework>({
    prompt: "",
    answer: "",
    images: [],
    links: [],
    sources: [],
    total_sources: 0,
  });
  const [activeTab, setActiveTab] = useState("search");

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  const onStop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const onSearch = useCallback(async () => {
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
  }, [input, setSearchLoading]);

  useImperativeHandle(
    ref,
    () => ({
      search: onSearch,
      stop: onStop,
    }),
    [onSearch, onStop]
  );

  return (
    <Card className={`${styles.contentCard} ${styles.contentCardMinHeight}`}>
      <div className={`${styles.tabPanel} ${styles.tabPanel544}`}>
        {searchLoading ? (
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
    </Card>
  );
});

export default Framework;
