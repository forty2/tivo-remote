# tivo-remote
> Control your TiVo DVR over the network

[![NPM Version][npm-image]][npm-url]
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

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
import TiVoDiscovery from './index';

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

### Commands

#### sendIrcode(key)
#### sendKeyboardCode(key)
These commands send key codes to the DVR.  Many codes are supported by both `sendIrcode()` and `sendKeyboardCode()`, but some codes are only supported by `sendKeyboardCode()`.  For details, see [KEYS](KEYS.md)

#### teleport(destination)
Supported teleport destinations are:
 * TIVO
 * LIVETV
 * GUIDE
 * NOWPLAYING

#### setChannel(channel, forced = false)
Tune the DVR to the given channel.  If the forced flag is set, the DVR will be tuned even if a recording is in progress (canceling the recording).

#### deinit()
Once you're finished with the device object, call deinit() to close the underlying network connection.

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

## Release History

* 1.0.0
    * The first release.

## Meta

Zach Bean – zb@forty2.com

Distributed under the MIT license. See [LICENSE](LICENSE.md) for more detail.

[npm-image]: https://img.shields.io/npm/v/tivo-remote.svg?style=flat
[npm-url]: https://npmjs.org/package/tivo-remote
