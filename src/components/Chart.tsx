import React from "react";
import { View } from "react-native";
import { Defs, LinearGradient, Stop } from "react-native-svg";
import { VictoryArea, VictoryAxis, VictoryChart } from "victory-native";
import getTime from "../api/time";

const Chart = ({ data }: { data: number[] }) => {
  // display data for next 8 hours
  data = data.slice(0, 8);

  // colors
  const blue = "hsl(169, 65%, 70%)";
  const gray = "hsl(0, 0%, 50%)";

  // vertical color gradient
  const Gradient = () => (
    <Defs key={"gradient"}>
      <LinearGradient id={"gradient"} x1={"0%"} y1={"0%"} x2={"0%"} y2={"100%"}>
        <Stop offset={"0%"} stopColor={blue} stopOpacity={1} />
        <Stop offset={"100%"} stopColor={blue} stopOpacity={0.4} />
      </LinearGradient>
    </Defs>
  );

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingLeft: 25,
      }}
    >
      <VictoryChart
        domain={{
          x: [0, data.length - 1],
          y: [0, Math.max(0.2, Math.max(...data))],
        }}
        height={250}
      >
        <Gradient />
        <VictoryAxis // x axis
          dependentAxis={false}
          tickValues={data.map((value, index) => index)}
          tickFormat={(index: number) => {
            let time = new Date();
            time.setHours(time.getHours() + index);
            return getTime(time, false);
          }}
          style={{
            axis: { stroke: gray },
            grid: { stroke: gray, strokeDasharray: "4 8", strokeWidth: 1 },
            tickLabels: { fill: gray, fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis // y axis
          dependentAxis={true}
          tickValues={[0.1, 0.2]}
          tickFormat={(value: number) => `${value} in/h`}
          style={{
            axis: { stroke: gray },
            grid: {
              stroke: blue,
              strokeDasharray: "4 8",
              strokeWidth: 2,
            },
            tickLabels: {
              fill: blue,
              fontSize: 10,
              padding: 5,
            },
          }}
        />
        <VictoryArea // area chart
          data={data}
          interpolation="monotoneX"
          style={{ data: { fill: "url(#gradient)" } }}
        />
      </VictoryChart>
    </View>
  );
};

export default Chart;
