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

  if (!prefersReducedMotion) {
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      root.style.setProperty('--grid-y', `${progress * 180}px`);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const possibilityFrame = document.getElementById('possibilityFrame');
  const possibilitySlides = possibilityFrame ? Array.from(possibilityFrame.querySelectorAll('.possibility-slide')) : [];
  const possibilityCounter = document.getElementById('possibilityCounter');
  const possibilityTitle = document.getElementById('possibilityTitle');
  const possibilityText = document.getElementById('possibilityText');

  if (possibilitySlides.length) {
    let activeIndex = 0;
    let intervalId = null;

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

    // Mantém fade ativo por padrão. Reduced motion apenas aumenta o intervalo.
    const fadeInterval = prefersReducedMotion ? 6500 : 3200;
    intervalId = window.setInterval(nextSlide, fadeInterval);

    possibilityFrame.addEventListener('mouseenter', () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    });

    possibilityFrame.addEventListener('mouseleave', () => {
      if (!intervalId) {
        intervalId = window.setInterval(nextSlide, fadeInterval);
      }
    });
  }
});
