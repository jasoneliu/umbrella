import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";
import { ILocation } from "./location";

const getPop = async (location: ILocation | undefined) => {
  if (!location) {
    return undefined;
  }

  try {
    // get 48 hour forecast
    const response = await fetch(
      "https://api.openweathermap.org/data/2.5/onecall?lat=" +
        location.latitude.toFixed(2) +
        "&lon=" +
        location.longitude.toFixed(2) +
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
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export default getPop;
