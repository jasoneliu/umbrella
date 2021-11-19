import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import getRain from "./rain";
import getTime from "./time";
import { ILocation } from "./location";

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
const scheduleNewPushNotification = async (time: Date, pop: number[]) => {
  // find time period with >50% pop
  let beginIdx = -1;
  let endIdx = -1;
  for (let hourIdx = 0; hourIdx < pop.length; hourIdx++) {
    if (pop[hourIdx] >= 0.5) {
      endIdx = hourIdx;
      if (beginIdx === -1) {
        beginIdx = hourIdx;
      }
    }
  }

  // no notification needed (pop < 50%)
  if (beginIdx === -1 || endIdx === -1) {
    return;
  }

  // get beginning and end times with >50% pop
  let beginTime = new Date();
  if (beginIdx === 0) {
    beginTime.setHours(beginTime.getHours());
  } else {
    beginTime.setHours(beginTime.getHours() + beginIdx - 1);
  }
  let endTime = new Date();
  endTime.setHours(endTime.getHours() + endIdx);
  const beginTimeStr = getTime(beginTime, false);
  const endTimeStr = getTime(endTime, false);

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
      body: `Greater than 50% chance of rain from ${beginTimeStr} to ${endTimeStr}`,
    },
    trigger: trigger,
  });
};

const schedulePushNotification = async (
  enabled: boolean,
  location: ILocation | undefined,
  time: number,
  setUmbrella?: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // cancel previous notifications
  Notifications.cancelAllScheduledNotificationsAsync();

  // schedule notification
  const rain = await getRain(location);
  if (enabled && rain && rain.umbrella) {
    scheduleNewPushNotification(new Date(time), rain.pop);
  }

  // set umbrella state
  if (setUmbrella && rain) {
    setUmbrella(rain.umbrella);
  }
};

export { registerForPushNotificationsAsync, schedulePushNotification };
