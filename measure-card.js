// Script to measure card and viewport dimensions
console.log('=== VIEWPORT MEASUREMENTS ===');
console.log('Viewport width:', window.innerWidth + 'px');
console.log('Viewport height:', window.innerHeight + 'px');
console.log('Document width:', document.documentElement.scrollWidth + 'px');

console.log('\n=== CARD MEASUREMENTS ===');
const cards = document.querySelectorAll('[data-testid="card"], .card, [class*="Card"]');
if (cards.length > 0) {
  const card = cards[0];
  const rect = card.getBoundingClientRect();
  console.log('Card width:', rect.width + 'px');
  console.log('Card height:', rect.height + 'px');
  console.log('Card computed styles:', window.getComputedStyle(card).width);
} else {
  console.log('No cards found, searching for menu cards...');
  const menuCards = document.querySelectorAll('[class*="cursor-pointer"]');
  if (menuCards.length > 0) {
    const card = menuCards[0];
    const rect = card.getBoundingClientRect();
    console.log('Menu card width:', rect.width + 'px');
    console.log('Menu card height:', rect.height + 'px');
  }
}

console.log('\n=== CONTAINER MEASUREMENTS ===');
const containers = document.querySelectorAll('.max-w-2xl, .max-w-xl, .max-w-3xl');
containers.forEach((container, index) => {
  const rect = container.getBoundingClientRect();
  console.log(`Container ${index + 1} width:`, rect.width + 'px');
  console.log(`Container ${index + 1} max-width class:`, container.className.match(/max-w-\w+/)?.[0] || 'none');
});
