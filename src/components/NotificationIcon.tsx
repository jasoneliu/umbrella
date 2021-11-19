import React from "react";
import { AppDispatch } from "../state/store";
import { setEnabled } from "../state/app";
import { MaterialIcons } from "@expo/vector-icons";

const NotificationIcon = ({
  enabled,
  dispatch,
}: {
  enabled: boolean;
  dispatch: AppDispatch;
}) => {
  return (
    <MaterialIcons
      name={enabled ? "notifications-active" : "notifications-off"}
      size={42}
      color="white"
      onPress={() => dispatch(setEnabled(!enabled))}
    />
  );
};

export default NotificationIcon;
