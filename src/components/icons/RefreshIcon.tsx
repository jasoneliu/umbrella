import React, { useState, useRef } from "react";
import { Animated, Easing, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// refresh location
const RefreshIcon = ({ refresh }: { refresh: () => Promise<void> }) => {
  const [rotation, setRotation] = useState(new Animated.Value(0));
  const animationRunning = useRef(false);
  const refreshing = useRef(false);

  // run rotating animation
  const runAnimation = () => {
    animationRunning.current = true;
    Animated.timing(rotation, {
      toValue: 1,
      duration: 750,
      easing: Easing.bezier(0.42, 0, 0.58, 1), // ease-in-out
      useNativeDriver: true,
    }).start(async () => {
      rotation.setValue(0); // return to 0deg
      await new Promise((r) => setTimeout(r, 100)); // delay next rotation

      // keep running animation if location is still being fetched
      if (refreshing.current) {
        runAnimation();
      } else {
        animationRunning.current = false;
      }
    });
  };

  // interpolate beginning and end values of animation
  const rotateAnimation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <TouchableOpacity
      onPress={async () => {
        // do nothing if animation already running
        if (animationRunning.current) {
          return;
        }

        // run animation until location is fetched
        refreshing.current = true;
        runAnimation();
        await refresh();
        refreshing.current = false;
      }}
    >
      <Animated.View style={{ transform: [{ rotate: rotateAnimation }] }}>
        <MaterialIcons name="refresh" size={36} color={"white"} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default RefreshIcon;
