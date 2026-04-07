"use client";

import { Button, Spin } from "antd";
import { StopOutlined } from "@ant-design/icons";
import styles from "@/styles/search.module.css";
import Image from "next/image";
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
      {/* <Space.Compact className={styles.compactFull}>
        <Input
          size="large"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.searchInput}
          onPressEnter={() => onSubmit()}
          disabled={loading}
        />
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          disabled={loading || !value.trim()}
          icon={loading ? <Spin size="small" /> : <SearchOutlined />}
          className={styles.searchSubmitBtn}
        ></Button>
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
      </Space.Compact> */}
      <div className={styles.searchSection}>
        <input
          type="text"
          size={20}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.searchInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          disabled={loading}
        />
        <div className={styles.searchInputButtonWrapper}>
          <div className={styles.searchInputButtonContent}>
            <button
              disabled={loading || !value.trim()}
              className={styles.searchInputButton}
            >
              {loading ? (
                <Spin size="small" />
              ) : (
                <Image
                  src="/search/images/arrow-right.svg"
                  alt="arrow-right"
                  width={24}
                  height={24}
                />
              )}
            </button>
            {showStopButton && onStop && (
              <Button
                size="large"
                icon={<StopOutlined />}
                onClick={onStop}
                className={styles.searchInputButton}
              >
                중지
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
