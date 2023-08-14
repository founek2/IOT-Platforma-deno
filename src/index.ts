import mqtt, { MqttClient } from "npm:mqtt@5";
import { config } from "./config.ts";
import { getDevices } from "./connector.ts";
import { assignProperty, Device, DeviceExposesGeneric } from "./convertor.ts";
import { Platform } from "./lib/connection.ts";
import { ComponentType, PropertyDataType } from "./lib/type.ts";

let zigbeeClient: MqttClient;
const instances: Platform[] = [];
let devices: Device[];

async function main() {
  zigbeeClient = mqtt.connect(config.ZIGBEE_BRIDGE_HOST, {
    port: config.ZIGBEE_BRIDGE_PORT,
  });

  zigbeeClient.on("connect", function () {
    zigbeeClient.subscribe("zigbee2mqtt/#");
    //   zigbeeClient.subscribe("zigbee2mqtt/bridge/state")
  });

  zigbeeClient.on("message", function (topic, message) {
    if (topic === "zigbee2mqtt/bridge/devices") {
      devices = JSON.parse(message.toString()) as unknown as Device[];
      handleDevicesMessage(
        devices,
      );
    } else if (!topic.startsWith("zigbee2mqtt/bridge")) {
      const matched = topic.match(/^zigbee2mqtt\/([^\/]+)$/);
      if (matched) {
        const [_whole, friendly_name] = matched;
        const plat = instances.find((p) => p.deviceName === friendly_name);
        if (!plat) return;

        const data: { [key: string]: string | number | boolean } = JSON.parse(
          message.toString(),
        );

        Object.entries(data).forEach(([propertyId, valueAny]) => {
          const value = valueAny.toString();

          plat.publishPropertyData(
            propertyId,
            (_node, property) => {
              const device = devices.find((d) =>
                d.friendly_name === friendly_name
              );
              const exposes = device?.definition?.exposes.find((expose) =>
                (expose as DeviceExposesGeneric)?.property === propertyId
              );
              if (!exposes) return value;

              if (
                exposes.type === "binary" &&
                property.dataType === PropertyDataType.boolean
              ) {
                if (exposes.value_on === value) {
                  return "true";
                } else if (exposes.value_off === value) {
                  return "false";
                }
              }

              return value;
            },
          );
        });
      }
    }
  });
}

function publishSetBridge(friendly_name: string, propertyName: string) {
  return (value: string) =>
    zigbeeClient.publish(
      `zigbee2mqtt/${friendly_name}/set/${propertyName}`,
      value,
    );
}

async function handleDevicesMessage(devices: Device[]) {
  const platformDevices = await getDevices();

  for (const device of devices) {
    // TODO delete api key when not paired
    const paired = platformDevices.find(
      (d) => d.metadata.deviceId === device.ieee_address,
    );

    const plat = new Platform(
      device.ieee_address,
      config.PLATFORM_USERNAME,
      device.friendly_name || device.ieee_address,
      config.PLATFORM_MQTT_HOST,
      config.PLATFORM_MQTT_PORT,
    );
    instances.push(plat);

    const thing = plat.addNode(
      device.friendly_name || "Node",
      device.friendly_name || "Node",
      ComponentType.generic,
    );

    for (let node of device.definition?.exposes || []) {
      switch (node.type) {
        case "switch":
          for (const property of node.features) {
            await assignProperty(
              property,
              thing,
              publishSetBridge(
                device.friendly_name || device.ieee_address,
                property.name,
              ),
            );
          }
          break;
        default:
          await assignProperty(
            node,
            thing,
            publishSetBridge(
              device.friendly_name || device.ieee_address,
              node.name,
            ),
          );
      }
    }

    plat.init();
  }
}

main();

Deno.addSignalListener("SIGINT", shutdownClients);
Deno.addSignalListener("SIGTERM", shutdownClients);

async function shutdownClients() {
  console.log("Shuting down clients");
  const promises = instances.map((plat) => plat.disconnect());
  await Promise.all(promises);
  await zigbeeClient.endAsync();
  Deno.exit(0);
}
