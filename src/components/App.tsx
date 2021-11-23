import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";

import Chart from "./Chart";
import PermissionModal from "./PermissionModal";
import ClockIcon from "./icons/ClockIcon";
import MapIcon from "./icons/MapIcon";
import NotificationIcon from "./icons/NotificationIcon";
import RefreshIcon from "./icons/RefreshIcon";

import { useDispatch, useSelector } from "react-redux";
import store, { RootState, AppDispatch } from "../state/store";
import { setEnabled, setLocation, setTime } from "../state/app";

import { IStoredData, storeData, getData } from "../api/asyncStorage";
import {
  ILocation,
  getLocation,
  getLocationPermissions,
} from "../api/location";
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
    const fetchedLocation = await getLocation();
    const newLocation: ILocation = {
      latitude: latitude,
      longitude: longitude,
      name: fetchedLocation
        ? fetchedLocation.name
        : "Unable to get location name.",
    };
    store.dispatch(setLocation(newLocation));

    // schedule notification
    const { enabled, time } = store.getState().app;
    schedulePushNotification(enabled, newLocation, time);
  }
});

const App = () => {
  const dispatch = useDispatch<AppDispatch>();

  // disable/enable notifications
  const enabled = useSelector((state: RootState) => state.app.enabled);
  const toggleEnabled = () => {
    schedulePushNotification(!enabled, location, time, setRain);
    dispatch(setEnabled(!enabled)); // toggle
  };

  // pick time of notification
  const time = useSelector((state: RootState) => state.app.time);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  // current location (latitude, longitude, name)
  const location = useSelector((state: RootState) => state.app.location);
  let locationText = "Waiting for location...";
  if (location) {
    locationText = location.name;
  }
  const refreshLocation = async (showModalFull: boolean) => {
    const permissions = await getLocationPermissions(
      setModalSettingsFull,
      setModalVisible,
      showModalFull
    );
    if (permissions) {
      const location = await getLocation();
      location && dispatch(setLocation(location));
    }
  };

  // rain data (probability of precipitation, rain volume, umbrella)
  const [rain, setRain] = useState<IRain | undefined>(undefined);

  // show permission modal
  const [modalSettingsFull, setModalSettingsFull] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // app state becomes inactive when user is sent to the settings menu
  const inSettings = useRef(false);
  const [appState, setAppState] = useState(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

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
      await refreshLocation(false);

      // register for push notifications
      await registerForPushNotificationsAsync();

      // get location in background
      if (data?.enabled) {
        await startLocationUpdatesAsync();
      }

      // schedule notifications
      if (data) {
        await schedulePushNotification(
          data.enabled,
          location,
          data.time,
          setRain
        );
      }

      // keep splash screen visible until app is ready to render
      await SplashScreen.preventAutoHideAsync();
      setAppIsReady(true);
    })();
  }, []);

  // update stored data on change, start/stop background location updates
  useEffect(() => {
    // store data
    const data: IStoredData = { enabled: enabled, time: time };
    storeData(data);

    // start/stop background location updates
    if (appIsReady) {
      (async () => {
        if (enabled) {
          startLocationUpdatesAsync();
        } else {
          const started = await Location.hasStartedLocationUpdatesAsync(
            LOCATION_TASK
          );
          started && Location.stopLocationUpdatesAsync(LOCATION_TASK);
        }
      })();
      schedulePushNotification(enabled, location, time, setRain);
    }
  }, [enabled, time]);

  // schedule notification and reload chart on location change
  useEffect(() => {
    schedulePushNotification(enabled, location, time, setRain);
  }, [location]);

  // request background location after user closes modal
  useEffect(() => {
    // modal closed, and not on startup
    if (!modalVisible && appIsReady) {
      if (modalSettingsFull) {
        // open full settings menu
        inSettings.current = true;
        Linking.openSettings();
      } else {
        // open location settings menu (to request background location)
        refreshLocation(true);
      }
    }
  }, [modalVisible]);

  // when user returns from full settings menu, refresh location
  useEffect(() => {
    if (inSettings.current && appState === "active") {
      inSettings.current = false;
      refreshLocation(true);
    }
  }, [appState]);

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
      <View style={{ paddingBottom: 3 }}>
        <NotificationIcon enabled={enabled} toggle={toggleEnabled} />
      </View>

      <TouchableOpacity
        style={styles.row}
        onPress={() => setTimePickerVisible(true)}
      >
        <ClockIcon />
        <Text style={[styles.text, { paddingLeft: 7 }]}>
          {getTime(new Date(time), true)}
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <MapIcon />
        <Text style={[styles.text, { paddingHorizontal: 5 }]}>
          {locationText}
        </Text>
        <RefreshIcon refresh={() => refreshLocation(true)} />
      </View>

      <View style={{ height: "10%" }} />

      <View>
        <Text style={styles.text}>
          {rain
            ? rain.umbrella
              ? "Bring an umbrella today!"
              : "No umbrella needed today."
            : "Sorry, couldn't get a rain forecast."}
        </Text>
      </View>

      <Chart
        pop={rain ? rain.pop : Array(12).fill(0)}
        rain={rain ? rain.rain : Array(12).fill(0)}
      />

      <DateTimePickerModal
        mode="time"
        date={new Date(time)}
        isVisible={timePickerVisible}
        onConfirm={(date) => {
          setTimePickerVisible(false);
          dispatch(setTime(date.getTime()));
        }}
        onCancel={() => setTimePickerVisible(false)}
      />

      <PermissionModal
        settingsFull={modalSettingsFull}
        visible={modalVisible}
        setVisible={setModalVisible}
      />

      <StatusBar style="light" translucent={true} />
    </View>
  );
};

// styles for app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "hsl(210, 10%, 15%)",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    color: "white",
  },
});

export default App;
