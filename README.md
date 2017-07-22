# tivo-remote

> Control your TiVo DVR over the network

[![Generated with nod](https://img.shields.io/badge/generator-nod-2196F3.svg?style=flat-square)](https://github.com/diegohaz/nod)
[![NPM version](https://img.shields.io/npm/v/tivo-remote.svg?style=flat-square)](https://npmjs.org/package/tivo-remote)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Build Status](https://img.shields.io/travis/forty2/tivo-remote/master.svg?style=flat-square)](https://travis-ci.org/forty2/tivo-remote) [![Coverage Status](https://img.shields.io/codecov/c/github/forty2/tivo-remote/master.svg?style=flat-square)](https://codecov.io/gh/forty2/tivo-remote/branch/master)

`tivo-remote` is a Node.js library that allows you to control your TiVo DVR over your local network.  It's especially useful for integrating into a home automation system.

## Getting Started

tivo-remote is distributed through NPM:

```sh
npm install tivo-remote

# or, if you prefer:
yarn add tivo-remote
```

## Examples

`tivo-remote` provides both discovery and control capabilities. To monitor the local network for TiVo devices, try something like this:

```javascript
import TiVoDiscovery from 'tivo-remote';

TiVoDiscovery
    .on('founddevice', (device) => {
        console.log(`Found a device: ${device.name} (${device.ip})`);
    })
    .on('lostdevice', (device) => {
        console.log(`Lost a device: ${device.name} (${device.ip})`);
    })
    .discover();
```

Once you have a device object, you have a number of control commands at your disposal:

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### TeleportDestination

Type: (`"TIVO"` \| `"LIVETV"` \| `"GUIDE"` \| `"NOWPLAYING"`)

### TiVoRemote

**Extends EventEmitter**

**Parameters**

-   `service` **{name: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), txtRecord: {TSN: [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)}, addresses: [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>, port: [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)}** 

#### sendIrcode

Send an IR code to the DVR. The list of supported codes
is very long; For details, see [Ircode](KEYS.md#ircode)

**Parameters**

-   `code` **Ircode** 

#### sendKeyboardCode

Send a key code to the DVR. The list of supported codes
is very long; For details, see [KeyboardCode](KEYS.md#keyboardcode)

**Parameters**

-   `code` **KeyboardCode** 

#### teleport

"Teleport" to a given location in the DVR UI.

**Parameters**

-   `destination` **[TeleportDestination](#teleportdestination)** 

#### setChannel

Tune the DVR to the given channel.  If the forced flag is set,
the DVR will be tuned even if a recording is in progress
(canceling the recording).

**Parameters**

-   `channel` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `forced` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?**  (optional, default `false`)

#### deinit

Once you're finished with the device object, call deinit() to close
the underlying network connection.

#### name

The name of this device.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

#### id

The unique ID of this device.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

#### ip

The IP address of this device.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## Migration

### 1.0 -> 2.0

The difference between 1.0 and 2.0 shouldn't be noticeable to most users, even though it is technically an API break.  Version 1.0 exposed a module compiled with Babel such that it was necessary to use
```js
const TiVoDiscovery = require('tivo-remote').default
```
if the including project was not also compiled with Babel.  Version 2.0 resolves this so both `import` and `require` work as their respective users expect.

## Compatibility

`tivo-remote` is built to support Node.js version 6.0 or higher.

## Contributing

Contributions are of course always welcome.  If you find problems, please report them in the [Issue Tracker](http://www.github.com/forty2/tivo-remote/issues/).  If you've made an improvement, open a [pull request](http://www.github.com/forty2/tivo-remote/pulls).

Getting set up for development is very easy:

```sh
git clone <your fork>
cd tivo-remote
yarn
```

And the development workflow is likewise straightforward:

```sh
# make a change to the src/ file, then...
yarn build
node dist/example.js

# or if you want to clean up all the leftover build products:
yarn run clean
```

## License

MIT © [Zach Bean](https://github.com/forty2). See [LICENSE](LICENSE.md) for more detail.

[npm-image]: https://img.shields.io/npm/v/tivo-remote.svg?style=flat

[npm-url]: https://npmjs.org/package/tivo-remote
