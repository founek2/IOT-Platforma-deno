import mqtt, { MqttClient } from 'npm:mqtt@5';
import { logger } from './logger/index.ts';

type ClientCb = (client: MqttClient) => void;

export default function connect(brokerUrl: string, config: mqtt.IClientOptions) {
    logger.debug(`Connecting to MQTT host=${brokerUrl}:${config.port} username=${config.username}`);
    const client = mqtt.connect(brokerUrl, config);

    applyLogging(client)

    return client;
}

function applyLogging(cl: MqttClient) {
    cl.on('message', function (topic) {
        logger.debug(topic);
    });

    cl.on('offline', function () {
        logger.silly('mqtt offline');
    });

    cl.on('error', function (err) {
        logger.silly('mqtt error', err.name);
    });
}