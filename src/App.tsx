import React, { useState, useRef, useEffect } from "react";
import { View, Text, Button, Switch, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import DateTimePicker, { Event } from "@react-native-community/datetimepicker";
import * as Notifications from "expo-notifications";
import { Subscription } from "expo-modules-core";
import { registerRootComponent } from "expo";
import { IStoredData, storeData, getData } from "./api/asyncStorage";
import { ILocation, getLocation } from "./api/location";
import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
} from "./api/notifications";
import getPop from "./api/rain";
import getTime from "./api/time";

// push notification settings
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const App = () => {
  // disable/enable notifications
  const [enabled, setEnabled] = useState(false);
  const toggleSwitch = () => setEnabled((previousState) => !previousState);

  // pick time of notification
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // current location (latitude, longitude, name)
  const [location, setLocation] = useState<ILocation | undefined>(undefined);
  let locationText = "Waiting...";
  if (location) {
    locationText = location.name;
  }

  // get pop (probability of precipitation) for next 24 hours
  const [umbrella, setUmbrella] = useState<boolean | undefined>(false);

  // load stored data (app enabled, time of notification) on startup
  useEffect(() => {
    (async () => {
      const data = await getData();
      if (data) {
        setEnabled(data.enabled);
        setTime(new Date(data.time));
      }
    })();
  }, []);

  // update stored data on change
  useEffect(() => {
    const data: IStoredData = { enabled: enabled, time: time.getTime() };
    storeData(data);
  }, [enabled, time]);

  // set location on startup
  useEffect(() => {
    (async () => {
      const location = await getLocation();
      setLocation(location);
    })();
  }, []);

  // notifications
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const subscriptionInit: Subscription = { remove: () => {} };
  const notificationListener = useRef<Subscription>(subscriptionInit);
  const responseListener = useRef<Subscription>(subscriptionInit);

  useEffect(() => {
    async () => {
      const token = await registerForPushNotificationsAsync();
      token && setExpoPushToken(token);
    };

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>{enabled ? "Enabled" : "Disabled"}</Text>
        <Switch
          trackColor={{
            true: "hsl(210, 80%, 70%)",
            false: "hsl(210, 10%, 50%)",
          }}
          thumbColor={enabled ? "hsl(210, 80%, 85%)" : "hsl(210, 5%, 80%)"}
          ios_backgroundColor="hsl(210, 80%, 70%)"
          onValueChange={toggleSwitch}
          value={enabled}
        />
      </View>
      <View>
        <Text style={styles.text}>Time of notification: </Text>
        <Button onPress={() => setShowTimePicker(true)} title={getTime(time)} />
      </View>
      <View>
        <Text style={styles.text}>Location: {locationText}</Text>
        <Button
          onPress={async () => {
            const location = await getLocation();
            setLocation(location);
          }}
          title="Refresh location"
        />
      </View>
      <View>
        <Button
          onPress={async () => {
            const pop = await getPop(location);
            setUmbrella(pop);
          }}
          title="Get weather"
        />
        <Text style={styles.text}>
          {umbrella ? "Bring an umbrella!" : "No need to bring an umbrella."}
        </Text>
      </View>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text style={styles.text}>
          Title: {notification && notification.request.content.title}{" "}
        </Text>
        <Text style={styles.text}>
          Body: {notification && notification.request.content.body}
        </Text>
      </View>
      <View>
        <Button
          title="Press to schedule a notification"
          onPress={async () => {
            await schedulePushNotification(time);
          }}
        />
      </View>
      {showTimePicker && (
        <DateTimePicker
          mode="time"
          display="default"
          value={time}
          onChange={(event: Event, date?: Date) => {
            setShowTimePicker(false); // hide time picker
            setTime(date || time); // change time or cancel
          }}
        />
      )}
      <StatusBar style="light" translucent={true} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "hsl(210, 10%, 15%)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    color: "hsl(0, 0%, 100%)",
  },
});

export default registerRootComponent(App);
