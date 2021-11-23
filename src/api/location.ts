import * as Location from "expo-location";
import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";

interface ILocation {
  latitude: number;
  longitude: number;
  name: string;
}

const getLocation = async (
  setModalVisible?: React.Dispatch<React.SetStateAction<boolean | undefined>>
): Promise<ILocation | undefined> => {
  // request foreground location permission if missing
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return undefined;
  }

  // show modal explaining background location usage
  status = (await Location.getBackgroundPermissionsAsync()).status;
  if (status !== "granted" && setModalVisible !== undefined) {
    setModalVisible(true);
    return undefined;
  }

  // request background location permission if missing
  status = (await Location.requestBackgroundPermissionsAsync()).status;
  if (status !== "granted") {
    return undefined;
  }

  // get current location
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low, // accurate to the nearest kilometer
  });
  if (!location) {
    return undefined;
  }

  // get name of location
  try {
    const response = await fetch(
      "https://api.openweathermap.org/geo/1.0/reverse?lat=" +
        location.coords.latitude.toFixed(2) +
        "&lon=" +
        location.coords.longitude.toFixed(2) +
        "&limit=1" +
        "&appid=" +
        OPENWEATHERMAP_API_KEY
    );

    // combine city, state (where availiable), and country
    const data = await response.json();
    let name = `${data[0].name}, `;
    const state = data[0].state;
    if (state) {
      name += `${state}, `;
    }
    name += data[0].country;

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      name: name,
    };
  } catch (error) {
    console.log(error);
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      name: "Unable to get location name.",
    };
  }
};

export { ILocation, getLocation };
