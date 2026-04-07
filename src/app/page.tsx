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
import { FeedbackModal } from "@/app/components/modal/FeedbackModal";
import { validateHubToken, getHubMyInfo } from "@/utils/searchApi";
import { useUserStore } from "@/utils/store";
import { useCookies } from "react-cookie";
import { router } from "next/client";
import { SmileOutlined } from "@ant-design/icons";
import { Spin } from "antd";

export default function Home() {
  const { user, updateUser } = useUserStore();
  const [cookies, setCookies, removeCookies] = useCookies(["refreshToken"]);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState(
    "캐드 import 하는 방법 알려줘"
  );
  const [fetchChatRoomsLoading, setFetchChatRoomsLoading] =
    useState<boolean>(false);
  const [chatRooms, setChatRooms] = useState<ChatRoomData[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [messageId, setMessageId] = useState<number | null>(null);
  const [newChatLoading, setNewChatLoading] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [messageTurns, setMessageTurns] = useState<Turn[]>([]);
  const [currentTurn, setCurrentTurn] = useState<Turn | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  useEffect(() => {
    console.log("messageTurns: ", messageTurns);
  }, [messageTurns]);

  const checkHubToken = async () => {
    setLoginLoading(true);
    try {
      const checkHubTokenResponse = await validateHubToken();

      if (checkHubTokenResponse.status === 200) {
        const getHubMyInfoResponse = await getHubMyInfo();

        if (getHubMyInfoResponse?.EMP_NO) {
          const userData = {
            code: "0",
            empNo: getHubMyInfoResponse?.EMP_NO,
            userNm: getHubMyInfoResponse?.USER_NM,
            deptNm: getHubMyInfoResponse?.DEPT_NM,
            deptCd: getHubMyInfoResponse?.DEPT_CD,
            titleNm: getHubMyInfoResponse?.TITLE_NM,
            titleCd: getHubMyInfoResponse?.TITLE_CD,
            email: `${getHubMyInfoResponse?.USER_ID}@haeahn.com`,
            isCookieLogin: true,
          };
          updateUser(userData);
          setImageUrl(
            `https://hub.haeahn.com/Storage/GW/ImageStorage/Employee/${
              getHubMyInfoResponse?.USER_ID
            }.jpg`
          );
        }
      }
    } catch (error) {
      console.error("Error checking hub token:", error);
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchChatRooms = async () => {
    if (!user.empNo) return;
    setFetchChatRoomsLoading(true);
    try {
      const data = await getChatRooms(user.empNo);
      setChatRooms(data);
    } catch {
      setChatRooms([]);
      openNotification("error", "채팅 기록 조회 중 오류가 발생했습니다.");
    } finally {
      setFetchChatRoomsLoading(false);
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
    if (user.empNo) {
      fetchChatRooms();
    }
  }, [user]);

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

  const deleteChatRoomHandler = async (selectedChatId: number) => {
    if (!selectedChatId || !user.empNo) return;
    try {
      const success = await deleteChatRoom(selectedChatId, user.empNo);
      if (success) {
        fetchChatRooms();
        if (selectedChatId === chatId) {
          setChatId(null);
          setMessageTurns([]);
          setCurrentTurn(null);
        }
        openNotification("success", "채팅방 삭제를 완료했습니다.");
      }
    } catch {
      openNotification("error", "채팅방 삭제 중 에러가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (cookies?.refreshToken) {
      checkHubToken();
    } else {
      if (process.env.NEXT_PUBLIC_ENV === "development") {
        updateUser({ empNo: "20230808" });
      } else {
        window.location.href =
          "https://hubnx.haeahn.com/login/#/login?redirect=bim";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookies]);

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
        fetchChatRoomsLoading={fetchChatRoomsLoading}
      />
      <div className={styles.contentContainer}>
        <div className={styles.pageContainer}>
          <div className={styles.topNavSection}>
            <div className={styles.topNavDotsAnchor}>
              <div className={styles.topNavWrapper}>
                <Image
                  src="/search/images/dots.svg"
                  alt="dots"
                  width={20}
                  height={20}
                  className={styles.topNavDots}
                />
              </div>
              <div
                className={styles.dotsPopover}
                role="region"
                aria-label="추가 메뉴"
              >
                <div
                  className={styles.dotsPopoverContentItem}
                  onClick={() => {
                    setFeedbackModalOpen(true);
                  }}
                >
                  의견 보내기
                </div>
              </div>
            </div>
            {process.env.NEXT_PUBLIC_ENV === "development" ? (
              <SmileOutlined />
            ) : (
              <Image
                src={imageUrl}
                width={40}
                height={40}
                alt="profile"
                className={styles.headerProfileAvatar}
              />
            )}
          </div>
          <Search
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            chatId={chatId}
            onStreamMetaUpdate={handleLearningStreamMeta}
            messageTurns={messageTurns}
            setMessageTurns={setMessageTurns}
            currentTurn={currentTurn}
            setCurrentTurn={setCurrentTurn}
            setNewChatLoading={setNewChatLoading}
            setChatRooms={setChatRooms}
            setChatLoading={setChatLoading}
          />
        </div>
      </div>
      <FeedbackModal
        open={feedbackModalOpen}
        onCancel={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
}
