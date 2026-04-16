import { useState } from "react";
import { Button, Flex, Input, Modal } from "antd";

type AdminModalProps = {
  open: boolean;
  onCancel: () => void;
  onChangeAdmin: (empNo: string, setEmpNo: (empNo: string) => void) => void;
  loading?: boolean;
};

const AdminModal = ({
  open,
  onCancel,
  onChangeAdmin,
  loading = false,
}: AdminModalProps) => {
  const [empNo, setEmpNo] = useState("");

  const handleCancel = () => {
    setEmpNo("");
    onCancel();
  };

  const handleChangeAdmin = () => {
    onChangeAdmin(empNo, setEmpNo);
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="관리자 변경"
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
            onClick={handleChangeAdmin}
            loading={loading}
            disabled={!empNo.trim()}
          >
            변경
          </Button>
        </Flex>
      }
    >
      <Input
        placeholder="사번을 입력해주세요."
        value={empNo}
        onChange={(e) => setEmpNo(e.target.value)}
        onPressEnter={handleChangeAdmin}
        disabled={loading}
      />
    </Modal>
  );
};

export default AdminModal;
