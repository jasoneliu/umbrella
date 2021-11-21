import React, { useState, useRef } from "react";
import { Animated, Easing, View, Button } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// refresh location
const RefreshIcon = ({ refresh }: { refresh: () => Promise<void> }) => {
  const [rotation, setRotation] = useState(new Animated.Value(0));
  const animationRunning = useRef(false);

  // run rotating animation
  const runAnimation = () => {
    Animated.timing(rotation, {
      toValue: 1,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      console.log(animationRunning.current, finished);
      rotation.setValue(0); // returns to 0deg
      // keep running animation
      if (animationRunning.current) {
        runAnimation();
      }
    });
  };

  // interpolate beginning and end values of animation
  const rotateAnimation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotateAnimation }] }}>
      <MaterialIcons
        name="refresh"
        size={36}
        color={"white"}
        onPress={async () => {
          // do nothing if animation already running
          if (animationRunning.current) {
            return;
          }

          // run animation until location is fetched
          animationRunning.current = true;
          runAnimation();
          await refresh();
          animationRunning.current = false;
        }}
      />
    </Animated.View>
  );
};

export default RefreshIcon;
