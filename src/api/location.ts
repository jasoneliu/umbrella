import * as Location from "expo-location";
import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";

interface ILocation {
  latitude: number;
  longitude: number;
  name: string;
}

const getLocationPermissions = async (
  setModalSettingsFull: React.Dispatch<React.SetStateAction<boolean>>,
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  showModalFull: boolean
) => {
  // request foreground location permission if missing
  // show modal explaining location usaged if denied
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    setModalSettingsFull(true);
    setModalVisible(true);
    return false;
  }

  // show modal explaining background location usage
  status = (await Location.getBackgroundPermissionsAsync()).status;
  if (status !== "granted" && !showModalFull) {
    setModalSettingsFull(false);
    setModalVisible(true);
    return false;
  }

  // request background location permission if missing
  status = (await Location.requestBackgroundPermissionsAsync()).status;
  if (status !== "granted") {
    setModalSettingsFull(true);
    setModalVisible(true);
    return false;
  }

  return true;
};

const getLocation = async (): Promise<ILocation | undefined> => {
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
        location.coords.latitude.toFixed(4) +
        "&lon=" +
        location.coords.longitude.toFixed(4) +
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

export { ILocation, getLocation, getLocationPermissions };
