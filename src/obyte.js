const myEmitter = require('./events');
const obyte = require('obyte');
const client = new obyte.Client('wss://obyte.org/bb', { reconnect: true });
let _addresses = [];
client.subscribe((err, result) => {
  if (result[0] === 'justsaying' && result[1].subject === 'joint') {
    const messages = result[1].body.unit.messages;
    for (let i in messages) {
      if (messages[i].app === 'payment') {
        const res = messages[i].payload.outputs.find((o) => !!_addresses.includes(o.address));
        if (res) {
          myEmitter.emit('new_payment', { address: res.address });
        }
      }
    }
  }
});

myEmitter.on('init', (addresses) => {
  _addresses = addresses;
  addresses.forEach((address) => {
    client.justsaying('light/new_address_to_watch', address);
  });
});

myEmitter.on('new_address', (address) => {
  if (!_addresses.includes(address)) {
    client.justsaying('light/new_address_to_watch', address);
    _addresses.push(address);
  }
});

setInterval(function () {
  client.api.heartbeat();
}, 10 * 1000);
