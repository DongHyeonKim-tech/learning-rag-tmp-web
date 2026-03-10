"use client";

import React from "react";
import styles from "@/styles/sidebar.module.css";
import { Flex, Button } from "antd";

const Sidebar = ({
  activeTab,
  setActiveTab,
  setSearchInput,
  chatRooms,
  fetchChatMessages,
  createTempChatRoomHandler,
  newChatLoading,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setSearchInput: (input: string) => void;
  chatRooms: any[];
  fetchChatMessages: (chatId: number) => void;
  createTempChatRoomHandler: () => void;
  newChatLoading: boolean;
}) => {
  console.log("chatRooms: ", chatRooms);
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
        <Button
          type="default"
          onClick={() => {
            createTempChatRoomHandler();
          }}
        >
          New Chat
        </Button>
        {chatRooms.map((item) => {
          return (
            <div
              className={styles.chatTitle}
              style={{
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                cursor: "pointer",
                padding: "6px 10px",
              }}
              key={item.chatId}
              onClick={() => {
                fetchChatMessages(item.chatId);
              }}
            >
              {newChatLoading && !item.chatId ? (
                <span>loading</span>
              ) : (
                item.title
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
