import net from 'net';

import TiVoRemote from '../src/TiVoRemote';

const config = {
    address: '127.0.0.1',
    port: 31339,
    name: 'test',
    TSN: 'FAKE',
};

function timeout(delay) {
    return new Promise(
        (resolve) => {
            setTimeout(() => resolve(), delay);
        }
    );
}

function pad(n, p, c) {
    const padChar = typeof c !== 'undefined' ? c : '0';
    const padding = new Array(1 + p).join(padChar);
    return (padding + n).slice(-padding.length);
}

function handleChannelRequest(sock, req) {
    if (!req) sock.write('CH_FAILED MISSING_CHANNEL\r');

    let match;
    if ((match = req.match(/^(\d{1,4})(?: (\d{1,4}))?$/))) {
        let ch = match[1];
        let subch = match[2];

        if (ch) ch /= 1;
        if (subch) subch /= 1;

        switch (ch % 10) {
        case 0: {
            // channels divisible by 10 should be treated as invalid for testing purposes
            sock.write('CH_FAILED INVALID_CHANNEL\r');
            break;
        }

        case 9: {
            // these channels indicate "pretend not to be in LIVETV mode"
            sock.write('CH_FAILED NO_LIVE\r');
            break;
        }

        default: {
            let res = `CH_STATUS ${pad(ch, 4)}`;
            if (subch) {
                res += ` ${pad(subch, 4)}`;
            }
            res += ' LOCAL\r'; // TODO: test with other "reason"s?
            sock.write(res);
            break;
        }
        }
    } else {
        sock.write('CH_FAILED MALFORMED_CHANNEL\r');
    }
}

let handlers = {
    TELEPORT(sock, req) {
        if (!req) sock.write('MISSING_TELEPORT_NAME\r');
        if (req === 'LIVETV') sock.write('LIVETV_READY\r');
    },
    FORCECH: handleChannelRequest,
    SETCH: handleChannelRequest,
};

let server;
let device;
beforeAll(() => {
    server =
        net.createServer(
            (sock) => {
                sock
                    .on('data', (data) => {
                        const req = data.toString();
                        let match;
                        if ((match = req.match(/^([^ ]+) ([^\r]*)\r/))) {
                            const cmd = match[1];
                            if (handlers[cmd]) {
                                handlers[cmd](sock, match[2]);
                            }
                        }
                    })
                    .on('close', () => { sock.destroy() });
            }
        );

    return new Promise(
        (resolve, reject) => {
            server.listen(
                config.port,
                config.address,
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        }
    )
        .then(() => {
            device = new TiVoRemote({
                name: config.name,
                txtRecord: { TSN: config.TSN },
                addresses: [config.address],
                port: config.port,
            });
        });
});

describe('construction', () => {
    it('should have the right name', () => {
        expect(device.name).toBe(config.name);
    });
    it('should have the right ID', () => {
        expect(device.id).toBe(config.TSN);
    });
    it('should have the right address', () => {
        expect(device.ip).toBe(config.address);
    });
});

describe('network', () => {
    let originalHandlers;
    beforeAll(() => {
        originalHandlers = handlers;
    });

    it('should send TELEPORT commands', (done) => {
        const dest = 'LIVETV';
        handlers = {
            TELEPORT(_, msg) {
                expect(msg).toBe(dest);
                done();
            },
        };
        device.teleport(dest);
    });
    it('should send FORCECH commands', (done) => {
        const channel = '2';
        handlers = {
            FORCECH(_, msg) {
                expect(msg).toBe(channel);
                done();
            },
        };
        device.setChannel(channel, true);
    });
    it('should send SETCH commands', (done) => {
        const channel = '2';
        handlers = {
            SETCH(_, msg) {
                expect(msg).toBe(channel);
                done();
            },
        };
        device.setChannel(channel);
    });
    it('should send IRCODE commands', (done) => {
        const key = 'UP';
        handlers = {
            IRCODE(_, msg) {
                expect(msg).toBe(key);
                done();
            },
        };
        device.sendIrcode(key);
    });
    it('should send KEYBOARD commands', (done) => {
        const key = 'KBDUP';
        handlers = {
            KEYBOARD(_, msg) {
                expect(msg).toBe(key);
                done();
            },
        };
        device.sendKeyboardCode(key);
    });

    afterAll(() => {
        handlers = originalHandlers;
    });
});

describe('teleport', () => {
    it('should fail without a destination', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('MISSING_TELEPORT_NAME');
            done();
        });
        device.teleport('');
    });

    it('should not fail with an invalid destination', (done) => {
        let gotError = false;
        device.once('error', ({ reason }) => {
            gotError = !!reason;
        });

        timeout(4000)
            .then(() => {
                expect(gotError).toBe(false);
                done();
            });
        device.teleport('FOO');
    });

    it('should succeed when going to live tv', (done) => {
        device.once('livetvready', ({ isReady }) => {
            expect(isReady).toBe(true);
            done();
        });
        device.teleport('LIVETV');
    });
});

describe('set channel', () => {
    it('should fail with no channel', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('MISSING_CHANNEL');
            done();
        });
        device.setChannel('');
    });

    it('should fail with a malformed channel', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('MALFORMED_CHANNEL');
            done();
        });
        device.setChannel('-123 1', true);
    });

    it('should fail with a malformed subchannel', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('MALFORMED_CHANNEL');
            done();
        });
        device.setChannel('123 1.2');
    });

    it('should fail with an invalid channel', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('INVALID_CHANNEL');
            done();
        });
        device.setChannel('120', true);
    });

    it('should fail when not in LIVE mode', (done) => {
        device.once('error', ({ reason }) => {
            expect(reason).toBe('NO_LIVE');
            done();
        });
        device.setChannel('119');
    });

    it('should succeed otherwise', (done) => {
        device
            .once('channelchange', ({ success }) => {
                expect(success).toBe(true);
                done();
            });
        device.setChannel('42');
    });
});


afterAll(() =>
    new Promise(
        (resolve, reject) => {
            device.deinit();
            server.close((err) => {
                if (err) reject(err);
                resolve();
            });
        }
    )
);

