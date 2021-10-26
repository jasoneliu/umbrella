// get current notification time
const getTime = (time: Date) => {
  let hours = time.getHours();
  const minutes = time.getMinutes();

  // format time for 12-hour clock
  const period = hours < 12 ? "AM" : "PM";
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${period}`;
};

export default getTime;
