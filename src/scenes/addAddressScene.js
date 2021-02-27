const { Markup, Scenes } = require('telegraf');
const { mainMenuKeyboard } = require('../keyboards');
const { match } = require('telegraf-i18n');
const myEmitter = require('../events');
const { isValidAddress } = require('obyte/lib/utils');

const addAddressScene = new Scenes.BaseScene('addAddressScene');
addAddressScene.enter((ctx) =>
  ctx.reply(ctx.i18n.t('please_send_address'), Markup.keyboard([ctx.i18n.t('back')]))
);
addAddressScene.hears(match('back'), async (ctx) => {
  await ctx.reply(ctx.i18n.t('what_do_you_want_to_do'), mainMenuKeyboard(ctx));
  await ctx.scene.leave();
});
addAddressScene.on('text', async (ctx) => {
  if (isValidAddress(ctx.message.text)) {
    if (!ctx.user.addresses.includes(ctx.message.text)) {
      ctx.user.addresses.push(ctx.message.text);
      ctx.user.markModified('addresses');
      await ctx.user.save();
    }
    myEmitter.emit('new_address', ctx.message.text);
    await ctx.reply(ctx.i18n.t('address_added_successfully'), mainMenuKeyboard(ctx));
    await ctx.scene.leave();
  } else {
    await ctx.reply(ctx.i18n.t('incorrect_address'));
  }
});

module.exports = addAddressScene;
