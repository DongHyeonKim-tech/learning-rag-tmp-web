"use client";

import { useEffect, useState, useCallback } from "react";
import { Flex } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";
import styles from "@/styles/search.module.css";
import Sidebar from "@/app/layout/Sidebar";
import { getChatMessages, getChatRooms } from "@/utils/searchApi";
import { openNotification } from "@/utils/common";
import { ChatRoomData, Turn } from "@/app/Interface";

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");
  const [searchInput, setSearchInput] = useState(
    "캐드 import 하는 방법 알려줘"
  );
  const [chatRooms, setChatRooms] = useState<ChatRoomData[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messageId, setMessageId] = useState<number | null>(null);
  const [newChatLoading, setNewChatLoading] = useState<boolean>(false);
  const [messageTurns, setMessageTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);

  useEffect(() => {
    console.log("messageTurns: ", messageTurns);
  }, [messageTurns]);

  const fetchChatRooms = async () => {
    try {
      const data = await getChatRooms("20230808");
      setChatRooms([{ chatId: null, title: "새 채팅방" }, ...data]);
    } catch {
      setChatRooms([{ chatId: null, title: "새 채팅방" }]);
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
    if (chatId) {
      setChatId(null);
      setChatRooms((prev: ChatRoomData[]) => {
        return [{ chatId: null, title: "새 채팅방" }, ...prev];
      });
      setMessageTurns([]);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, []);

  return (
    <div className={styles.pageRoot}>
      <Flex gap={24}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setSearchInput={setSearchInput}
          chatRooms={chatRooms}
          fetchChatMessages={fetchChatMessages}
          createTempChatRoomHandler={createTempChatRoomHandler}
          newChatLoading={newChatLoading}
        />
        <div className={styles.pageContainer}>
          {activeTab === "learning" ? (
            <Learning
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              chatId={chatId}
              setChatId={setChatId}
              setMessageId={setMessageId}
              messageTurns={messageTurns}
              setMessageTurns={setMessageTurns}
              empNo={"20230808"}
              currentTurn={currentTurn}
              setCurrentTurn={setCurrentTurn}
            />
          ) : (
            <Framework
              searchInput={searchInput}
              setSearchInput={setSearchInput}
            />
          )}
        </div>
      </Flex>
    </div>
  );
}
