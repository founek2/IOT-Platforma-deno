import dotenv from "dotenv";
import assert from "node:assert/strict";

dotenv.config();

export const config = {
  PLATFORM_API_KEY: Deno.env.get("IOT_PLATFORM_API_KEY") as string,
  PLATFORM_USERNAME: Deno.env.get("IOT_PLATFORM_USERNAME") as string,
  PLATFORM_API_HOST: Deno.env.get("IOT_PLATFORM_API_HOST") as string,
  PLATFORM_MQTT_HOST: Deno.env.get("IOT_PLATFORM_MQTT_HOST") as string,
  PLATFORM_MQTT_PORT: Number(Deno.env.get("IOT_PLATFORM_MQTT_PORT")) || 8883,
  ZIGBEE_BRIDGE_HOST: Deno.env.get("ZIGBEE_BRIDGE_HOST") as string,
  ZIGBEE_BRIDGE_PORT: Number(Deno.env.get("ZIGBEE_BRIDGE_PORT")) || 1883,
  STORAGE_PATH: (Deno.env.get("STORAGE_PATH")) || "local-storage",
  DEEPL_API_KEY: Deno.env.get("DEEPL_API_KEY")
};

assert(Deno.env.get("IOT_PLATFORM_API_KEY"), "missing env IOT_PLATFORM_API_KEY");
assert(Deno.env.get("IOT_PLATFORM_API_HOST"), "missing env IOT_PLATFORM_API_HOST");
assert(
  Deno.env.get("IOT_PLATFORM_MQTT_HOST"),
  "missing env IOT_PLATFORM_MQTT_HOST"
);
assert(Deno.env.get("IOT_PLATFORM_USERNAME"), "missing env IOT_PLATFORM_USERNAME");
assert(Deno.env.get("ZIGBEE_BRIDGE_HOST"), "missing env ZIGBEE_BRIDGE_HOST");
