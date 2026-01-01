import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fiCommon from './locales/fi/common.json';
import fiGame from './locales/fi/game.json';
import fiUi from './locales/fi/ui.json';
import enCommon from './locales/en/common.json';
import enGame from './locales/en/game.json';
import enUi from './locales/en/ui.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fi: {
        common: fiCommon,
        game: fiGame,
        ui: fiUi,
      },
      en: {
        common: enCommon,
        game: enGame,
        ui: enUi,
      },
    },
    fallbackLng: 'fi',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Keys to lookup language from
      lookupLocalStorage: 'i18nextLng',
      // Cache user language
      caches: ['localStorage'],
    },
  });

export default i18n;

