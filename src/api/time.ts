// get current notification time
const getTime = (time: Date, includeMinutes: boolean) => {
  let hours = time.getHours();
  const minutes = time.getMinutes();

  // format time for 12-hour clock
  const period = hours < 12 ? "AM" : "PM";
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  // return time (with or without minuts)
  if (includeMinutes) {
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${period}`;
  } else {
    return `${hours} ${period}`;
  }
};

export default getTime;
