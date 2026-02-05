"use client";

import { useState } from "react";
import { Card, Flex, Button } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";
import styles from "@/styles/search.module.css";
import Sidebar from "@/app/layout/Sidebar";
import { useCallback } from "react";
import { createChatTitle } from "@/utils/searchApi";

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");
  const [searchInput, setSearchInput] = useState(
    "캐드 import 하는 방법 알려줘"
  );
  const [chatTitle, setChatTitle] = useState("");
  const createTitleHandler = useCallback(async () => {
    const title = await createChatTitle(searchInput);
    setChatTitle(title);
  }, [searchInput]);
  return (
    <div className={styles.pageRoot}>
      <Flex gap={24}>
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          chatTitle={chatTitle}
        />
        <div className={styles.pageContainer}>
          {activeTab === "learning" ? (
            <Learning
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              createTitleHandler={createTitleHandler}
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
