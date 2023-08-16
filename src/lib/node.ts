import { MqttClient } from "npm:mqtt@4";
import { ComponentType } from "./type.ts";
import { Property, PropertyArgs } from "./property.ts";

export interface NodeArgs {
  nodeId: string;
  name: string;
  componentType: ComponentType;
}
export class Node {
  nodeId: string;
  name: string;
  componentType: ComponentType;
  properties: Property[] = [];

  constructor({ nodeId, name, componentType }: NodeArgs) {
    this.nodeId = nodeId;
    this.name = name;
    this.componentType = componentType;
  }

  addProperty = (args: PropertyArgs) => {
    const property = new Property(args);
    this.properties.push(property);

    return property;
  };

  subscribe = (devicePrefix: string, client: MqttClient) => {
    const nodePrefix = `${devicePrefix}/${this.nodeId}`;
    this.properties.forEach(property => property.subscribe(nodePrefix, client))
  }

  updateClient = (devicePrefix: string, client: MqttClient) => {
    const nodePrefix = `${devicePrefix}/${this.nodeId}`;
    this.properties.forEach(property => property.updateClient(nodePrefix, client))
  }

  advertise = (devicePrefix: string, client: MqttClient) => {
    const nodePrefix = `${devicePrefix}/${this.nodeId}`;
    client.publish(`${nodePrefix}/$name`, this.name);
    client.publish(`${nodePrefix}/$type`, this.componentType);
    client.publish(`${nodePrefix}/$properties`, this.properties.map((prop) => prop.propertyId).join());

    this.properties.forEach(property => property.advertise(nodePrefix, client))
  };
}
