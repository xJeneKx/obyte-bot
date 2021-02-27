require('./src/db.js');
require('./src/obyte');
const path = require('path');
const myEmitter = require('./src/events');
const fastify = require('fastify');
const { Telegraf, Markup, Scenes, session } = require('telegraf');
const telegrafPlugin = require('fastify-telegraf');
const TelegrafI18n = require('telegraf-i18n');
const { botToken, webhookUrl, secretPath } = require('./src/conf');
const { isValidAddress } = require('obyte/lib/utils');
const { mainMenuKeyboard, languageKeyboard } = require('./src/keyboards');
const addAddressScene = require('./src/scenes/addAddressScene');

const Users = require('./src/models/users.db');

const { match } = TelegrafI18n;
const i18n = new TelegrafI18n({
  defaultLanguage: 'en',
  allowMissing: false,
  directory: path.resolve(__dirname, 'locales'),
});

const stage = new Scenes.Stage([addAddressScene]);

const bot = new Telegraf(botToken);
bot.use(session());
bot.use(i18n.middleware());
bot.use(async (ctx, next) => {
  ctx.user = await Users.findOne({ chat_id: ctx.message.chat.id });
  if (ctx.user && ctx.user.language) {
    ctx.i18n.locale(ctx.user.language);
  }
  await next();
});
bot.use(stage.middleware());

async function getAllAddresses() {
  const addresses = {};
  const users = await Users.find();
  users.forEach((user) => {
    user.addresses.forEach((address) => {
      addresses[address] = 1;
    });
  });
  return Object.keys(addresses);
}

async function start() {
  bot.start(async (ctx) => {
    if (!ctx.user) {
      const user = new Users({ chat_id: ctx.message.chat.id });
      await user.save();
    }
    await ctx.reply(ctx.i18n.t('choose language'), languageKeyboard());
  });
  bot.help((ctx) => ctx.reply(ctx.i18n.t('what_do_you_want_to_do'), mainMenuKeyboard(ctx)));

  bot.command('language', (ctx) => {
    ctx.reply(ctx.i18n.t('choose language'), languageKeyboard());
  });
  bot.hears('Русский', async (ctx) => {
    ctx.user.language = 'ru';
    await ctx.user.save();

    ctx.i18n.locale('ru');
    ctx.reply('Что вы хотите сделать?', mainMenuKeyboard(ctx));
  });
  bot.hears('English', async (ctx) => {
    ctx.user.language = 'en';
    await ctx.user.save();

    ctx.i18n.locale('en');
    ctx.reply('What do you want to do?', mainMenuKeyboard(ctx));
  });

  bot.hears(match('add_address'), (ctx) => {
    ctx.scene.enter('addAddressScene');
  });

  bot.hears(match('my_addresses'), (ctx) => {
    ctx.reply(ctx.i18n.t('your_addresses') + ctx.user.addresses.join('\n'));
  });

  bot.hears(match('remove_address'), (ctx) => {
    ctx.reply(
      ctx.i18n.t('select_address'),
      Markup.keyboard([...ctx.user.addresses, ctx.i18n.t('back')])
    );
  });

  bot.hears(match('back'), (ctx) => {
    ctx.reply(ctx.i18n.t('what_do_you_want_to_do'), mainMenuKeyboard(ctx));
  });

  bot.on('text', async (ctx) => {
    if (isValidAddress(ctx.message.text)) {
      const index = ctx.user.addresses.findIndex((v) => v === ctx.message.text);
      if (index !== -1) {
        ctx.user.addresses.splice(index, 1);
        ctx.user.markModified('addresses');
        await ctx.user.save();
      }
      await ctx.reply(ctx.i18n.t('address_deleted'), mainMenuKeyboard(ctx));
    }
  });

  const addresses = await getAllAddresses();
  myEmitter.emit('init', addresses);
}

myEmitter.on('new_payment', async (obj) => {
  const users = await Users.find({ addresses: obj.address });
  for (let k in users) {
    const user = users[k];
    await bot.telegram.sendMessage(
      user.chat_id,
      i18n.t(user.language, 'new_payment', { address: obj.address })
    );
  }
});

start().catch(console.error);

const app = fastify();
app.register(telegrafPlugin, { bot, path: secretPath });
bot.telegram.setWebhook(webhookUrl).then(() => {
  console.log('Webhook is set on', webhookUrl);
});

app.listen(7841).then(() => {
  console.log('Listening on port', 7841);
});
