import { Code } from "@/app/Interface";
import {
  Modal,
  Checkbox,
  Flex,
  Input,
  Button,
  notification,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  createFeedback,
  createFeedbackReasonMaps,
  getCodesByValue,
  getFeedback,
} from "@/utils/searchApi";
import { useUserStore } from "@/utils/store";
import styles from "@/styles/feedback.module.css";

const { TextArea } = Input;

export const FeedbackModal = ({
  open,
  onCancel,
  messageId,
  feedbackId,
  updateMessageTurns,
}: {
  open: boolean;
  onCancel: () => void;
  messageId?: number | null;
  feedbackId?: number;
  updateMessageTurns?: (messageId: number, feedbackId: number) => void;
}) => {
  const { user } = useUserStore();
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [feedbackCodes, setFeedbackCodes] = useState<Code[]>([]);
  const [selectedFeedbackCodes, setSelectedFeedbackCodes] = useState<number[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (open) {
      const fetchFeedbackCodes = async () => {
        const codes = await getCodesByValue(
          messageId ? "MESSAGE_FEEDBACK" : "SYSTEM_FEEDBACK",
          messageId ? "MESSAGE_FEEDBACK" : "SYSTEM_FEEDBACK"
        );
        setFeedbackCodes(codes);
      };
      fetchFeedbackCodes();
    }
  }, [open]);

  useEffect(() => {
    if (feedbackId) {
      const fetchFeedback = async () => {
        const feedback = await getFeedback(feedbackId);
        if (feedback) {
          setFeedbackText(feedback.feedbackText);
          setSelectedFeedbackCodes(feedback.reasonCodes ?? []);
        }
      };
      fetchFeedback();
    }
  }, [feedbackId]);

  const closeFeedbackModal = () => {
    onCancel();
    setFeedbackText("");
    setSelectedFeedbackCodes([]);
    setFeedbackCodes([]);
    setLoading(false);
  };

  const onSubmit = useCallback(async () => {
    if (!user.empNo) return;
    if (selectedFeedbackCodes.length === 0) {
      notification.error({ message: "개선 필요 사항을 선택해주세요." });
      return;
    }
    if (!feedbackText.trim()) {
      notification.error({ message: "피드백을 입력해주세요." });
      return;
    }
    setLoading(true);
    try {
      const feedbackId = await createFeedback(
        user.empNo,
        messageId ? "message" : "system",
        feedbackText,
        messageId ?? undefined
      );
      updateMessageTurns?.(messageId ?? 0, feedbackId);
      if (selectedFeedbackCodes.length > 0) {
        await createFeedbackReasonMaps(feedbackId, selectedFeedbackCodes);
      }
      notification.success({ message: "의견이 반영되었습니다." });

      closeFeedbackModal();
    } catch {
      notification.error({ message: "의견 반영 중 오류가 발생했습니다." });
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedFeedbackCodes,
    feedbackText,
    messageId,
    updateMessageTurns,
    user.empNo,
  ]);

  return (
    <Modal
      open={open}
      onCancel={closeFeedbackModal}
      width={500}
      title={null}
      footer={
        <Flex
          justify="end"
          gap={10}
        >
          <Button
            onClick={closeFeedbackModal}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type={"primary"}
            onClick={onSubmit}
            disabled={
              selectedFeedbackCodes.length === 0 || !feedbackText.trim()
            }
            loading={loading}
          >
            제출
          </Button>
        </Flex>
      }
    >
      <Flex
        vertical
        gap={16}
      >
        <Flex
          vertical
          gap={20}
        >
          <div className={styles.title}>
            {`${messageId ? "답변" : "시스템"}에 개선이 필요한 부분을 선택해주세요.`}
          </div>
          <Flex
            vertical
            gap={10}
          >
            {feedbackCodes.map((code) => (
              <Checkbox
                key={code.codeId}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFeedbackCodes([
                      ...selectedFeedbackCodes,
                      code.codeId,
                    ]);
                  } else {
                    setSelectedFeedbackCodes(
                      selectedFeedbackCodes.filter((id) => id !== code.codeId)
                    );
                  }
                }}
                disabled={loading}
                checked={selectedFeedbackCodes.includes(code.codeId)}
              >
                <div className={styles.checkboxText}>{code.codeName}</div>
              </Checkbox>
            ))}
          </Flex>
        </Flex>
        <Flex
          vertical
          gap={5}
        >
          <TextArea
            placeholder="피드백을 입력해주세요."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={loading}
            className={styles.feedbackText}
            style={{ minHeight: 80 }}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};

export default FeedbackModal;
