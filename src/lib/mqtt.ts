import mqtt, { MqttClient } from 'npm:mqtt@5';

type ClientCb = (client: MqttClient) => void;

function connect(brokerUrl: string, config: mqtt.IClientOptions, cb: ClientCb, forceNow = false) {
    console.info(`Connecting to MQTT host=${brokerUrl}:${config.port} username=${config.username}`);
    const client = mqtt.connect(brokerUrl, config);

    client.on('error', function () {
        console.error('mqtt connection error');
        // console.info('mqtt closed connection');

        // setTimeout(() => {
        //     client.reconnect()
        // }, SECONDS_5)
    });

    client.on('close', function () {
        // cl.reconnect()
        console.info('mqtt closed connection');
    });

    client.on('disconnect', function () {
        console.info('mqtt disconnected');
    });

    cb(client)
}

function applyLogging(cl: MqttClient) {
    // cl.on('connect', function () {
    //     console.info('mqtt connected');

    //     // subscriber to all messages
    //     cl.subscribe('#', function (err) {
    //         if (err) console.error('problem:', err);
    //         else console.info('mqtt subscribed');
    //     });
    // });

    cl.on('message', function (topic) {
        console.debug(topic);
    });

    cl.on('offline', function () {
        console.info('mqtt offline');
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
