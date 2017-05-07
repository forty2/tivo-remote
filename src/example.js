import TiVoDiscovery from './index';

TiVoDiscovery
    .on('founddevice', (device) => {
        console.log(`Found a device: ${device.name} (${device.ip})`);

        device.sendIrcode('TIVO');
    })
    .on('lostdevice', (device) => {
        console.log(`Lost a device: ${device.name} (${device.ip})`);
    })
    .discover();
