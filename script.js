const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
  nav.classList.toggle('is-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menú');
    nav.classList.remove('is-open');
  });
});

document.querySelector('#year').textContent = new Date().getFullYear();

const revealTargets = document.querySelectorAll('.intro-grid, .values-strip, .meaning-card, .section-heading, .feature-card, .feature-emblem, .season-content, .gallery-item, .contact > *');
revealTargets.forEach((element) => element.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach((element) => observer.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
}

const loopVideos = document.querySelectorAll('[data-loop-video]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !reduceMotion) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25, rootMargin: '80px 0px' });

  loopVideos.forEach((video) => videoObserver.observe(video));
}

const copyAccountButton = document.querySelector('[data-copy-account]');
const donationAccountNumber = document.querySelector('#donation-account-number');
const donationCopyFeedback = document.querySelector('#donation-copy-feedback');

if (copyAccountButton && donationAccountNumber && donationCopyFeedback) {
  copyAccountButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(donationAccountNumber.textContent.trim());
      donationCopyFeedback.textContent = 'Número de cuenta copiado';
    } catch {
      donationCopyFeedback.textContent = 'Selecciona el número de cuenta para copiarlo';
    }
  });
}
