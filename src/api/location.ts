import * as Location from "expo-location";
import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";

interface ILocation {
  latitude: number;
  longitude: number;
  name: string;
}

const getLocation = async (): Promise<ILocation | undefined> => {
  // request background location permission if missing
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return undefined;
  }

  // TODO: Add modal explaining how background permission is used

  status = (await Location.requestBackgroundPermissionsAsync()).status;
  if (status !== "granted") {
    return undefined;
  }

  // get current location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });
  if (!location) {
    return undefined;
  }

  // get name of location (city, country)
  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?lat=" +
        location.coords.latitude.toFixed(2) +
        "&lon=" +
        location.coords.longitude.toFixed(2) +
        "&appid=" +
        OPENWEATHERMAP_API_KEY
    );
    const data = await response.json();
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      name: `${data.name}, ${data.sys.country}`,
    };
  } catch (error) {
    console.log(error);
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      name: "",
    };
  }
};

export { ILocation, getLocation };
