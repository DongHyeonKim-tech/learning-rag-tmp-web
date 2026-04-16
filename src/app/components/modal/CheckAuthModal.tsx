import { useState } from "react";
import { Button, Flex, Input, Modal } from "antd";

type CheckAuthModalProps = {
  open: boolean;
  onCancel: () => void;
  onAuthenticate: (
    password: string,
    setPassword: (password: string) => void
  ) => void;
  loading?: boolean;
};

const CheckAuthModal = ({
  open,
  onCancel,
  onAuthenticate,
  loading = false,
}: CheckAuthModalProps) => {
  const [password, setPassword] = useState("");

  const handleCancel = () => {
    setPassword("");
    onCancel();
  };

  const handleAuthenticate = () => {
    onAuthenticate(password, setPassword);
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="인증"
      width={250}
      footer={
        <Flex
          justify="end"
          gap={10}
        >
          <Button
            onClick={handleCancel}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="primary"
            onClick={handleAuthenticate}
            loading={loading}
            disabled={!password.trim()}
          >
            인증
          </Button>
        </Flex>
      }
    >
      <Input.Password
        placeholder="비밀번호를 입력해주세요."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={handleAuthenticate}
        disabled={loading}
      />
    </Modal>
  );
};

export default CheckAuthModal;
