(() => {
  const client = window.kingdomSupabase;
  const feed = document.querySelector('[data-announcement-feed]');
  const dialog = document.querySelector('#announcement-dialog');
  const detail = document.querySelector('#announcement-detail');
  if (!feed || !dialog || !detail) return;
  const dialogPanel = dialog.querySelector('.announcement-dialog-panel');

  const fallbackAnnouncement = {
    title: 'The Kingdom | Comunicado Oficial',
    excerpt: 'Compartimos nuestra historia, el origen de nuestro nombre y el camino que estamos construyendo como comunidad musical. Gracias por acompañarnos.',
    content: '',
    image_url: 'public/images/comunicado-oficial-2026.jpg',
    image_alt: 'Comunicado oficial de The Kingdom a su comunidad.',
    published_at: '2026-10-25T12:00:00-06:00',
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const imageUrlFor = (value) => /^https?:\/\//i.test(value)
    ? value
    : new URL(value, window.location.href).href;
  const formatDate = (value) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime())
      ? 'Fecha no disponible'
      : new Intl.DateTimeFormat('es-SV', { dateStyle: 'long' }).format(date);
  };

  const makeCard = (post) => {
    const article = make('article', 'announcement-card reveal');
    const openButton = make('button', 'announcement-card-open');
    openButton.type = 'button';
    openButton.setAttribute('aria-label', `Abrir comunicado: ${post.title}`);

    const visual = make('div', 'announcement-card-visual');
    if (post.image_url) {
      const image = make('img');
      image.src = imageUrlFor(post.image_url);
      image.alt = post.image_alt || `Imagen del comunicado ${post.title}`;
      image.loading = 'lazy';
      visual.append(image);
    } else {
      visual.append(make('span', 'announcement-card-placeholder', 'THE KINGDOM'));
    }

    const body = make('div', 'announcement-card-body');
    const date = make('time', 'announcement-card-date', formatDate(post.published_at));
    date.dateTime = post.published_at || '';
    body.append(date, make('h2', 'announcement-card-title', post.title));
    if (post.excerpt) body.append(make('p', 'announcement-card-excerpt', post.excerpt));
    body.append(make('span', 'announcement-card-more', 'Leer comunicado ↗'));
    openButton.append(visual, body);
    openButton.addEventListener('click', () => openAnnouncement(post));
    article.append(openButton);
    return article;
  };

  const makeDetail = (post) => {
    const article = make('article', 'social-post announcement-detail');
    const header = make('header', 'social-post-header');
    const avatar = make('img', 'social-post-avatar');
    avatar.src = 'public/images/crown-menu-icon.png';
    avatar.alt = '';
    avatar.setAttribute('aria-hidden', 'true');

    const author = make('div', 'social-post-author');
    author.append(make('h2', '', 'The Kingdom'));
    const dateLine = make('p', '', 'Comunicado oficial · ');
    const time = make('time');
    time.dateTime = post.published_at || '';
    time.textContent = formatDate(post.published_at);
    dateLine.append(time);
    author.append(dateLine);
    header.append(avatar, author, make('span', 'official-badge', 'Oficial'));
    article.append(header);

    const content = make('div', 'announcement-detail-content');
    const title = make('h2', '', post.title);
    title.id = 'announcement-dialog-heading';
    content.append(title);
    if (post.excerpt) content.append(make('p', 'social-post-caption', post.excerpt));
    if (post.image_url) {
      const media = make('div', 'social-post-media announcement-detail-media');
      const image = make('img', 'announcement-detail-image');
      image.src = imageUrlFor(post.image_url);
      image.alt = post.image_alt || `Imagen del comunicado ${post.title}`;
      image.loading = 'eager';
      const zoomButton = make('button', 'announcement-detail-image-toggle');
      zoomButton.type = 'button';
      zoomButton.setAttribute('aria-label', 'Ampliar imagen del comunicado');
      zoomButton.setAttribute('aria-pressed', 'false');
      const zoomLabel = make('span', 'announcement-image-zoom-label', '⛶ Ampliar imagen');
      zoomButton.append(image, zoomLabel);
      zoomButton.addEventListener('click', () => {
        const isZoomed = dialogPanel.classList.toggle('is-zoomed');
        zoomButton.setAttribute('aria-pressed', String(isZoomed));
        zoomButton.setAttribute('aria-label', isZoomed ? 'Reducir imagen y volver al comunicado' : 'Ampliar imagen del comunicado');
        zoomLabel.textContent = isZoomed ? '↙ Volver al comunicado' : '⛶ Ampliar imagen';
      });
      media.append(zoomButton);
      content.append(media);
    }
    if (post.content) content.append(make('p', 'announcement-detail-full-text', post.content));
    article.append(content);

    const actions = make('footer', 'social-post-actions');
    actions.setAttribute('aria-label', 'Redes de The Kingdom');
    const instagram = make('a', '', '◎ Instagram');
    instagram.href = 'https://www.instagram.com/thekingdom_es/';
    instagram.target = '_blank';
    instagram.rel = 'noopener noreferrer';
    const tiktok = make('a', '', '♪ TikTok');
    tiktok.href = 'https://www.tiktok.com/@the.kingdomc';
    tiktok.target = '_blank';
    tiktok.rel = 'noopener noreferrer';
    actions.append(instagram, tiktok);
    article.append(actions);
    return article;
  };

  const openAnnouncement = (post) => {
    dialogPanel.classList.remove('is-zoomed');
    detail.replaceChildren(makeDetail(post));
    dialog.showModal();
    document.body.classList.add('announcement-dialog-open');
  };

  const render = (posts) => {
    if (!posts.length) {
      feed.replaceChildren(make('p', 'empty-announcements', 'Pronto publicaremos nuevos comunicados.'));
      return;
    }
    const cards = posts.map(makeCard);
    feed.replaceChildren(...cards);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      cards.forEach((card) => card.classList.add('is-visible'));
    }));
  };

  let hasRendered = false;
  const load = async () => {
    if (!client) {
      if (!hasRendered) render([fallbackAnnouncement]);
      hasRendered = true;
      return;
    }

    const { data, error } = await client
      .from('communications')
      .select('id,title,excerpt,content,image_url,image_alt,published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('No se pudieron cargar los comunicados desde la base de datos.');
      if (!hasRendered) render([fallbackAnnouncement]);
      hasRendered = true;
      return;
    }

    render(data || []);
    hasRendered = true;
  };

  dialog.querySelector('.announcement-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    dialogPanel.classList.remove('is-zoomed');
    document.body.classList.remove('announcement-dialog-open');
  });
  window.addEventListener('kingdom:communications-updated', load);
  load();
})();
