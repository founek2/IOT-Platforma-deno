import { ComponentType, DeviceCommand } from "./type.ts";
import * as mqtt from "npm:mqtt@5";
import { Node } from "./node.ts";
import { EventEmitter } from "node:events";
import { localStorage } from "./storage.ts";
import { Property, PropertyArgs } from "./property.ts";
import { Buffer } from "node:buffer";
import connect from "./mqtt.ts"
import { logger } from "./logger/index.ts";

export enum DeviceStatus {
  disconnected = "disconnected",
  lost = "lost",
  error = "error",
  alert = "alert",
  sleeping = "sleeping",
  restarting = "restarting",
  ready = "ready",
  init = "init",
  paired = "paired",
}

interface store {
  apiKey: string;
}

export class Platform extends EventEmitter {
  deviceId: string;
  deviceName: string;
  meta: null | store = null;
  userName: string;
  client: mqtt.MqttClient;
  prefix = "prefix";
  nodes: Node[] = [];
  sensorCnt = -1;
  status: DeviceStatus = DeviceStatus.lost;
  mqttHost: string;
  mqttPort: number;

  constructor(
    deviceId: string,
    userName: string,
    deviceName: string,
    mqttHost: string,
    mqttPort: number,
  ) {
    super();
    this.deviceId = deviceId;
    this.userName = userName;
    this.deviceName = deviceName;
    this.mqttHost = mqttHost;
    this.mqttPort = mqttPort;
    // temporary fix
    this.client = undefined as any;

    const storedItem = localStorage.getItem(this.deviceId);
    if (storedItem) this.meta = JSON.parse(storedItem);
  }

  init = () => {
    if (!this.isPaired()) return this.connectPairing();
    return this.connect();
  };

  isPaired = () => {
    return this.meta;
  };

  forgot = () => {
    this.meta = null;
    this.prefix = "prefix";
    localStorage.removeItem(this.deviceId);
  };

  mqttParams = (userName: string, password: string): mqtt.IClientOptions => {
    return {
      username: userName,
      password: password,
      port: this.mqttPort,
      rejectUnauthorized: false,
      keepalive: 30,
      will: {
        topic: `${this.getDevicePrefix()}/$state`,
        payload: Buffer.from(DeviceStatus.lost, "utf-8"),
        retain: true,
        qos: 1,
      },
      clientId: `mqttjs_${this.deviceId}`
    }
  }

  createMqttInstance = (userName: string, password: string, applyListeners: (client: mqtt.MqttClient) => void) => {
    if (this.client) this.client.end(true);

    const config = this.mqttParams(userName, password);
    this.client = connect(this.mqttHost, config)
    applyListeners(this.client)
  }

  connect = () => {
    if (this.meta === null) {
      logger.error("cant connect without apiKey");
      return;
    }

    this.prefix = `v2/${this.userName}`;

    const applyListeners = (client: mqtt.MqttClient) => {
      this.publishStatus(DeviceStatus.init);

      logger.debug("connecting as paired device");
      // client.subscribe("v2/device/" + this.deviceId + "/apiKey");
      client.subscribe(`${this.getDevicePrefix()}/$cmd/set`);

      this.advertise();

      this.nodes.forEach((node) => {
        node.subscribe(this.getDevicePrefix(), client)
        node.updateClient(this.getDevicePrefix(), client)
      });

      client.on("message", (topic, data) => {
        const message = data.toString();
        logger.debug("message", topic, message);
        if (topic === `${this.getDevicePrefix()}/$cmd/set`) {
          if (message === DeviceCommand.restart) {
            logger.warning("Reseting...");
            client.end();
            this.connect();
          } else if (message === DeviceCommand.reset) {
            logger.info("Restarting...");
            client.end();
            this.forgot();
            this.connectPairing();
          }
        }

      });

      client.on("error", (err: any) => {
        if (err.code === 4 && Deno.env.get("NODE_ENV") !== "production") {
          // Invalid login
          logger.error("Invalid userName/password, forgeting apiKey");

          client.end();
          this.forgot();
          this.connectPairing();
        }
      });

      client.on("connect", () => {
        this.publishStatus(DeviceStatus.ready)
        this.emit("connect", client);
      });
    }

    this.createMqttInstance(`device=${this.userName}/${this.deviceId}`, this.meta.apiKey, applyListeners)
  };

  addNode = (nodeId: string, name: string, componentType: ComponentType) => {
    const node = new Node({ nodeId, name, componentType });
    this.nodes.push(node);
    return node;
  };

  addSensor = (args: PropertyArgs) => {
    const node = this.addNode(
      "sensor" + ++this.sensorCnt,
      args.name,
      ComponentType.sensor,
    );
    node.addProperty(args);
  };

  publishStatus = (status: DeviceStatus) => {
    if (!this.client.disconnecting || !this.client.disconnected) {
      const topic = `${this.getDevicePrefix()}/$state`
      this.client.publish(topic, status)
      logger.debug("Publishing status", topic, status)
    }
  };

  getDevicePrefix = () => `${this.prefix}/${this.deviceId}`;

  /**
   * Advertise all features, nodes and properties
   */
  advertise = () => {
    const devicePrefix = this.getDevicePrefix();
    this.client.publish(`${devicePrefix}/$name`, this.deviceName);
    this.client.publish(`${devicePrefix}/$realm`, this.userName);
    this.client.publish(`${devicePrefix}/$nodes`, this.nodes.map((node) => node.nodeId).join());

    this.nodes.forEach(node => node.advertise(devicePrefix, this.client));
  }

  connectPairing = () => {
    this.prefix = "prefix";
    const applyListeners = (client: mqtt.MqttClient) => {
      this.publishStatus(DeviceStatus.init);

      const devicePrefix = this.getDevicePrefix();
      client.subscribe(`${devicePrefix}/$config/apiKey/set`);
      client.subscribe(`${devicePrefix}/$cmd/set`);

      this.advertise()

      this.nodes.forEach((node) => {
        // Only allow publishing values, do not allow setting
        node.updateClient(this.getDevicePrefix(), client)
      });

      client.on("message", (topic, message) => {
        if (topic === this.getDevicePrefix() + "/$config/apiKey/set") {
          this.meta = { apiKey: message.toString() };
          localStorage.setItem(this.deviceId, JSON.stringify(this.meta));
          logger.info("GOT apiKey -> reconect");

          this.publishStatus(DeviceStatus.paired);
          this.publishStatus(DeviceStatus.disconnected);

          client.end()
          this.connect();
        }
      });

      client.on("connect", () => this.publishStatus(DeviceStatus.ready))
    }

    this.createMqttInstance(`guest=${this.deviceId}`, this.userName, applyListeners)
  };

  publishPropertyData = (
    propertyId: string,
    value: string | ((node: Node, property: Property) => string),
  ) => {
    const node = this.nodes.find(({ properties }) =>
      properties.some((prop) => prop.propertyId === propertyId)
    );
    const property = node?.properties.find((prop) =>
      prop.propertyId === propertyId
    );
    if (!node || !property) {
      return logger.error(`unable to locate node with property ${propertyId}`);
    }

    const finalValue = typeof value === "function"
      ? value(node, property)
      : value;

    property.setValue(finalValue)
  };

  disconnect = async () => {
    this.publishStatus(DeviceStatus.disconnected);
    await this.client.endAsync()
  };
}
