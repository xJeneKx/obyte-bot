const { Markup } = require('telegraf');

function mainMenuKeyboard(ctx) {
  return Markup.keyboard([
    ctx.i18n.t('my_addresses'),
    ctx.i18n.t('add_address'),
    ctx.i18n.t('remove_address'),
  ]);
}

function languageKeyboard() {
  return Markup.keyboard([['Русский', 'English']])
    .oneTime()
    .resize();
}

module.exports = {
  mainMenuKeyboard,
  languageKeyboard,
};
