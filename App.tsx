import React, { useState } from "react";
import { View, Text, Button, Switch, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import DateTimePicker, { Event } from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";

export default function App() {
  // disable/enable notifications
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  // pick time of notification
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  // fetch current location (latitude and longitude)
  interface Location {
    latitude: number;
    longitude: number;
  }
  const [location, setLocation] = useState<Location | null>();
  const [locationError, setLocationError] = useState(false);
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError(true);
    } else {
      const location = await Location.getLastKnownPositionAsync({});
      setLocation(
        location
          ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }
          : null
      );
      setLocationError(false);
    }
  };

  // fetch location name (city, country)
  const [locationName, setLocationName] = useState("");
  const getLocationName = async () => {
    try {
      // const response = await fetch(
      //   `api.openweathermap.org/data/2.5/weather
      //   ?lat=${location?.latitude.toFixed(2)}
      //   &lon=${location?.longitude.toFixed(2)}
      //   &appid=${OPENWEATHERMAP_API_KEY}`
      // );
      const response = await fetch(
        "https://api.openweathermap.org/data/2.5/weather?lat=" +
          location?.latitude.toFixed(2) +
          "&lon=" +
          location?.longitude.toFixed(2) +
          "&appid=" +
          OPENWEATHERMAP_API_KEY
      );
      const data = await response.json();
      setLocationName(`${data.name}, ${data.sys.country}`);
    } catch (error) {
      console.log(error);
    }
  };

  let locationText = "Waiting...";
  if (locationError) {
    locationText = "Permission to access location was denied.";
  } else if (location) {
    locationText = locationName;
    // locationText = `${location.latitude}, ${location.longitude}`;
  }

  // get current notification time
  const getTime = (time: Date) => {
    let hours = time.getHours();
    const minutes = time.getMinutes();

    // format time for 12-hour clock
    const period = hours < 12 ? "AM" : "PM";
    if (hours === 0) {
      hours = 12;
    } else if (hours > 12) {
      hours -= 12;
    }

    return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${period}`;
  };

  // get pop (probability of precipitation) for next 24 hours
  const [umbrella, setUmbrella] = useState(false);
  const getPop = async () => {
    try {
      // get 48 hour forecase
      const response = await fetch(
        "https://api.openweathermap.org/data/2.5/onecall?lat=" +
          location?.latitude.toFixed(2) +
          "&lon=" +
          location?.longitude.toFixed(2) +
          "&exclude=current,minutely,daily,alerts&appid=" +
          OPENWEATHERMAP_API_KEY
      );
      const data = await response.json();
      const list = data.hourly;

      // get probability of precipitation for next 12 hours
      const pop: number[] = [];
      for (let hourIdx = 0; hourIdx < 12; hourIdx++) {
        pop[hourIdx] = list[hourIdx].pop;
      }

      // notify umbrella if pop is high enough
      for (let hourIdx = 0; hourIdx < pop.length; hourIdx++) {
        if (pop[hourIdx] > 0.25) {
          console.log(hourIdx + " : " + pop[hourIdx]);
          setUmbrella(true);
          return;
        }
      }
      setUmbrella(false);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.text}>{isEnabled ? "Enabled" : "Disabled"}</Text>
        <Switch
          trackColor={{
            true: "hsl(210, 80%, 70%)",
            false: "hsl(210, 10%, 50%)",
          }}
          thumbColor={isEnabled ? "hsl(210, 80%, 85%)" : "hsl(210, 5%, 80%)"}
          ios_backgroundColor="hsl(210, 80%, 70%)"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>
      <View>
        <Text style={styles.text}>Time of notification: </Text>
        <Button onPress={() => setShowTimePicker(true)} title={getTime(time)} />
      </View>
      <View>
        <Text style={styles.text}>Location: {locationText}</Text>
        <Button
          onPress={() => {
            getLocation();
            getLocationName();
          }}
          title="Refresh location"
        />
      </View>
      <View>
        <Button onPress={() => getPop()} title="Get weather" />
        <Text style={styles.text}>
          {umbrella ? "Bring an umbrella!" : "No need to bring an umbrella."}
        </Text>
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
}

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
