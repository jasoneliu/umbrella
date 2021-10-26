import * as Location from "expo-location";
import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";

interface ILocation {
  latitude: number;
  longitude: number;
  name: string;
}

const getLocation = async (): Promise<ILocation | undefined> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return undefined;
  }

  const lastKnownLocation = await Location.getLastKnownPositionAsync({});
  if (!lastKnownLocation) {
    return undefined;
  }

  // get name of location (city, country)
  try {
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/weather?lat=" +
        lastKnownLocation.coords.latitude.toFixed(2) +
        "&lon=" +
        lastKnownLocation.coords.longitude.toFixed(2) +
        "&appid=" +
        OPENWEATHERMAP_API_KEY
    );
    const data = await response.json();
    return {
      latitude: lastKnownLocation.coords.latitude,
      longitude: lastKnownLocation.coords.longitude,
      name: `${data.name}, ${data.sys.country}`,
    };
  } catch (error) {
    console.log(error);
    return {
      latitude: lastKnownLocation.coords.latitude,
      longitude: lastKnownLocation.coords.longitude,
      name: "",
    };
  }
};

export { ILocation, getLocation };
