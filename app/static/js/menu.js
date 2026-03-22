/* Menu page interactions

Phase 2:
- Remove inline onclick.
- Use event delegation + data-* attributes.

Requires:
- Cart (static/js/cart.js)
- UI (static/js/ui.js)
*/

(function () {
  function scrollCarouselBy(el, direction) {
    if (!el) return;
    const step = Math.max(280, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  function onClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;

    if (action === 'add-to-cart') {
      const id = Number(btn.dataset.itemId);
      const name = btn.dataset.itemName || 'Item';
      const price = Number(btn.dataset.itemPrice);
      if (!Number.isFinite(id) || !Number.isFinite(price)) return;

      Cart.add(id, name, price);
      UI.toast(`${name} added to bag.`);
      return;
    }

    if (action === 'carousel-prev' || action === 'carousel-next') {
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const carousel = document.getElementById(targetId);
      const dir = action === 'carousel-prev' ? -1 : 1;
      scrollCarouselBy(carousel, dir);
      return;
    }
  }

  document.addEventListener('click', onClick);
})();
