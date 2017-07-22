import { EventEmitter } from 'events';

import mdns  from 'mdns';
import rst   from 'mdns/lib/resolver_sequence_tasks';
import DnsSd from 'mdns/lib/dns_sd';

import TiVoRemote from './TiVoRemote';

const debug = require('debug')('tivo-remote:discovery');

debug('starting up');

// TODO: What if we don't do this?
const resolverSequence = [
    rst.DNSServiceResolve(),
    'DNSServiceGetAddrInfo' in DnsSd
        ? rst.DNSServiceGetAddrInfo()
        : rst.getaddrinfo({ families: [4] }),
    rst.makeAddressesUnique(),
];

const $DVRs = new WeakMap();
const $browser = new WeakMap();

class TiVoDiscovery extends EventEmitter {
    constructor() {
        super();

        $DVRs.set(this, {});
        const browser =
            mdns.createBrowser(
                mdns.tcp('tivo-remote'),
                { resolverSequence }
            );

        $browser.set(this, browser);

        browser
            .on('serviceUp', (service) => {
                const dev = new TiVoRemote(service);
                $DVRs.get(this)[service.txtRecord.TSN] = dev;
                this.emit('founddevice', dev);
            })
            .on('serviceDown', (service) => {
                const dvr = $DVRs.get(this)[service.txtRecord.TSN];
                dvr.deinit();
                delete $DVRs.get(this)[service.txtRecord.TSN];

                this.emit('lostdevice', dvr);
            });
    }

    discover() {
        $browser.get(this).start();
    }
}

const discovery = new TiVoDiscovery();
export {
    discovery as default,
};
