const mongoose = require('mongoose');
const conf = require('./conf');

mongoose.connect(conf.dbPath, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
