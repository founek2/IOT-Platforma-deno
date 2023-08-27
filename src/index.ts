import mqtt from "npm:mqtt@5";
import { config } from "./config.ts";
import { assignProperty, Device, DeviceExposesGeneric } from "./convertor.ts";
import { DeviceStatus, Platform } from "./lib/connection.ts";
import { ComponentType, PropertyDataType } from "./lib/type.ts";
import { calculateHash } from "./hash.ts";
import { topicParser } from "./topicParser.ts";

const instances: Platform[] = [];
let globalData: { devices: Device[], fingerprint: string } = { devices: [], fingerprint: "" };

const zigbeeClient = mqtt.connect(config.ZIGBEE_BRIDGE_HOST, {
    port: config.ZIGBEE_BRIDGE_PORT,
});

zigbeeClient.on("connect", function () {
    console.log("zigbeeClient connected");
    zigbeeClient.subscribe("zigbee2mqtt/#");
});
zigbeeClient.on("reconnect", () => console.log("zigbeeClient reconnected"))

zigbeeClient.on("error", function (err) {
    console.error("zigbeeClient error", err);
});

zigbeeClient.on("disconnect", function () {
    console.log("zigbeeClient disconnected");
});

zigbeeClient.on("message", function (topic, message) {
    if (!topic.includes("logging") && !topic.startsWith("zigbee2mqtt/bridge/")) console.log("message", topic, message.toString());

    const handle = topicParser(topic, message);

    handle('zigbee2mqtt/bridge/devices', async function (_topic, message) {
        const devicesStr = message.toString();
        const hash = await calculateHash(devicesStr)
        if (globalData.fingerprint === hash) {
            console.log("Fingerprint matches, skipping refresh")
            return
        }

        globalData = {
            devices: JSON.parse(devicesStr) as unknown as Device[],
            fingerprint: hash,
        };

        console.log("Refreshing devices");
        await shutdownDevices();
        spawnDevices(globalData.devices);
    });

    handle('zigbee2mqtt/+', function (_topic, message, [friendly_name]) {
        const plat = instances.find((p) => p.deviceName === friendly_name);
        if (!plat) return;

        const data: { [key: string]: string | number | boolean } = JSON.parse(message.toString());
        Object.entries(data).forEach(([propertyId, valueAny]) => {
            const value = valueAny.toString();

            plat.publishPropertyData(
                propertyId,
                (_node, property) => {
                    const device = globalData.devices.find((d) =>
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
    });

    handle('zigbee2mqtt/+/availability', function (_topic, message, [friendly_name]) {
        const plat = instances.find((p) => p.deviceName === friendly_name);
        if (!plat) return;

        const data: { state?: "online" | "offline" } = JSON.parse(message.toString());
        const status = data.state === "online" ? DeviceStatus.ready : DeviceStatus.disconnected;
        plat.publishStatus(status)
    })
})

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

