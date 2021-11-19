import { createSlice } from "@reduxjs/toolkit";
import { ILocation } from "../api/location";

interface IState {
  enabled: boolean;
  location: ILocation | undefined;
  time: number;
}
const initialState: IState = {
  enabled: false,
  location: undefined,
  time: new Date().setHours(9, 0), // 9 AM
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setEnabled: (state, action) => {
      state.enabled = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    setTime: (state, action) => {
      state.time = action.payload;
    },
  },
});

export const { setEnabled, setLocation, setTime } = appSlice.actions;
export default appSlice.reducer;
