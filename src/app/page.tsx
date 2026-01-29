"use client";

import { useState } from "react";
import {
  Button,
  Flex,
  Typography,
} from "antd";
import Learning from "@/app/components/Learning";
import Framework from "@/app/components/Framework";

const { Title } = Typography;

export default function Home() {
 
  const [activeTab, setActiveTab] = useState("learning");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* 헤더 */}
        <Flex vertical gap={24} align="center" justify="center">
          <Title level={1} style={{ color: "white", margin: 0 }}>
            BIM RAG
          </Title>
          <Flex
            gap={8}
            align="center"
            justify="center"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
              padding: "6px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Button
              type={activeTab === "learning" ? "primary" : "default"}
              onClick={() => setActiveTab("learning")}
              style={{
                minWidth: "120px",
                height: "40px",
                borderRadius: "8px",
                fontWeight: 500,
                transition: "all 0.3s ease",
                ...(activeTab === "learning"
                  ? {
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#667eea",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }
                  : {
                      background: "transparent",
                      color: "white",
                      border: "none",
                    }),
              }}
            >
              Learning
            </Button>
            <Button
              type={activeTab === "framework" ? "primary" : "default"}
              onClick={() => setActiveTab("framework")}
              style={{
                minWidth: "120px",
                height: "40px",
                borderRadius: "8px",
                fontWeight: 500,
                transition: "all 0.3s ease",
                ...(activeTab === "framework"
                  ? {
                      background: "rgba(255, 255, 255, 0.95)",
                      color: "#667eea",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    }
                  : {
                      background: "transparent",
                      color: "white",
                      border: "none",
                    }),
              }}
            >
              Framework
            </Button>
          </Flex>
        </Flex>
        {activeTab === "learning" ? <Learning /> : <Framework />}
      </div>
    </div>
  );
}
