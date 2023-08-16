import mqtt from "npm:mqtt@4";
import { config } from "./config.ts";
import { assignProperty, Device, DeviceExposesGeneric } from "./convertor.ts";
import { Platform } from "./lib/connection.ts";
import { ComponentType, PropertyDataType } from "./lib/type.ts";

const instances: Platform[] = [];
let devices: Device[];


const zigbeeClient = mqtt.connect(config.ZIGBEE_BRIDGE_HOST, {
  port: config.ZIGBEE_BRIDGE_PORT,
});

zigbeeClient.on("connect", function () {
  console.log("connected");
  zigbeeClient.subscribe("zigbee2mqtt/#");
});

zigbeeClient.on("error", function (err) {
  console.error("Zigbee connection failed", err);
});

zigbeeClient.on("disconnect", function () {
  console.log("Zigbee connection disconnected");
});

zigbeeClient.on("message", async function (topic, message) {
  if (!topic.includes("logging")) console.log("message", topic);

  if (topic === "zigbee2mqtt/bridge/devices") {
    devices = JSON.parse(message.toString()) as unknown as Device[];

    console.log("Refreshing devices");
    await shutdownDevices();
    spawnDevices(devices);
  } else if (!topic.startsWith("zigbee2mqtt/bridge")) {
    const matched = topic.match(/^zigbee2mqtt\/([^\/]+)$/);
    if (!matched) return;
    const [_whole, friendly_name] = matched;
    const plat = instances.find((p) => p.deviceName === friendly_name);
    if (!plat) return;

    const data: { [key: string]: string | number | boolean } = JSON.parse(message.toString());
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
});


function publishSetToZigbee(friendly_name: string, propertyName: string) {
  return (value: string) =>
    zigbeeClient.publish(
      `zigbee2mqtt/${friendly_name}/set/${propertyName}`,
      value,
    );
}

async function spawnDevices(devices: Device[]) {
  // const platformDevices = await getDevices();

  for (const device of devices) {
    // TODO delete api key when not paired
    // const paired = platformDevices.find(
    //   (d) => d.metadata.deviceId === device.ieee_address,
    // );
    const friendly_name = device.friendly_name || device.ieee_address;

    const plat = new Platform(
      device.ieee_address,
      config.PLATFORM_USERNAME,
      friendly_name,
      config.PLATFORM_MQTT_HOST,
      config.PLATFORM_MQTT_PORT,
    );
    instances.push(plat);

    const thing = plat.addNode(
      device.friendly_name || "Node",
      device.friendly_name || "Node",
      ComponentType.generic,
    );

    for (const node of device.definition?.exposes || []) {
      switch (node.type) {
        case "switch":
          for (const property of node.features) {
            await assignProperty(
              property,
              thing,
              publishSetToZigbee(friendly_name, property.name),
            );
          }
          break;
        default:
          await assignProperty(
            node,
            thing,
            publishSetToZigbee(friendly_name, node.name),
          );
      }
    }

    plat.init();
  }
}

Deno.addSignalListener("SIGINT", shutdownClients);
Deno.addSignalListener("SIGTERM", shutdownClients);
Deno.addSignalListener("SIGQUIT", shutdownClients);

async function shutdownDevices() {
  console.log("Shuting down clients");
  const promises = instances.map((plat) => plat.disconnect());
  await Promise.all(promises);
}

async function shutdownClients() {
  await shutdownDevices();
  zigbeeClient.end();
  Deno.exit(0);
}

