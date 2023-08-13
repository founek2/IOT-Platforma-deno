import dotenv from "dotenv";
import assert from "node:assert/strict";

dotenv.config();

export const config = {
  PLATFORM_API_KEY: process.env.IOT_PLATFORM_API_KEY as string,
  PLATFORM_USERNAME: process.env.IOT_PLATFORM_USERNAME as string,
  PLATFORM_API_HOST: process.env.IOT_PLATFORM_API_HOST as string,
  PLATFORM_MQTT_HOST: process.env.IOT_PLATFORM_MQTT_HOST as string,
  PLATFORM_MQTT_PORT: Number(process.env.IOT_PLATFORM_MQTT_PORT) || 8883,
  ZIGBEE_BRIDGE_HOST: process.env.ZIGBEE_BRIDGE_HOST as string,
  ZIGBEE_BRIDGE_PORT: Number(process.env.ZIGBEE_BRIDGE_PORT) || 1883,
  STORAGE_PATH: (process.env.STORAGE_PATH as string) || "local-storage",
};

assert(process.env.IOT_PLATFORM_API_KEY, "missing env IOT_PLATFORM_API_KEY");
assert(process.env.IOT_PLATFORM_API_HOST, "missing env IOT_PLATFORM_API_HOST");
assert(
  process.env.IOT_PLATFORM_MQTT_HOST,
  "missing env IOT_PLATFORM_MQTT_HOST"
);
assert(process.env.IOT_PLATFORM_USERNAME, "missing env IOT_PLATFORM_USERNAME");
assert(process.env.ZIGBEE_BRIDGE_HOST, "missing env ZIGBEE_BRIDGE_HOST");
