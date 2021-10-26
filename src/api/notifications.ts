import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// get permission and push token for notificatons
const registerForPushNotificationsAsync = async () => {
  let token: string | undefined;

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

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert("Must use physical device for Push Notifications");
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0000FF", // hsl causes "possible unhandled promise rejection"
    });
  }

  return token;
};

// send push notification at scheduled time
const schedulePushNotification = async (time: Date) => {
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
      body: "There is a 25% of rain at 1PM",
    },
    trigger: trigger,
  });
};

export { registerForPushNotificationsAsync, schedulePushNotification };
