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
} from "@/utils/searchApi";

const { TextArea } = Input;

export const FeedbackModal = ({
  open,
  onCancel,
  messageId,
  updateMessageTurns,
}: {
  open: boolean;
  onCancel: () => void;
  messageId?: number | null;
  updateMessageTurns: (messageId: number, feedbackId: number) => void;
}) => {
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
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

  const closeFeedbackModal = () => {
    onCancel();
    setFeedbackText("");
    setRating(0);
    setSelectedFeedbackCodes([]);
    setFeedbackCodes([]);
    setLoading(false);
  };

  const onSubmit = useCallback(async () => {
    console.log("submit");
    if (selectedFeedbackCodes.length === 0 && !feedbackText.trim()) {
      notification.error({ message: "의견을 선택 또는 입력해주세요." });
      return;
    }
    setLoading(true);
    try {
      const feedbackId = await createFeedback(
        "20230808",
        messageId ? "message" : "system",
        feedbackText,
        messageId ?? undefined
      );
      updateMessageTurns(messageId ?? 0, feedbackId);
      await createFeedbackReasonMaps(feedbackId, selectedFeedbackCodes);
      notification.success({ message: "피드백 제출 완료" });
      closeFeedbackModal();
    } catch {
      notification.error({ message: "피드백 제출 실패" });
    } finally {
      setLoading(false);
    }
  }, [selectedFeedbackCodes, feedbackText, messageId, rating]);

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
