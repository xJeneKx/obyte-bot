const mongoose = require('mongoose');

const Users = mongoose.model('Users', {
  chat_id: Number,
  addresses: [String],
  language: String,
});

module.exports = Users;
