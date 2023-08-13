import mqtt, { MqttClient } from "mqtt";
import { config } from "./config";
import { Device } from "./convertor";

export async function getDevices() {
  const res = await fetch(`${config.PLATFORM_API_HOST}/api/device`, {
    headers: {
      "x-api-key": config.PLATFORM_API_KEY,
    },
  });
  const body = await res.json();

  return body.docs as any[];
}
