// get time (formatted for 12-hour clock)
const getTime = (time: Date, includeMinutes: boolean) => {
  let hours = time.getHours();
  const minutes = time.getMinutes();

  // find period (AM/PM or am/pm)
  let period;
  if (includeMinutes) {
    period = hours < 12 ? "AM" : "PM";
  } else {
    period = hours < 12 ? "am" : "pm";
  }

  // convert to 12-hour
  if (hours === 0) {
    hours = 12;
  } else if (hours > 12) {
    hours -= 12;
  }

  // return formatted time
  if (includeMinutes) {
    return `${hours}:${minutes < 10 ? "0" + minutes : minutes} ${period}`;
  } else {
    return `${hours}${period}`;
  }
};

export default getTime;
