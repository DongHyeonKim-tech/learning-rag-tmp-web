"use client";

import { Button, Input, Space } from "antd";
import { SearchOutlined, StopOutlined } from "@ant-design/icons";
import styles from "@/styles/search.module.css";

export type SearchFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  loading?: boolean;
  placeholder?: string;
  showStopButton?: boolean;
  onStop?: () => void;
};

export default function SearchForm({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = "검색어를 입력해주세요.",
  showStopButton = false,
  onStop,
}: SearchFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
    >
      <Space.Compact className={styles.compactFull}>
        <Input
          size="large"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.searchInput}
          onPressEnter={() => onSubmit()}
        />
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          disabled={loading || !value.trim()}
          icon={<SearchOutlined />}
          className={styles.searchSubmitBtn}
        >
          {loading ? "검색 중..." : "검색하기"}
        </Button>
        {showStopButton && onStop && (
          <Button
            size="large"
            icon={<StopOutlined />}
            onClick={onStop}
            className={styles.searchStopBtn}
          >
            중지
          </Button>
        )}
      </Space.Compact>
    </form>
  );
}
