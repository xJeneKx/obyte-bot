const myEmitter = require('./events');
const obyte = require('obyte');
const client = new obyte.Client('wss://obyte.org/bb', { reconnect: true });
let _addresses = [];
const units = {}; // Protection against repeated notifications if both addresses are in the bot

client.subscribe((err, result) => {
  if (result[0] === 'justsaying' && result[1].subject === 'joint') {
    if (units[result[1].body.unit.unit]) return;
    units[result[1].body.unit.unit] = Date.now();

    const messages = result[1].body.unit.messages;
    const authors = result[1].body.unit.authors.map((a) => a.address);
    for (let i in messages) {
      if (messages[i].app === 'payment') {
        let res = messages[i].payload.outputs.filter((o) => !!_addresses.includes(o.address));
        res = res.filter((o) => !authors.includes(o.address));
        res.forEach((r) => {
          myEmitter.emit('new_payment', { address: r.address });
        });
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

setInterval(() => {
  const dn = Date.now();
  for (let k in units) {
    if (units[k] + 60000 < dn) {
      delete units[k];
    }
  }
}, 60000);
