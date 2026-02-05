"use client";

import { useState } from "react";
import { Card, Flex, Button } from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";
import styles from "@/styles/search.module.css";

export default function Home() {
  const [activeTab, setActiveTab] = useState("learning");

  return (
    <div className={styles.pageRoot}>
      <div className={styles.pageContainer}>
        <Card className={styles.headerCard}>
          <Flex
            vertical
            gap={24}
            align="center"
          >
            <div className={styles.pageTitle}>BIM RAG</div>
            <Flex
              gap={8}
              align="center"
              wrap="wrap"
              justify="center"
            >
              <Button
                type={activeTab === "learning" ? "primary" : "default"}
                onClick={() => setActiveTab("learning")}
                className={`${styles.tabButton} ${activeTab === "learning" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Learning
              </Button>
              <Button
                type={activeTab === "framework" ? "primary" : "default"}
                onClick={() => setActiveTab("framework")}
                className={`${styles.tabButton} ${activeTab === "framework" ? styles.tabButtonActive : styles.tabButtonDefault}`}
              >
                Framework
              </Button>
            </Flex>
          </Flex>
        </Card>
        {activeTab === "learning" ? <Learning /> : <Framework />}
      </div>
    </div>
  );
}
