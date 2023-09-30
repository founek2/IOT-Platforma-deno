import mqtt, { MqttClient } from 'npm:mqtt@5';
import { logger } from './logger/index.ts';

type ClientCb = (client: MqttClient) => void;

function connect(brokerUrl: string, config: mqtt.IClientOptions, cb: ClientCb, forceNow = false) {
    logger.debug(`Connecting to MQTT host=${brokerUrl}:${config.port} username=${config.username}`);
    const client = mqtt.connect(brokerUrl, config);

    cb(client)
}

function applyLogging(cl: MqttClient) {
    cl.on('message', function (topic) {
        logger.silly(topic);
    });

    cl.on('offline', function () {
        logger.silly('mqtt offline');
    });
}

/* Initialize MQTT client connection */
export default async (brokerUrl: string, config: mqtt.IClientOptions, apply: (client: MqttClient) => void) => {
    function applyListeners(cl: MqttClient) {
        applyLogging(cl)
        apply(cl)
    }

    await connect(brokerUrl, config, (cl) => {
        applyListeners(cl)
    }, true);
};
