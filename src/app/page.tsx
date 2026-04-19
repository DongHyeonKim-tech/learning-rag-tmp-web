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
import { useAuthStore, useUserStore } from "@/utils/store";
import { useCookies } from "react-cookie";
import { SmileOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import CheckAuthModal from "@/app/components/modal/CheckAuthModal";
import AdminModal from "@/app/components/modal/AdminModal";

export default function Home() {
  const { user, updateUser } = useUserStore();
  const { isAuthenticated, setIsAuthenticated } = useAuthStore();
  const [cookies] = useCookies(["refreshToken"]);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState(
    "신규 BIM 프로젝트 시작 시에 도움이 될 만한 사항 정리해줘"
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
  const [checkAuthModalOpen, setCheckAuthModalOpen] = useState<boolean>(false);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

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
      setMessageTurns(res);
      setCurrentTurn(null);
      setChatId(selectedChatId);
      setSearchInput("");
      // setMessageTurns(data.messages.map((item: any) => ({ query: item.content, summary: item.summary, results: item.results })));
    } catch {
      openNotification("error", "채팅 메시지 조회 중 오류가 발생했습니다.");
    }
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    [chatId]
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

  const handleAuthenticate = async (
    password: string,
    setPassword: (password: string) => void
  ) => {
    try {
      console.log(password, process.env.NEXT_PUBLIC_ADMIN_AUTH);
      if (password === process.env.NEXT_PUBLIC_ADMIN_AUTH) {
        setIsAuthenticated(true);
        setCheckAuthModalOpen(false);
        setAdminModalOpen(true);
        setPassword("");
      }
    } catch (error) {
      console.error("Error authenticating:", error);
    }
  };

  const handleChangeAdmin = async (
    empNo: string,
    setEmpNo: (empNo: string) => void
  ) => {
    try {
      updateUser({ ...user, empNo });
      setAdminModalOpen(false);
      setEmpNo("");
      setCurrentTurn(null);
      setMessageTurns([]);
      setChatId(null);
      setMessageId(null);
    } catch (error) {
      console.error("Error changing admin:", error);
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
      {loginLoading ? (
        <Spin
          fullscreen
          size="large"
        />
      ) : (
        <>
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
                    {user.empNo === "20230808" &&
                      !isAuthenticated &&
                      process.env.NEXT_PUBLIC_ENV === "production" && (
                        <div
                          className={styles.dotsPopoverContentItem}
                          onClick={() => {
                            setCheckAuthModalOpen(true);
                          }}
                        >
                          관리자
                        </div>
                      )}
                    {isAuthenticated && (
                      <>
                        <div
                          className={styles.dotsPopoverContentItem}
                          onClick={() => {
                            setAdminModalOpen(true);
                          }}
                        >
                          계정 전환
                        </div>
                        <div
                          className={styles.dotsPopoverContentItem}
                          onClick={() => {
                            setIsAuthenticated(false);
                            setCurrentTurn(null);
                            setMessageTurns([]);
                            setChatId(null);
                            setMessageId(null);
                            updateUser({ ...user, empNo: "20230808" });
                          }}
                        >
                          계정 원복
                        </div>
                      </>
                    )}
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
          <CheckAuthModal
            open={checkAuthModalOpen}
            onCancel={() => setCheckAuthModalOpen(false)}
            onAuthenticate={handleAuthenticate}
          />
          <AdminModal
            open={adminModalOpen}
            onCancel={() => setAdminModalOpen(false)}
            onChangeAdmin={handleChangeAdmin}
          />
        </>
      )}
    </div>
  );
}
