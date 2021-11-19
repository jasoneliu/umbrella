import React, { useState, useEffect } from "react";
import { View, Text, Button, Switch, StyleSheet } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import Chart from "./Chart";

import { useDispatch, useSelector } from "react-redux";
import store, { RootState, AppDispatch } from "../state/store";
import { setEnabled, setLocation, setTime } from "../state/app";

import { IStoredData, storeData, getData } from "../api/asyncStorage";
import { ILocation, getLocation } from "../api/location";
import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
} from "../api/notifications";
import getTime from "../api/time";

const LOCATION_TASK = "background-location-task";

// gets location in background
const startLocationUpdatesAsync = async () => {
  Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Low, // accurate to the nearest kilometer
    timeInterval: 1000 * 15, // update every 10 minutes
    distanceInterval: 1000, // update when position changes by more than a kilometer
    showsBackgroundLocationIndicator: false,
  });
};

// schedules notification on background location change
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.log(error);
    return;
  }

  if (data) {
    // @ts-ignore (expo doesn't provide a way to type the data object)
    // get and store most recent location
    const { locations }: { locations: Location.LocationObject[] } = data;
    const { latitude, longitude } = locations[0].coords;
    const newLocation: ILocation = {
      latitude: latitude,
      longitude: longitude,
      name: "",
    };
    store.dispatch(setLocation(newLocation));

    // schedule notification
    const { enabled, time } = store.getState().app;
    console.log("before push");
    schedulePushNotification(enabled, newLocation, time);
  }
});

const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  // current location (latitude, longitude, name)
  const location = useSelector((state: RootState) => state.app.location);
  let locationText = "Waiting for location...";
  if (location) {
    locationText = location.name;
  }
  const [locationUpdates, setLocationUpdates] = useState(false);

  // disable/enable notifications
  const enabled = useSelector((state: RootState) => state.app.enabled);
  const toggleSwitch = async () => {
    dispatch(setEnabled(!enabled)); // toggle
    schedulePushNotification(enabled, location, time, setUmbrella);
  };

  // pick time of notification
  const time = useSelector((state: RootState) => state.app.time);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // whether an umbrella is needed for the day
  const [umbrella, setUmbrella] = useState<boolean>(false);

  // initialize app on startup
  useEffect(() => {
    // load stored data (app enabled, time of notification)
    (async () => {
      const data = await getData();
      if (data) {
        dispatch(setEnabled(data.enabled));
        dispatch(setTime(data.time));
      }
    })();

    // request background location permission if missing
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return undefined;
      }
      // TODO: Add modal explaining how background permission is used
      status = (await Location.requestBackgroundPermissionsAsync()).status;
      if (status !== "granted") {
        return undefined;
      }
    })();

    // set location
    (async () => {
      const location = await getLocation();
      dispatch(setLocation(location));
    })();

    // register for push notifications
    registerForPushNotificationsAsync();

    // schedule notifications
    schedulePushNotification(enabled, location, time, setUmbrella);
  }, []);

  // update stored data on change, schedule notification
  useEffect(() => {
    const data: IStoredData = { enabled: enabled, time: time };
    storeData(data);
    schedulePushNotification(enabled, location, time, setUmbrella);
  }, [enabled, time]);

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
        <Button
          onPress={() => setShowTimePicker(true)}
          title={getTime(new Date(time), true)}
        />
      </View>
      <View>
        <Text style={styles.text}>Location: {locationText}</Text>
        <Button
          onPress={async () => {
            const location = await getLocation();
            dispatch(setLocation(location));
          }}
          title="Refresh location"
        />
      </View>
      <View>
        <Text style={styles.text}>
          {umbrella ? "Bring an umbrella!" : "No need to bring an umbrella."}
        </Text>
      </View>
      <View>
        <Button
          title="Press to schedule a notification"
          onPress={async () => {
            schedulePushNotification(enabled, location, time, setUmbrella);
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
          date={new Date(time)}
          isVisible={showTimePicker}
          onConfirm={(date) => {
            setShowTimePicker(false);
            dispatch(setTime(date.getTime()));
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

export default App;
