import { Platform, DeviceStatus, ComponentType, PropertyDataType, logger } from "https://raw.githubusercontent.com/founek2/IOT-Platform-deno/master/src/mod.ts"
import Bravia from "npm:bravia@^1.3.3";

const bravia = new Bravia("192.168.1.15", '80', 1234);

async function getVolume(): Promise<number | never> {
    const info = await bravia.audio.invoke('getVolumeInformation');
    return info.find((obj: any) => obj.target === 'speaker')?.volume;
}

async function getPowerStatus(): Promise<'active' | 'standby'> {
    const info = await bravia.system.invoke('getPowerStatus');
    return info.status;
}

function setVolume(volume: string) {
    return bravia.audio.invoke('setAudioVolume', '1.0', {
        target: 'speaker',
        volume: volume,
    });
}

function setPowerStatus(bool: boolean) {
    return bravia.system.invoke('setPowerStatus', '1.0', { status: bool });
}

const plat = new Platform("BOT-SONY123", "userName", "Sony TV", "mqtt://iotdomu.cz", 1883);

const nodeLight = plat.addNode('television', 'TV', ComponentType.switch);
const powerProperty = nodeLight.addProperty({
    propertyId: 'power',
    dataType: PropertyDataType.boolean,
    name: 'TV',
    settable: true,
    callback: async (newValue) => {
        if (newValue === 'true') await setPowerStatus(true);
        else await setPowerStatus(false);
        return true;
    },
});

const volumeProperty = nodeLight.addProperty({
    propertyId: 'volume',
    dataType: PropertyDataType.integer,
    format: '0:80',
    name: 'TV',
    settable: true,
    callback: async (newValue) => {
        await setVolume(newValue);
        return true
    },
});

plat.init();

async function syncPlatform() {
    try {
        const power = await getPowerStatus();
        powerProperty.setValue(power == 'active' ? 'true' : 'false');

        if (power === "active") {
            const volume = await getVolume();
            volumeProperty.setValue(String(volume));
        }
    } catch (e: any) {
        if (e.code === 'EHOSTUNREACH' || e.code === 'ETIMEDOUT') {
            plat.publishStatus(DeviceStatus.alert);
        } else logger.error(e);
    }
}

syncPlatform();
setInterval(syncPlatform, 3 * 60 * 1000);