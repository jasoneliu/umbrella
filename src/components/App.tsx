import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";

import Chart from "./Chart";
import ClockIcon from "./icons/ClockIcon";
import MapIcon from "./icons/MapIcon";
import NotificationIcon from "./icons/NotificationIcon";
import RefreshIcon from "./icons/RefreshIcon";

import { useDispatch, useSelector } from "react-redux";
import store, { RootState, AppDispatch } from "../state/store";
import { setEnabled, setLocation, setTime } from "../state/app";

import { IStoredData, storeData, getData } from "../api/asyncStorage";
import { ILocation, getLocation } from "../api/location";
import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
} from "../api/notifications";
import { IRain } from "../api/rain";
import getTime from "../api/time";

const LOCATION_TASK = "background-location-task";

// gets location in background
const startLocationUpdatesAsync = async () => {
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Low, // accurate to the nearest kilometer
    timeInterval: 1000 * 60 * 10, // update every 10 minutes
    distanceInterval: 1000, // update when position changes by more than a kilometer
    showsBackgroundLocationIndicator: false,
  });
};

// schedules notification on background location change
TaskManager.defineTask(LOCATION_TASK, ({ data, error }) => {
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
  const refreshLocation = async () => {
    const location = await getLocation();
    dispatch(setLocation(location));
  };

  // disable/enable notifications
  const enabled = useSelector((state: RootState) => state.app.enabled);
  const toggleEnabled = () => {
    dispatch(setEnabled(!enabled)); // toggle
    schedulePushNotification(enabled, location, time, setRain);
  };

  // pick time of notification
  const time = useSelector((state: RootState) => state.app.time);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // rain data (probability of precipitation, rain volume, umbrella)
  const [rain, setRain] = useState<IRain | undefined>(undefined);

  // app is ready after initialization, used to hide splash screen
  const [appIsReady, setAppIsReady] = useState(false);

  // initialize app on startup
  useEffect(() => {
    (async () => {
      // load stored data (app enabled, time of notification)
      const data = await getData();
      if (data) {
        dispatch(setEnabled(data.enabled));
        dispatch(setTime(data.time));
      }

      // get location permissions and set location
      const location = await getLocation();
      dispatch(setLocation(location));

      // get location in background
      // TODO: fix unhandled promise rejection
      // await startLocationUpdatesAsync();

      // register for push notifications
      await registerForPushNotificationsAsync();

      // schedule notifications
      await schedulePushNotification(enabled, location, time, setRain);

      // keep splash screen visible until app is ready to render
      await SplashScreen.preventAutoHideAsync();
      setAppIsReady(true);
    })();
  }, []);

  // update stored data on change, schedule notification
  useEffect(() => {
    const data: IStoredData = { enabled: enabled, time: time };
    storeData(data);
    schedulePushNotification(enabled, location, time, setRain);
  }, [enabled, time]);

  // hide the splash screen once the root view has performed layout
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <NotificationIcon enabled={enabled} toggle={toggleEnabled} />
      <TouchableOpacity
        style={styles.row}
        onPress={() => setShowTimePicker(true)}
      >
        <ClockIcon />
        <Text style={styles.text}>{getTime(new Date(time), true)}</Text>
      </TouchableOpacity>
      <View style={styles.row}>
        <MapIcon />
        <Text style={styles.text}>{locationText}</Text>
        <RefreshIcon refresh={refreshLocation} />
      </View>
      <View>
        <Text style={styles.text}>
          {rain
            ? rain.umbrella
              ? "Bring an umbrella today!"
              : "No umbrella needed today."
            : "Sorry, couldn't get a rain forecast."}
        </Text>
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
      {/* <Chart data={rain ? rain.rain : Array(12).fill(0)} /> */}
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
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    color: "hsl(0, 0%, 100%)",
  },
});

export default App;
