"use client";

import React, { useState } from "react";
import styles from "@/styles/sidebar.module.css";
import { Modal, Spin } from "antd";
import Image from "next/image";
import { LoadingOutlined } from "@ant-design/icons";

const Sidebar = ({
  chatRooms,
  fetchChatMessages,
  createTempChatRoomHandler,
  newChatLoading,
  chatId,
  deleteChatRoomHandler,
  chatLoading,
  fetchChatRoomsLoading,
}: {
  chatRooms: any[];
  fetchChatMessages: (chatId: number) => void;
  createTempChatRoomHandler: () => void;
  newChatLoading: boolean;
  chatId: number | null;
  deleteChatRoomHandler: (chatId: number) => void;
  chatLoading: boolean;
  fetchChatRoomsLoading: boolean;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const confirmDeleteChatRoom = async (title: string, chatId: number) => {
    Modal.confirm({
      title: "채팅방 삭제",
      content: `"${title}" 채팅방을 삭제하시겠습니까?`,
      onOk: () => {
        deleteChatRoomHandler(chatId);
      },
      onCancel: () => {
        return;
      },
      okText: "삭제",
      cancelText: "취소",
      okButtonProps: {
        type: "primary",
        danger: true,
      },
      cancelButtonProps: {
        type: "default",
      },
    });
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarHeaderTitle}>BIM Search</div>
        <div
          className={styles.newChatButton}
          onClick={() => {
            createTempChatRoomHandler();
          }}
        >
          <Image
            src={"/search/images/plus.svg"}
            alt="plus"
            width={14}
            height={14}
          />
          <span className={styles.newChatButtonText}>새 채팅</span>
        </div>
      </div>
      {fetchChatRoomsLoading ? (
        <div className={styles.sidebarLoading}>
          <Spin
            size="large"
            indicator={
              <LoadingOutlined
                spin
                style={{ fontSize: 40 }}
              />
            }
          />
        </div>
      ) : (
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarContentHeader}>
            <div className={styles.sidebarContentHeaderTitle}>채팅 목록</div>
            <Image
              className={styles.collapsedIcon}
              src={
                collapsed
                  ? "/search/images/collapsed.svg"
                  : "/search/images/uncollapsed.svg"
              }
              alt="collapsed"
              width={11}
              height={6}
              onClick={() => {
                if (chatRooms.length === 0) return;
                setCollapsed(!collapsed);
              }}
            />
          </div>
          <div className={`${styles.chatRoomList}`}>
            <div
              className={`${styles.chatRoomListInner} ${collapsed ? styles.collapsed : ""}`}
            >
              {chatRooms.length > 0 ? (
                chatRooms.map((item) => {
                  return (
                    <div
                      className={`${styles.chatRoomItem} ${chatId === item.chatId ? styles.chatRoomItemActive : ""}`}
                      style={{
                        fontWeight: chatId === item.chatId ? "bold" : "normal",
                      }}
                      key={item.chatId}
                      onClick={(e) => {
                        // If click is directly on the image, do not fetch messages.
                        if (
                          (e.target as HTMLElement).closest("img") // to support SSR with next/image and native img
                        ) {
                          return;
                        }
                        fetchChatMessages(item.chatId);
                      }}
                    >
                      {newChatLoading && !item.chatId ? (
                        <Spin
                          indicator={
                            <LoadingOutlined
                              spin
                              style={{
                                color: "#6F7581",
                              }}
                            />
                          }
                          size="small"
                        />
                      ) : (
                        <span
                          className={`${styles.chatRoomItemTitle} ${chatId === item.chatId ? styles.chatRoomItemTitleActive : ""}`}
                        >
                          {item.title}
                        </span>
                      )}
                      {item.chatId && chatId === item.chatId && chatLoading && (
                        <Spin
                          indicator={
                            <LoadingOutlined
                              spin
                              style={{
                                color: "#6F7581",
                              }}
                            />
                          }
                          size="small"
                        />
                      )}
                      {item.chatId && (
                        <div className={styles.removeChatRoomButtonWrapper}>
                          <div className={styles.removeChatRoomButton}>
                            <Image
                              src="/search/images/close.svg"
                              alt="delete"
                              width={16}
                              height={16}
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteChatRoom(item.title, item.chatId);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyChatRoomList}>
                  채팅 목록이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
