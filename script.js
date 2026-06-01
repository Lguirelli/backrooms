document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const hero = document.getElementById('heroCard');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.addEventListener('mousemove', (event) => {
    if (!hero) return;

    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    hero.style.setProperty('--mx', `${Math.max(0, Math.min(100, x))}%`);
    hero.style.setProperty('--my', `${Math.max(0, Math.min(100, y))}%`);
  });

  const onScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    root.style.setProperty('--grid-y', `${progress * 180}px`);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const possibilityFrame = document.getElementById('possibilityFrame');
  const possibilitySlides = possibilityFrame ? Array.from(possibilityFrame.querySelectorAll('.possibility-slide')) : [];
  const possibilityCounter = document.getElementById('possibilityCounter');
  const possibilityTitle = document.getElementById('possibilityTitle');
  const possibilityText = document.getElementById('possibilityText');

  if (possibilitySlides.length) {
    let activeIndex = 0;

    const updatePossibilitySlide = (index) => {
      possibilitySlides.forEach((slide, slideIndex) => {
        slide.classList.toggle('is-active', slideIndex === index);
      });

      const activeSlide = possibilitySlides[index];

      if (possibilityCounter) {
        possibilityCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(possibilitySlides.length).padStart(2, '0')}`;
      }

      if (possibilityTitle) {
        possibilityTitle.textContent = activeSlide.dataset.title || '';
      }

      if (possibilityText) {
        possibilityText.textContent = activeSlide.dataset.desc || '';
      }
    };

    const nextSlide = () => {
      activeIndex = (activeIndex + 1) % possibilitySlides.length;
      updatePossibilitySlide(activeIndex);
    };

    updatePossibilitySlide(activeIndex);

    // Automático sempre. Não pausa no hover para evitar falha em desktop/mobile.
    window.setInterval(nextSlide, prefersReducedMotion ? 6200 : 3200);
  }
});

document.documentElement.classList.add('is-ready');
