import React from "react";
import { registerRootComponent } from "expo";
import { Provider } from "react-redux";
import store from "./state/store";
import App from "./components/App";

const Index = () => {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
};

export default registerRootComponent(Index);
