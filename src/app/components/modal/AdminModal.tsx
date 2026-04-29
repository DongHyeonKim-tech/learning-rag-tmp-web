import { useEffect, useState } from "react";
import { Flex, Modal, Input } from "antd";
import { getAdminUserList } from "@/utils/searchApi";
import { AdminUserList } from "@/app/Interface";
import { useAdminStore } from "@/utils/store";
import styles from "@/styles/admin.module.css";

type AdminModalProps = {
  open: boolean;
  onCancel: () => void;
  onChangeAdmin: (empNo: string) => void;
};

const AdminModal = ({ open, onCancel, onChangeAdmin }: AdminModalProps) => {
  const { admin } = useAdminStore();
  const [adminUserList, setAdminUserList] = useState<AdminUserList[]>([]);
  const [searchUserNm, setSearchUserNm] = useState<string>("");
  const handleCancel = () => {
    onCancel();
  };

  useEffect(() => {
    if (open) {
      const fetchAdminUserList = async () => {
        const adminUserList = await getAdminUserList(admin?.empNo ?? "");
        setAdminUserList(adminUserList ?? []);
      };
      fetchAdminUserList();
    }
  }, [admin?.empNo, open]);

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title="관리자 변경"
      width={250}
      footer={null}
    >
      <Flex
        vertical
        gap={10}
      >
        <Flex>
          <Input
            value={searchUserNm}
            onChange={(e) => setSearchUserNm(e.target.value)}
            placeholder="사번을 입력해주세요."
          />
        </Flex>
        <Flex
          vertical
          gap={2}
          className={styles.adminListContainer}
        >
          {adminUserList
            .filter(
              (adminUser) =>
                adminUser.userNm.includes(searchUserNm) ||
                adminUser.empNo.includes(searchUserNm)
            )
            .map((adminUser) => (
              <div
                key={adminUser.empNo}
                className={styles.adminItem}
                onClick={() => {
                  onChangeAdmin(adminUser.empNo);
                }}
              >{`${adminUser.userNm} (${adminUser.empNo})`}</div>
            ))}
        </Flex>
      </Flex>
    </Modal>
  );
};

export default AdminModal;
