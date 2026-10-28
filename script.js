if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

window.addEventListener('pageshow', () => {
  if (!window.location.hash) window.scrollTo(0, 0);
});

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

const revealTargets = document.querySelectorAll('.intro-grid, .values-strip, .meaning-card, .section-heading, .feature-card, .feature-emblem, .season-content, .gallery-item, .moments-heading, .join-life, .join-life-item, .contact > *');
revealTargets.forEach((element) => {
  element.classList.add('reveal');
  if (element.matches('.feature-card, .gallery-item, .join-life-item, .meaning-card')) {
    const siblingIndex = Array.from(element.parentElement.children).indexOf(element);
    element.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 5) * 160}ms`);
  }
});

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

const playVideo = (video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('playsinline', '');
  const attempt = video.play();
  if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
};

loopVideos.forEach((video) => {
  video.muted = true;
  video.addEventListener('loadeddata', () => playVideo(video));
  video.addEventListener('canplay', () => {
    if (video.dataset.visible !== 'false') playVideo(video);
  });
  playVideo(video);
});

if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      video.dataset.visible = String(entry.isIntersecting);
      if (entry.isIntersecting) {
        playVideo(video);
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.15, rootMargin: '120px 0px' });

  loopVideos.forEach((video) => videoObserver.observe(video));
}

/* Algunos navegadores bloquean el autoplay hasta el primer gesto del usuario */
['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach((type) => {
  window.addEventListener(type, () => {
    loopVideos.forEach((video) => {
      if (video.paused && video.dataset.visible !== 'false') playVideo(video);
    });
  }, { once: true, passive: true });
});

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

/* Visor de fotos y videos */
const lightboxLinks = Array.from(document.querySelectorAll('a[data-lightbox]'));

if (lightboxLinks.length && typeof HTMLDialogElement === 'function') {
  const dialog = document.createElement('dialog');
  dialog.className = 'lightbox';
  dialog.setAttribute('aria-label', 'Visor de galería');
  dialog.innerHTML = `
    <button class="lightbox-btn lightbox-close" type="button" aria-label="Cerrar visor">✕</button>
    <button class="lightbox-btn lightbox-prev" type="button" aria-label="Anterior">←</button>
    <figure class="lightbox-figure">
      <div class="lightbox-media"></div>
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button class="lightbox-btn lightbox-next" type="button" aria-label="Siguiente">→</button>`;
  document.body.appendChild(dialog);

  const mediaBox = dialog.querySelector('.lightbox-media');
  const caption = dialog.querySelector('.lightbox-caption');
  let current = 0;
  let lastFocused = null;

  const show = (index) => {
    current = (index + lightboxLinks.length) % lightboxLinks.length;
    const link = lightboxLinks[current];
    const href = link.getAttribute('href');
    const label = link.dataset.caption || '';
    mediaBox.textContent = '';

    if (link.dataset.type === 'video') {
      const video = document.createElement('video');
      video.src = href;
      video.controls = false;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.poster = link.querySelector('video')?.getAttribute('poster') || '';
      mediaBox.appendChild(video);
    } else {
      const image = document.createElement('img');
      image.src = href;
      image.alt = link.querySelector('img')?.alt || label;
      mediaBox.appendChild(image);
    }

    caption.textContent = '';
    if (lightboxLinks.length > 1) {
      const count = document.createElement('span');
      count.className = 'lightbox-count';
      count.textContent = `${current + 1} / ${lightboxLinks.length}`;
      caption.appendChild(count);
    }
    caption.appendChild(document.createTextNode(label));
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.classList.toggle('lightbox-solo', lightboxLinks.length < 2);

  lightboxLinks.forEach((link, index) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      lastFocused = link;
      show(index);
      dialog.showModal();
      document.body.classList.add('lightbox-open');
    });
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', close);
  dialog.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
  dialog.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(current - 1);
    if (event.key === 'ArrowRight') show(current + 1);
  });

  dialog.addEventListener('close', () => {
    mediaBox.textContent = '';
    document.body.classList.remove('lightbox-open');
    if (lastFocused) lastFocused.focus();
  });
}
