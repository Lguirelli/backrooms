const root = document.documentElement;
const hero = document.getElementById('heroCard');

window.addEventListener('mousemove', (event) => {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  hero.style.setProperty('--mx', `${Math.max(0, Math.min(100, x))}%`);
  hero.style.setProperty('--my', `${Math.max(0, Math.min(100, y))}%`);
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--fog-y', `${progress * -260}px`);
    root.style.setProperty('--grid-y', `${progress * 180}px`);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
