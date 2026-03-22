/* UI helpers (toasts, tiny utilities)

DRY: keep UI behavior out of templates.
Accessibility: toasts announce via aria-live.
*/

const UI = (() => {
  function ensureToastContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    // Make sure it's a polite announcer.
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    return el;
  }

  function toast(message, { timeout = 2600 } = {}) {
    const container = ensureToastContainer();

    const toastEl = document.createElement('div');
    toastEl.className = 'toast';

    const msg = document.createElement('div');
    msg.className = 'toast__message';
    msg.textContent = message;

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast__close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';

    let timer = null;
    function dismiss() {
      if (timer) window.clearTimeout(timer);
      toastEl.classList.add('toast--hide');
      toastEl.addEventListener('transitionend', () => toastEl.remove(), { once: true });
      // fallback
      window.setTimeout(() => toastEl.remove(), 220);
    }

    close.addEventListener('click', dismiss);

    toastEl.appendChild(msg);
    toastEl.appendChild(close);
    container.appendChild(toastEl);

    // Animate in
    window.requestAnimationFrame(() => toastEl.classList.add('toast--show'));

    timer = window.setTimeout(dismiss, timeout);
  }

  return { toast };
})();
