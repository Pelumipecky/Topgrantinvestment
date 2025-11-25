import { useEffect } from 'react';

const SCRIPT_ID = 'google-translate-script';
const WIDGET_CONTAINER_ID = 'google_translate_element';

const TranslateWidget = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initTranslate = () => {
      if (window.google?.translate?.TranslateElement) {
        if (window.__grantUnionTranslator) return;
        window.__grantUnionTranslator = new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,pt,it,ar,zh-CN,hi',
          },
          WIDGET_CONTAINER_ID
        );
      }
    };

    window.initGrantUnionTranslate = initTranslate;

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if (window.google?.translate) initTranslate();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=initGrantUnionTranslate';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.removeEventListener?.('load', initTranslate);
    };
  }, []);

  return (
    <div className="translate-widget">
      <span>Language:</span>
      <div id={WIDGET_CONTAINER_ID} className="google-translate-container"></div>
    </div>
  );
};

export default TranslateWidget;
