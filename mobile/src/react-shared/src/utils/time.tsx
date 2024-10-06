export const formatTimeToText = (totalSeconds: number): string => {
  const hours: number = Math.floor(totalSeconds / 3600);
  const minutes: number = Math.floor((totalSeconds % 3600) / 60);
  const seconds: number = totalSeconds % 60;

  if (hours > 0) {
    const formattedTime: string = [hours, minutes, seconds]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
    return formattedTime;
  } else {
    const formattedTime: string = [minutes, seconds]
      .map((val) => val.toString().padStart(2, "0"))
      .join(":");
    return formattedTime;
  }
};
