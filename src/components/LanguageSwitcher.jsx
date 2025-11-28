import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Show language switcher on page load and hide after 5 seconds
  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  // If user interacts with it, keep it visible
  const handleInteraction = () => {
    setIsVisible(true);
    // Reset the timer
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.languageSwitcher}>
      <button
        className={styles.languageButton}
        onClick={() => {
          handleInteraction();
          setIsOpen(!isOpen);
        }}
        aria-label="Change language"
      >
        <span className={styles.flag}>{currentLanguage.flag}</span>
        <span className={styles.langCode}>{currentLanguage.code.toUpperCase()}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`${styles.dropdownItem} ${i18n.language === lang.code ? styles.active : ''}`}
              onClick={() => {
                changeLanguage(lang.code);
                handleInteraction();
              }}
            >
              <span className={styles.flag}>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;