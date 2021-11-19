import { createSlice } from "@reduxjs/toolkit";
import { ILocation } from "../api/location";

interface IState {
  enabled: boolean;
  time: number;
  location: ILocation | undefined;
}
const initialState: IState = {
  enabled: false,
  time: Date.now(),
  location: undefined,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setEnabled: (state, action) => {
      state.enabled = action.payload;
    },
    setTime: (state, action) => {
      state.time = action.payload;
    },
    setLocation: (state, action) => {
      state.location = action.payload;
    },
  },
});
export const { setEnabled, setTime, setLocation } = appSlice.actions;
export default appSlice.reducer;
