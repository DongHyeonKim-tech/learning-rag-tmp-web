"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "@/styles/search.module.css";
import Sidebar from "@/app/layout/Sidebar";
import {
  deleteChatRoom,
  getChatMessages,
  getChatRooms,
} from "@/utils/searchApi";
import { openNotification } from "@/utils/common";
import { ChatRoomData, Turn } from "@/app/Interface";
import Search from "@/app/components/Search";
import Image from "next/image";

export default function Home() {
  const [searchInput, setSearchInput] = useState(
    "캐드 import 하는 방법 알려줘"
  );
  const [chatRooms, setChatRooms] = useState<ChatRoomData[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messageId, setMessageId] = useState<number | null>(null);
  const [newChatLoading, setNewChatLoading] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messageTurns, setMessageTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);

  useEffect(() => {
    console.log("messageTurns: ", messageTurns);
  }, [messageTurns]);

  const fetchChatRooms = async () => {
    try {
      const data = await getChatRooms("20230808");
      setChatRooms(data);
    } catch {
      setChatRooms([]);
      openNotification("error", "채팅 기록 조회 중 오류가 발생했습니다.");
    }
  };

  const fetchChatMessages = async (selectedChatId: number) => {
    if (!selectedChatId) return;
    try {
      if (!chatId) {
        setChatRooms((prev: ChatRoomData[]) => {
          return prev.filter((item: ChatRoomData) => item.chatId);
        });
      }
      const res = await getChatMessages(selectedChatId);
      console.log("fetchChatMessages res: ", res);
      setMessageTurns(res);
      setCurrentTurn(null);
      setChatId(selectedChatId);
      setSearchInput("");
      console.log("messages: ", res);
      // setMessageTurns(data.messages.map((item: any) => ({ query: item.content, summary: item.summary, results: item.results })));
    } catch {
      openNotification("error", "채팅 메시지 조회 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    console.log("chatId: ", chatId);
  }, [chatId]);

  const createTempChatRoomHandler = async () => {
    setNewChatLoading(false);
    if (chatId) {
      setChatId(null);
      setMessageTurns([]);
      setCurrentTurn(null);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  useEffect(() => {
    console.log("currentTurn: ", currentTurn);
  }, [currentTurn]);

  const handleLearningStreamMeta = useCallback(
    (
      nextChatId: number | null,
      nextMessageId: number | null,
      nextTitle: string | null
    ) => {
      if (nextChatId) {
        setChatId(nextChatId);
        setMessageId(nextMessageId);

        setChatRooms((prev: ChatRoomData[]) => {
          return prev.map((item: ChatRoomData) => {
            if (!item.chatId) {
              return { ...item, chatId: nextChatId, title: nextTitle ?? "" };
            }
            return item;
          });
        });
      }
    },
    []
  );

  const deleteChatRoomHandler = async (chatId: number) => {
    if (!chatId) return;
    try {
      const success = await deleteChatRoom(chatId, "20230808");
      if (success) {
        fetchChatRooms();
        openNotification("success", "채팅방 삭제를 완료했습니다.");
      }
    } catch {
      openNotification("error", "채팅방 삭제 중 에러가 발생했습니다.");
    }
  };

  return (
    <div className={styles.pageRoot}>
      <Sidebar
        chatRooms={chatRooms}
        fetchChatMessages={fetchChatMessages}
        createTempChatRoomHandler={createTempChatRoomHandler}
        newChatLoading={newChatLoading}
        chatId={chatId}
        deleteChatRoomHandler={deleteChatRoomHandler}
        chatLoading={chatLoading}
      />
      <div className={styles.contentContainer}>
        <div className={styles.pageContainer}>
          <div className={styles.topNavSection}>
            <div className={styles.topNavWrapper}>
              <Image
                src="/search/images/dots.svg"
                alt="dots"
                width={20}
                height={20}
                className={styles.topNavDots}
              />
            </div>
          </div>
          <Search
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            chatId={chatId}
            onStreamMetaUpdate={handleLearningStreamMeta}
            messageTurns={messageTurns}
            setMessageTurns={setMessageTurns}
            empNo={"20230808"}
            currentTurn={currentTurn}
            setCurrentTurn={setCurrentTurn}
            setNewChatLoading={setNewChatLoading}
            setChatRooms={setChatRooms}
            setChatLoading={setChatLoading}
          />
        </div>
      </div>
    </div>
  );
}
