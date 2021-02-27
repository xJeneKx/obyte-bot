require('dotenv').config();

if (!process.env.BOT_TOKEN) {
  throw new Error('required BOT_TOKEN');
}

module.exports = {
  dbPath: process.env.DB_PATH || 'mongodb://localhost:27017/obyte_bot',
  botToken: process.env.BOT_TOKEN,
  webhookUrl: process.env.WEBHOOK_URL,
  secretPath: process.env.SECRET_PATH,
  dev: !!process.env.dev,
};
