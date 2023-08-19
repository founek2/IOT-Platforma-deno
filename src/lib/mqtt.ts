import mqtt, { MqttClient } from 'npm:mqtt@5';

const SECONDS_10 = 10 * 1000;

type ClientCb = (client: MqttClient) => void;

function connect(brokerUrl: string, config: mqtt.IClientOptions, cb: ClientCb, forceNow = false) {

    return new Promise<void>((res) =>
        setTimeout(
            () => {
                console.info(`Trying to connect to MQTT host=${brokerUrl} port=${config.port}`);
                const client = mqtt.connect(brokerUrl, config);
                client.on('close', function () {
                    console.info('mqtt closed connection');
                    connect(brokerUrl, config, cb);
                });

                cb(client)

                res();
            },
            forceNow ? 0 : SECONDS_10
        )
    );
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

    cl.on('error', function (err) {
        console.error('mqtt connection error', err);
        cl.end();
    });

    cl.on('disconnect', function () {
        console.info('mqtt disconnected');
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
