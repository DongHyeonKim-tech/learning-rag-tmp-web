"use client";

import React from "react";
import styles from "@/styles/sidebar.module.css";
import { Button } from "antd";

const Sidebar = ({
  chatRooms,
  fetchChatMessages,
  createTempChatRoomHandler,
  newChatLoading,
  chatId,
}: {
  chatRooms: any[];
  fetchChatMessages: (chatId: number) => void;
  createTempChatRoomHandler: () => void;
  newChatLoading: boolean;
  chatId: number | null;
}) => {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderTitle}>BIM Search</div>
        {/* <Flex
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
        </Flex> */}
      </div>
      <div className={styles.sidebarContent}>
        <Button
          type="default"
          onClick={() => {
            createTempChatRoomHandler();
          }}
          disabled={newChatLoading}
          style={{
            border: chatId === null ? "2px solid #6ea6ff" : undefined,
            boxShadow:
              chatId === null
                ? "0 0 0 0 #a78bfa, 0 0 8px 2px #6ea6ff, 0 0 16px 4px #a78bfa"
                : undefined,
            animation:
              chatId === null
                ? "flash-border 1.2s infinite alternate"
                : undefined,
            backgroundColor: chatId === null ? "#82b2ff" : undefined,
            color: chatId === null ? "#fff" : undefined,
          }}
        >
          New Chat
        </Button>
        <div className={styles.chatRoomList}>
          {chatRooms.map((item) => {
            return (
              <div
                className={styles.chatTitle}
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  cursor: "pointer",
                  padding: "6px 10px",
                  fontWeight: chatId === item.chatId ? "bold" : "normal",
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
    </div>
  );
};

export default Sidebar;
