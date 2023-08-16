import { MqttClient } from "npm:mqtt@4";
import { PropertyClass, PropertyDataType } from "./type.ts";

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
    propertyTopic?: string
    client?: MqttClient

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

    advertise = (nodePrefix: string, client: MqttClient) => {
        const propertyPrefix = `${nodePrefix}/${this.propertyId}`;
        const { name, dataType, unitOfMeasurement, propertyClass, format, settable, retained } = this;

        if (name)
            client.publish(`${propertyPrefix}/$name`, name);

        if (unitOfMeasurement)
            client.publish(`${propertyPrefix}/$unit`, unitOfMeasurement);

        if (dataType)
            client.publish(`${propertyPrefix}/$datatype`, dataType);

        if (propertyClass)
            client.publish(`${propertyPrefix}/$class`, propertyClass);

        if (format)
            client.publish(`${propertyPrefix}/$format`, format);

        if (settable)
            client.publish(`${propertyPrefix}/$settable`, settable.toString());


        if (retained)
            client.publish(`${propertyPrefix}/$retained`, retained.toString());
    };

    subscribe = (nodePrefix: string, client: MqttClient) => {
        if (!this.settable) return;

        const propertyPrefix = `${nodePrefix}/${this.propertyId}`;
        const propertySetTopic = `${propertyPrefix}/set`;

        client.subscribe(propertySetTopic)
        client.on("message", (topic, payload) => {
            if (topic !== propertySetTopic) return
            const newValue = payload.toString();

            console.log("Recieved:", topic, newValue)
            this.value = newValue
            if (this.callback) this.callback(this);
            client.publish(propertyPrefix, newValue)
        })
    }

    setValue = (newValue: string) => {
        if (this.propertyTopic && this.client) this.client.publish(this.propertyTopic, newValue)
        this.value = newValue;
    }

    updateClient = (nodePrefix: string, client: MqttClient) => {
        this.client = client;
        this.propertyTopic = `${nodePrefix}/${this.propertyId}`;
    }
}