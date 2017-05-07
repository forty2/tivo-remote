"use strict";

import { EventEmitter } from 'events';

import mdns from 'mdns';

import TiVoRemote from './TiVoRemote';

const debug = require('debug')('tivo-remote:discovery');
debug('starting up');

let resolverSequence;
{
    const rst    = require('mdns/lib/resolver_sequence_tasks')
    const dns_sd = require('mdns/lib/dns_sd')

    resolverSequence = [
        rst.DNSServiceResolve(),
        'DNSServiceGetAddrInfo' in dns_sd
            ? rst.DNSServiceGetAddrInfo()
            : rst.getaddrinfo({ families: [4] }),
        rst.makeAddressesUnique()
    ];
};

class TiVoDiscovery extends EventEmitter {
    constructor() {
        super();

        this._DVRs = { };
        const browser = this._browser =
            mdns.createBrowser(
                mdns.tcp('tivo-remote'),
                { resolverSequence }
            );

        browser
            .on('serviceUp', service => {
                const dev = this._DVRs[service.txtRecord.TSN] = new TiVoRemote(service);

                this.emit('founddevice', dev);
            })
            .on('serviceDown', service => {
                let dvr = this._DVRs[service.txtRecord.TSN];
                dvr.deinit();
                delete this._DVRs[service.txtRecord.TSN];

                this.emit('lostdevice', dev);
            });
    }

    discover() {
        this._browser.start();
    }
}

let discovery = new TiVoDiscovery();
export {
    discovery as default
}
