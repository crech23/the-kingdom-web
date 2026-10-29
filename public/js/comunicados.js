(() => {
  const client = window.kingdomSupabase;
  const feed = document.querySelector('[data-announcement-feed]');
  if (!client || !feed) return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const makePost = (post) => {
    const article = make('article', 'social-post announcement-post reveal');
    article.setAttribute('aria-label', `Comunicado: ${post.title}`);

    const header = make('header', 'social-post-header');
    const avatar = make('img', 'social-post-avatar');
    avatar.src = 'public/images/crown-menu-icon.png';
    avatar.alt = '';
    avatar.setAttribute('aria-hidden', 'true');
    header.append(avatar);

    const author = make('div', 'social-post-author');
    author.append(make('h2', '', post.title));
    const dateLine = make('p', '', 'Comunicado oficial · ');
    const time = make('time');
    const published = new Date(post.published_at);
    time.dateTime = published.toISOString();
    time.textContent = new Intl.DateTimeFormat('es-SV', { dateStyle: 'long' }).format(published);
    dateLine.append(time);
    author.append(dateLine);
    header.append(author, make('span', 'official-badge', 'Oficial'));
    article.append(header);

    if (post.excerpt) article.append(make('p', 'social-post-caption', post.excerpt));
    if (post.content) {
      const details = make('details', 'social-post-details');
      details.append(make('summary', '', 'Leer el texto del comunicado'));
      details.append(make('p', '', post.content));
      article.append(details);
    }

    if (post.image_url) {
      const media = make('a', 'social-post-media');
      const imageUrl = /^https?:\/\//i.test(post.image_url)
        ? post.image_url
        : new URL(post.image_url, window.location.href).href;
      media.href = imageUrl;
      media.target = '_blank';
      media.rel = 'noopener noreferrer';
      media.setAttribute('aria-label', 'Abrir el comunicado completo en una nueva pestaña');
      const image = make('img');
      image.src = imageUrl;
      image.alt = post.image_alt || `Imagen del comunicado ${post.title}`;
      image.loading = 'lazy';
      media.append(image);
      article.append(media);
    }

    const actions = make('footer', 'social-post-actions');
    actions.setAttribute('aria-label', 'Acciones del comunicado');
    const instagram = make('a', '', '◎ Instagram');
    instagram.href = 'https://www.instagram.com/thekingdom_es/';
    instagram.target = '_blank';
    instagram.rel = 'noopener noreferrer';
    const tiktok = make('a', '', '♪ TikTok');
    tiktok.href = 'https://www.tiktok.com/@the.kingdomc';
    tiktok.target = '_blank';
    tiktok.rel = 'noopener noreferrer';
    actions.append(instagram, tiktok);
    if (post.image_url) {
      const full = make('a', '', '↗ Ver completo');
      full.href = /^https?:\/\//i.test(post.image_url)
        ? post.image_url
        : new URL(post.image_url, window.location.href).href;
      full.target = '_blank';
      full.rel = 'noopener noreferrer';
      actions.append(full);
    }
    article.append(actions);
    return article;
  };

  const load = async () => {
    const { data, error } = await client
      .from('communications')
      .select('id,title,excerpt,content,image_url,image_alt,published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('No se pudieron cargar los comunicados desde la base de datos.');
      return;
    }

    if (!data.length) {
      feed.replaceChildren(make('p', 'empty-announcements', 'Pronto publicaremos nuevos comunicados.'));
      return;
    }

    const posts = data.map(makePost);
    feed.replaceChildren(...posts);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      posts.forEach((post) => post.classList.add('is-visible'));
    }));
  };

  load();
})();
