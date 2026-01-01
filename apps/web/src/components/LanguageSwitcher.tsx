import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'fi', flag: '🇫🇮', name: 'Suomi' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    // Explicitly save to localStorage to ensure persistence
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(({ code, flag, name }) => (
        <button
          key={code}
          onClick={() => handleLanguageChange(code)}
          className={`text-2xl p-1 rounded transition-opacity hover:opacity-75 ${
            i18n.language === code || i18n.language?.startsWith(code) ? 'opacity-100' : 'opacity-50'
          }`}
          title={name}
          aria-label={`Switch to ${name}`}
        >
          {flag}
        </button>
      ))}
    </div>
  );
}

