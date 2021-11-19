import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// get permission and push token for notificatons
const registerForPushNotificationsAsync = async () => {
  // push notification settings
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Constants.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "blue",
    });
  }
};

// send push notification at scheduled time
const schedulePushNotification = async (time: Date, pop: number[]) => {
  // find time period with >50% pop
  let begin = -1;
  let end = -1;
  for (let hourIdx = 0; hourIdx < pop.length; hourIdx++) {
    if (pop[hourIdx] >= 0.5) {
      end = hourIdx;
      if (begin == -1) {
        begin = hourIdx;
      }
    }
  }

  // set trigger to current time
  const trigger = new Date();

  // set trigger to next day if current time is past notification time
  if (
    trigger.getHours() > time.getHours() ||
    (trigger.getHours() === time.getHours() &&
      trigger.getMinutes() >= time.getMinutes())
  ) {
    trigger.setDate(trigger.getDate() + 1);
  }

  // set trigger time (hours and minutes)
  trigger.setHours(time.getHours());
  trigger.setMinutes(time.getMinutes());
  trigger.setSeconds(0);

  // schedule notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Bring an umbrella today! ☂️️",
      body: "Greater than 50% rain from ",
    },
    trigger: trigger,
  });
};

export { registerForPushNotificationsAsync, schedulePushNotification };
