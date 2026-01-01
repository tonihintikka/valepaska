import 'i18next';
import type common from './locales/fi/common.json';
import type game from './locales/fi/game.json';
import type ui from './locales/fi/ui.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      game: typeof game;
      ui: typeof ui;
    };
  }
}

