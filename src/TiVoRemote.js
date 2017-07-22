/* eslint-disable flowtype/no-types-missing-file-annotation */

import events from 'events';

import MessageSocket from 'message-socket';

import type { Ircode, KeyboardCode } from './KeyTypes';

const debug = require('debug')('tivo-remote:conn');

const { EventEmitter } = events;

const $friendlyName = new WeakMap();
const $tsn          = new WeakMap();
const $ip           = new WeakMap();
const $socket       = new WeakMap();

function sendTiVoCommand(cmd, args) {
    $socket.get(this).send(`${cmd} ${args}\r`);
}

function handleIncoming(resp) {
    debug(`Incoming: ${resp}`);
    if (typeof resp === 'undefined') return;

    const response = resp.replace(/\r$/, '');

    // possible response messages:
    /*
        * INVALID_COMMAND : couldn't parse the last command you sent. TODO: where to publish this?
        * MISSING_TELEPORT_NAME : you tried to teleport, but left out the name
        * LIVETV_READY : you teleported to LIVETV, and it's now ready for further commands
        * CH_STATUS num num reason : channel status
        * CH_FAILED reason : channel change failed
        *
        * per v1.1 protocol doc, no other responses are sent.
        */

    let match;
    if (response === 'MISSING_TELEPORT_NAME') {
        this.emit('error', { reason: response });
    } else if ((match = response.match(/^CH_FAILED ([a-zA-Z_-]+)$/))) {
        const [, reason] = match;
        this.emit('error', { reason });
    } else if (response === 'LIVETV_READY') {
        this.emit('livetvready', { isReady: true });
    } else if ((match = response.match(/^CH_STATUS (\d{1,4}) (?:(\d{1,4}) )?([a-zA-Z_-]+)$/))) {
        const [, channel, subchannel, reason] = match;
        this.emit('channelchange', { success: true, channel, subchannel, reason });
    }
}

/**
  */
type TeleportDestination = "TIVO" | "LIVETV" | "GUIDE" | "NOWPLAYING";

/**
 */
class TiVoRemote extends EventEmitter {
    constructor(
        service: {
            name: string,
            txtRecord: { TSN: string },
            addresses: string[],
            port: number
        }
    ) {
        super();

        $friendlyName.set(this, service.name);
        $tsn.set(this, service.txtRecord.TSN);
        $ip.set(this, service.addresses[0]);

        const socket = new MessageSocket($ip.get(this), service.port, /.*\r/);
        $socket.set(this, socket);

        socket
            .asObservable()
            .subscribe((...args) => {
                /* eslint-disable flowtype-errors/show-errors */
                this::handleIncoming(...args);
                /* eslint-enable flowtype-errors/show-errors */
            });
    }

    /**
     * Send an IR code to the DVR. The list of supported codes
     * is very long; For details, see [Ircode](KEYS.md#ircode)
     */
    sendIrcode(code: Ircode) {
        this::sendTiVoCommand('IRCODE', code);
    }

    /**
     * Send a key code to the DVR. The list of supported codes
     * is very long; For details, see [KeyboardCode](KEYS.md#keyboardcode)
     */
    sendKeyboardCode(code: KeyboardCode) {
        this::sendTiVoCommand('KEYBOARD', code);
    }

    /**
     * "Teleport" to a given location in the DVR UI.
     */
    teleport(destination: TeleportDestination) {
        this::sendTiVoCommand('TELEPORT', destination);
    }

    /**
     * Tune the DVR to the given channel.  If the forced flag is set,
     * the DVR will be tuned even if a recording is in progress
     * (canceling the recording).
     */
    setChannel(channel: string, forced: ?boolean = false) {
        this::sendTiVoCommand(forced ? 'FORCECH' : 'SETCH', channel);
    }

    /**
     * Once you're finished with the device object, call deinit() to close
     * the underlying network connection.
     */
    deinit() {
        $socket.get(this).close();
    }

    /**
     * The name of this device.
     */
    get name(): string {
        return $friendlyName.get(this);
    }

    /**
     * The unique ID of this device.
     */
    get id(): string {
        return $tsn.get(this);
    }

    /**
     * The IP address of this device.
     */
    get ip(): string {
        return $ip.get(this);
    }
}

export {
    TiVoRemote as default,
};

