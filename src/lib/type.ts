export enum PropertyClass {
    Temperature = 'temperature',
    Humidity = 'humidity',
    Pressure = 'pressure',
    Voltage = 'voltage',
}
export enum DeviceCommand {
    restart = 'restart',
    reset = 'reset',
}

export enum ComponentType {
    sensor = 'sensor',
    generic = 'generic',
    switch = 'switch',
    activator = 'activator',
}

export const NodeProperties = {
    [ComponentType.switch]: ['power'],
};

export enum PropertyDataType {
    string = 'string',
    float = 'float',
    boolean = 'boolean',
    integer = 'integer',
    enum = 'enum',
    color = 'color',
}

export interface IUser {
    _id?: any;
    info: {
        userName: string;
        firstName: string;
        lastName: string;
        email?: string;
        phoneNumber?: string;
    };
    auth: {
        type: 'passwd';
        password: string;
    };
    realm: string;
    groups: string[];
    notifyTokens: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IDiscovery {
    _id?: any;
    deviceId: string;
    realm: string;
    name: string;
    things: { [nodeId: string]: any };
    createdAt: Date;
    updatedAt: Date;
    state: {
        status: {
            value: string;
            timestamp: Date;
        };
    };
    pairing: boolean;
}

export interface IDevice {
    _id?: any;
    info: {
        name: string;
        description?: string;
        imgPath?: string;
        location: {
            building: string;
            room: string;
        };
    };
    permissions: {
        read: string[];
        write: string[];
        control: string[];
    };
    things: any[];
    state?: {
        status: string;
        lastAck?: Date;
    };
    apiKey: string;
    metadata: {
        realm: string;
        deviceId: string;
        publicRead?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
