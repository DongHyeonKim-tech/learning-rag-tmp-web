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
          "FEEDBACK_REASON",
          "FEEDBACK_REASON"
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
    console.log("submit");
    if (!user.empNo) return;
    if (selectedFeedbackCodes.length === 0 && !feedbackText.trim()) {
      notification.error({ message: "의견을 선택 또는 입력해주세요." });
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
      updateMessageTurns && updateMessageTurns(messageId ?? 0, feedbackId);
      if (selectedFeedbackCodes.length > 0) {
        await createFeedbackReasonMaps(feedbackId, selectedFeedbackCodes);
      }
      notification.success({ message: "피드백 제출 완료" });
      closeFeedbackModal();
    } catch {
      notification.error({ message: "피드백 제출 실패" });
    } finally {
      setLoading(false);
    }
  }, [selectedFeedbackCodes, feedbackText, messageId]);

  return (
    <Modal
      open={open}
      onCancel={closeFeedbackModal}
      width={360}
      title={null}
      footer={
        <Flex
          justify="end"
          gap={10}
        >
          <Button
            onClick={onCancel}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type={"primary"}
            onClick={onSubmit}
            disabled={
              selectedFeedbackCodes.length === 0 && !feedbackText.trim()
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
          gap={5}
        >
          <Typography.Title level={5}>
            답변에 개선이 필요한 부분을 선택해주세요.
          </Typography.Title>
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
              {code.codeName}
            </Checkbox>
          ))}
        </Flex>
        <Flex
          vertical
          gap={5}
        >
          <Typography.Title level={5}>
            기타 의견을 입력해주세요.
          </Typography.Title>
          <TextArea
            placeholder="피드백을 입력해주세요."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={loading}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};

export default FeedbackModal;
