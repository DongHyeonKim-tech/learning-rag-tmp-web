import React, { useState } from "react";
import styles from "@/styles/sidebar.module.css";
import { Flex, Button } from "antd";
import { createChatTitle } from "@/utils/searchApi";

const Sidebar = ({
  activeTab,
  setActiveTab,
  searchInput,
  setSearchInput,
  chatTitle,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchInput: string;
  setSearchInput: (input: string) => void;
  chatTitle: string;
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderTitle}>BIM RAG</div>
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
              setSearchInput("캐드 import 하는 방법 알려줘");
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
      </div>
      <div className={styles.sidebarContent}>
        <Button type={"default"}>New Chat</Button>
        <div className={styles.chatTitle}>{chatTitle}</div>
      </div>
    </div>
  );
};

export default Sidebar;
