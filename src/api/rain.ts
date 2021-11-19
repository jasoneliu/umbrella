import { OPENWEATHERMAP_API_KEY } from "react-native-dotenv";
import { ILocation } from "./location";

// hourly forecast weather data from OpenWeather's one call API
// https://openweathermap.org/api/one-call-api
interface IWeather {
  clouds: number;
  dew_point: number;
  dt: number;
  feels_Like: number;
  humidity: number;
  pop: number;
  pressure: number;
  rain?: { "1h": number };
  snow?: { "1h": number };
  temp: number;
  uvi: number;
  visibility: number;
  weather: Array<{
    description: string;
    icon: string;
    id: number;
    main: string;
  }>;
  wind_deg: number;
  wind_gust: number;
  wind_speed: number;
}

// get probability of precipitation and rain volume for the next 12 hours
const getRain = async (location: ILocation | undefined) => {
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
    const list: IWeather[] = data.hourly;

    // get rain info for next 12 hours
    const pop: number[] = []; // probability of precipitation, [0, 1]
    const rain: number[] = []; // rain volume for last hour, inches
    for (let hourIdx = 0; hourIdx < 12; hourIdx++) {
      pop[hourIdx] = list[hourIdx].pop;
      const hourRain = list[hourIdx].rain;
      if (hourRain) {
        rain[hourIdx] = hourRain["1h"] / 25.4; // convert mm to in
      } else {
        rain[hourIdx] = 0;
      }
    }
    return { pop: pop, rain: rain };
  } catch (error) {
    console.log(error);
    return undefined;
  }
};

export default getRain;
