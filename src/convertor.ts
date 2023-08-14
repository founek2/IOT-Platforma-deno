import { MqttClient } from "mqtt";
import { Platform } from "./lib/connection.ts";
import { Node } from "./lib/node.ts";
import { PropertyDataType } from "./lib/type.ts";
import { config } from "./config.ts";
// import translate from "translate";

// const translate = await import("translate")

// (async function () {
//   const translation = await translate("soil moisture", {
//     engine: "deepl", key: config.DEEPL_API_KEY, to: "cz"
//   })
//   console.log("translated", translation)
// })()



export interface Device {
  definition: DeviceDefinition | null;
  ieee_address: string;
  friendly_name?: string;
}
export interface DeviceDefinition {
  // contains device full name
  description: string;
  model: string;
  vendor: string;
  exposes: (DeviceExposesGeneric | DeviceExposesSwitch)[];
}

export interface DeviceExposesText {
  type: "text";
  access: number;
  name: string;
  property: string;
  description: string;
}
export interface DeviceExposesEnum {
  type: "enum";
  access: number;
  name: string;
  property: string;
  description: string;
  values?: string[];
}

export interface DeviceExposesNumeric {
  type: "numeric";
  access: number;
  name: string;
  property: string;
  description: string;
  unit?: string;
  value_max?: number;
  value_min?: number;
}

export interface DeviceExposesBinary {
  type: "binary";
  access: number;
  name: string;
  property: string;
  description: string;
  value_off: string;
  value_on: string;
}
export type DeviceExposesGeneric =
  | DeviceExposesBinary
  | DeviceExposesNumeric
  | DeviceExposesEnum
  | DeviceExposesText;

export interface DeviceExposesSwitch {
  type: "switch";
  features: DeviceExposesGeneric[];
}

const settableMask = 1 << 1;

export function assignProperty(
  expose: DeviceExposesGeneric,
  thing: Node,
  publishBridge: (value: string) => any
) {
  switch (expose.type) {
    case "enum":
      thing.addProperty({
        propertyId: expose.property,
        dataType: PropertyDataType.enum,
        name: expose.name,
        settable: Boolean(expose.access & settableMask),
        format: expose.values?.join(","),
        callback: (prop) => {
          console.log("recieved enum:", prop.value);
          publishBridge(prop.value!);
        },
      });
      break;
    case "numeric":
      thing.addProperty({
        propertyId: expose.property,
        dataType: PropertyDataType.float,
        name: expose.name,
        settable: Boolean(expose.access & settableMask),
        unitOfMeasurement: expose.unit,
        callback: (prop) => {
          console.log("recieved float:", prop.value);
          publishBridge(prop.value!);
        },
      });
      break;
    case "binary":
      thing.addProperty({
        propertyId: expose.property,
        dataType: PropertyDataType.boolean,
        name: expose.name,
        settable: Boolean(expose.access & settableMask),
        callback: (prop) => {
          console.log("recieved binary:", prop.value);
          if (prop.value === "true") publishBridge(expose.value_on);
          else publishBridge(expose.value_off);
        },
      });
      break;
    case "text":
      thing.addProperty({
        propertyId: expose.property,
        dataType: PropertyDataType.string,
        name: expose.name,
        settable: Boolean(expose.access & settableMask),
        callback: (prop) => {
          console.log("recieved text:", prop.value);
          publishBridge(prop.value!);
        },
      });
      break;
  }
}
