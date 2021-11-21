import React from "react";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const NotificationIcon = ({
  enabled,
  toggle,
}: {
  enabled: boolean;
  toggle: () => void;
}) => {
  return (
    <TouchableOpacity onPress={toggle}>
      <MaterialIcons
        name={enabled ? "notifications-active" : "notifications-off"}
        size={42}
        color="white"
      />
    </TouchableOpacity>
  );
};

export default NotificationIcon;
