// Runtime fallback to enforce input text visibility on browsers that ignore CSS overrides
export default function attachInputVisibilityFix() {
  if (typeof window === 'undefined') return;

  const getTextColor = () => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--text-clr1');
      return v ? v.trim() : '#FEF9FF';
    } catch (e) {
      return '#FEF9FF';
    }
  };

  const color = getTextColor() || '#FEF9FF';

  const applyStyle = (el) => {
    if (!el) return;
    try {
      el.style.setProperty('color', color, 'important');
      el.style.setProperty('caret-color', color, 'important');
      el.style.setProperty('-webkit-text-fill-color', color, 'important');
    } catch (e) {
      // ignore
    }
  };

  const inputs = () => Array.from(document.querySelectorAll('input, textarea, [contenteditable], select'));

  const onFocus = (e) => applyStyle(e.target);
  const onTouchStart = (e) => applyStyle(e.target);

  const attach = () => {
    inputs().forEach(el => {
      el.removeEventListener('focus', onFocus);
      el.addEventListener('focus', onFocus, { passive: true });
      el.removeEventListener('touchstart', onTouchStart);
      el.addEventListener('touchstart', onTouchStart, { passive: true });
    });
  };

  // Attach initially and after DOM changes
  attach();
  const obs = new MutationObserver(() => attach());
  obs.observe(document.body, { childList: true, subtree: true });

  return () => obs.disconnect();
}
