# Umbrella Reminder

This app sends you a notification whenever you'll need an umbrella for the day.

## Features

- User chooses time of day to send notification
- Updates location and fetches rain data in background
- Displays a chart visualizing rain volume and probability

## Testing

Download the Expo Go app and scan [this QR code](https://expo.dev/@jasoneliu/umbrella) to test out my app.

Due to a [bug in Expo SDK 43](https://github.com/expo/expo/issues/14774), please use **Expo Go version 2.21.5** to allow background location access.  
This app is currently tested on **Android only**.

## Technologies

- React Native
- Expo
- Redux / Redux Toolkit
- Victory (charting)
- OpenWeatherMap API
