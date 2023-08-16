// automatically loads the local .env
import "https://deno.land/std@0.198.0/dotenv/load.ts";
import { assert } from "https://deno.land/std@0.198.0/assert/mod.ts";

function loadEnv(key: string, defaultValue?: string) {
  const value = Deno.env.get(key) ?? defaultValue
  assert(value, `missing env ${key}`);

  return value;
}

export const config = {
  PLATFORM_API_KEY: loadEnv("IOT_PLATFORM_API_KEY"),
  PLATFORM_USERNAME: loadEnv("IOT_PLATFORM_USERNAME"),
  PLATFORM_API_HOST: loadEnv("IOT_PLATFORM_API_HOST"),
  PLATFORM_MQTT_HOST: loadEnv("IOT_PLATFORM_MQTT_HOST"),
  PLATFORM_MQTT_PORT: Number(loadEnv("IOT_PLATFORM_MQTT_PORT", "8883")),
  ZIGBEE_BRIDGE_HOST: loadEnv("ZIGBEE_BRIDGE_HOST"),
  ZIGBEE_BRIDGE_PORT: Number(loadEnv("ZIGBEE_BRIDGE_PORT", "1883")),
  STORAGE_PATH: loadEnv("STORAGE_PATH", "local-storage"),
  DEEPL_API_KEY: Deno.env.get("DEEPL_API_KEY")
};