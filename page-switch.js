(function () {
  const pages = [
    { href: 'index.html', label: 'PAGE 01' },
    { href: 'second.html', label: 'PAGE 02' }
  ];

  const currentPath = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const currentIndex = currentPath === 'second.html' ? 1 : 0;

  function goTo(index) {
    const next = pages[(index + pages.length) % pages.length];
    location.href = next.href;
  }

  function bindEditionSwitchBlocks() {
    const triggers = document.querySelectorAll('[data-edition-target]');
    triggers.forEach((node) => {
      node.addEventListener('click', (event) => {
        const target = node.getAttribute('data-edition-target');
        if (!target) return;
        event.preventDefault();
        location.href = target;
      });
    });
  }

  function renderNavigator() {
    const wrap = document.createElement('aside');
    wrap.className = 'page-switch-nav';
    wrap.setAttribute('aria-label', 'Page switch navigation');
    wrap.innerHTML = `
      <div class="page-switch-row">
        <button class="page-switch-btn" type="button" data-go="prev" aria-label="Go previous page">PREV</button>
        <div class="page-switch-status">
          <span class="page-switch-dot ${currentIndex === 0 ? 'active' : ''}"></span>
          <span class="page-switch-dot ${currentIndex === 1 ? 'active' : ''}"></span>
          <span class="page-switch-label">${pages[currentIndex].label}</span>
        </div>
        <button class="page-switch-btn" type="button" data-go="next" aria-label="Go next page">NEXT</button>
      </div>
      <p class="page-switch-hint">Shortcut: Arrow Left/Right or N/P</p>
    `;

    document.body.appendChild(wrap);

    wrap.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-go]');
      if (!btn) return;
      if (btn.dataset.go === 'next') goTo(currentIndex + 1);
      if (btn.dataset.go === 'prev') goTo(currentIndex - 1);
    });
  }

  function renderToast() {
    if (sessionStorage.getItem('page_switch_tip_seen') === '1') return;

    const toast = document.createElement('div');
    toast.className = 'page-switch-toast';
    toast.textContent = 'Tip: Use NEXT/PREV, cover image, or Arrow Left/Right to switch pages.';
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3300);

    sessionStorage.setItem('page_switch_tip_seen', '1');
  }

  function bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const tag = (event.target && event.target.tagName) ? event.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === 'ArrowRight' || key === 'n') {
        event.preventDefault();
        goTo(currentIndex + 1);
      }

      if (event.key === 'ArrowLeft' || key === 'p') {
        event.preventDefault();
        goTo(currentIndex - 1);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindEditionSwitchBlocks();
    renderNavigator();
    renderToast();
    bindKeyboard();
  });
})();
