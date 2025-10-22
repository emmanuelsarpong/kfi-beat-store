import morgan from "morgan";

export function requestLogger() {
  const format = process.env.NODE_ENV === "production" ? "combined" : "dev";
  return morgan(format);
}
