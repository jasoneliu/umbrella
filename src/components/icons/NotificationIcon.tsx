import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

const NotificationIcon = ({
  enabled,
  toggle,
}: {
  enabled: boolean;
  toggle: () => void;
}) => {
  return (
    <MaterialIcons
      name={enabled ? "notifications-active" : "notifications-off"}
      size={42}
      color="white"
      onPress={toggle}
    />
  );
};

export default NotificationIcon;
