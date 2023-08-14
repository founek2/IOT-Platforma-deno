import { ComponentType, PropertyClass, PropertyDataType } from "./type.ts";

export interface PropertyArgs {
  propertyId: string;
  name: string;
  dataType: PropertyDataType;
  propertyClass?: PropertyClass;
  unitOfMeasurement?: string;
  format?: string;
  settable?: boolean;
  retained?: boolean;
  callback?: (prop: Property) => void;
}
export class Property {
  propertyId: string;
  name: string;
  dataType: PropertyDataType;
  propertyClass?: PropertyClass;
  unitOfMeasurement?: string;
  format?: string;
  settable?: boolean;
  retained?: boolean;
  value: string | undefined;
  callback?: (prop: Property) => void;

  constructor({
    propertyId,
    name,
    dataType,
    propertyClass,
    unitOfMeasurement,
    format,
    settable,
    retained,
    callback,
  }: PropertyArgs) {
    this.propertyId = propertyId;
    this.name = name;
    this.dataType = dataType;
    this.callback = callback;
    this.propertyClass = propertyClass;
    this.unitOfMeasurement = unitOfMeasurement;
    this.format = format;
    this.settable = settable;
    this.retained = retained;
  }
}

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
    this.properties.push(new Property(args));
  };
}
