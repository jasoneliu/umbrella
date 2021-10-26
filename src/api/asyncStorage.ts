import AsyncStorage from "@react-native-async-storage/async-storage";

interface IStoredData {
  enabled: boolean;
  time: number;
}

const storeData = async (data: IStoredData) => {
  try {
    const jsonData = JSON.stringify(data);
    await AsyncStorage.setItem("data", jsonData);
  } catch (error) {
    console.log(error);
  }
};

const getData = async () => {
  try {
    const jsonData = await AsyncStorage.getItem("data");
    const data: IStoredData | null = jsonData ? JSON.parse(jsonData) : null;
    return data;
  } catch (error) {
    console.log(error);
  }
};

export { IStoredData, storeData, getData };
