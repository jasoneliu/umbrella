import React, { useState, useRef, useEffect } from "react";
import { View, Text, Button, Switch, StyleSheet } from "react-native";
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Notifications from "expo-notifications";
// import { Subscription } from "expo-modules-core"; // expo 43, background location bug
// https://github.com/expo/expo/issues/14774
import { Subscription } from "@unimodules/core"; // expo 42
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import { IStoredData, storeData, getData } from "./api/asyncStorage";
import { ILocation, getLocation } from "./api/location";
import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
} from "./api/notifications";
import getPop from "./api/rain";
import getTime from "./api/time";

const LOCATION_TASK = "background-location-task";

TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.log(error);
    return;
  }

  if (data) {
    // @ts-ignore (expo doesn't provide a way to type the data object)
    const { locations }: { locations: Location.LocationObject[] } = data;
    const { latitude, longitude } = locations[0].coords;
    // cancelAllScheduledNotificationsAsync()
  }
});

const startLocationUpdatesAsync = async () => {
  Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Low, // accurate to the nearest kilometer
    timeInterval: 1000 * 60 * 5, // update every 5 minutes
    distanceInterval: 1000, // kilometer
    showsBackgroundLocationIndicator: false,
  });
};

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

  const [locationUpdates, setLocationUpdates] = useState(false);

  // whether an umbrella is needed for the day
  const [umbrella, setUmbrella] = useState<boolean | undefined>(false);

  // initialize app on startup
  useEffect(() => {
    // load stored data (app enabled, time of notification)
    (async () => {
      const data = await getData();
      if (data) {
        setEnabled(data.enabled);
        setTime(new Date(data.time));
      }
    })();

    // set location
    (async () => {
      const location = await getLocation();
      setLocation(location);
    })();
  }, []);

  // update stored data on change
  useEffect(() => {
    const data: IStoredData = { enabled: enabled, time: time.getTime() };
    storeData(data);
  }, [enabled, time]);

  // notifications
  const [notification, setNotification] =
    useState<Notifications.Notification>();
  const notificationListener = useRef<Subscription>();

  useEffect(() => {
    (async () => {
      await registerForPushNotificationsAsync();
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });
    })();
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
          ios_backgroundColor="hsl(210, 10%, 50%)"
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
      <View>
        <Button
          title={"Location updates: " + (locationUpdates ? "On" : "Off")}
          onPress={async () => {
            const locationUpdates =
              await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
            if (locationUpdates) {
              Location.stopLocationUpdatesAsync(LOCATION_TASK);
            } else {
              startLocationUpdatesAsync();
            }
            setLocationUpdates(!locationUpdates);
          }}
        />
      </View>
      {showTimePicker && (
        <DateTimePickerModal
          mode="time"
          date={time}
          isVisible={showTimePicker}
          onConfirm={(date) => {
            setShowTimePicker(false);
            setTime(date);
          }}
          onCancel={() => setShowTimePicker(false)}
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
