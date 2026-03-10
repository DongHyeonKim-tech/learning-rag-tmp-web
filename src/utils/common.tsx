import type { NotificationPlacement } from "antd/es/notification/interface";
import { notification } from "antd";

type NotificationType = "success" | "info" | "warning" | "error";
export const openNotification = (
  type: NotificationType = "info",
  message: string,
  description?: string,
  placement: NotificationPlacement = "topRight",
  style = {},
  duration: number = 2.5
) => {
  //   const [api] = notification.useNotification();

  //   return api.info({
  return notification[type]({
    message: <span style={{ fontFamily: "Pretendard" }}>{message}</span>,
    description: (
      <span style={{ fontFamily: "Pretendard" }}>{description}</span>
    ),
    placement: placement,
    duration: duration,
    style: { whiteSpace: "pre-line", ...style },
  });
};
