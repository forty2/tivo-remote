import { EventEmitter } from 'events';

import MessageSocket from 'message-socket';

const debug = require('debug')('tivo-remote:conn');

class TiVoRemote extends EventEmitter {
    constructor(service) {
        super();

        this._friendlyName = service.name;
        this._tsn          = service.txtRecord.TSN;
        this._ip           = service.addresses[0];

        const socket = this._socket =
            new MessageSocket(this._ip, service.port, /.*\r/);

        socket
            .asObservable()
            .subscribe(::this._handleIncoming);
    }

    sendIrcode(code) {
        this._sendTiVoCommand('IRCODE', code)
    }

    sendKeyboardCode(code) {
        this._sendTiVoCommand('KEYBOARD', code)
    }

    teleport(destination) {
        this._sendTiVoCommand('TELEPORT', destination)
    }

    setChannel(channel, forced = false) {
        this._sendTiVoCommand(forced ? 'FORCCH': 'SETCH', channel)
    }

    deinit() {
        this._socket.close();
    }

    _sendTiVoCommand(cmd, args) {
        this._socket.send(`${cmd} ${args}\r`);
    }

    _handleIncoming(response) {
        debug(`Incoming: ${response}`);
        if (typeof response === 'undefined') return;

        response = response.replace(/\r$/, '');

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
            let [,reason] = match;
            this.emit('error', { reason: response });
        } else if (response === 'LIVETV_READY') {
            this.emit('livetvready', { isReady: true });
        } else if ((match = response.match(/^CH_STATUS (\d{1,4}) (?:(\d{1,4}) )?([a-zA-Z_-]+)$/))) {
            let [, channel, subchannel, reason] = match;
            this.emit('channelchange', { success: true, channel, subchannel, reason });
        }
    }

    get name() {
        return this._friendlyName;
    }

    get id() {
        return this._tsn;
    }

    get ip() {
        return this._ip;
    }
}

export {
    TiVoRemote as default
}

