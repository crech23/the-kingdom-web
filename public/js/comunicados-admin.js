(() => {
  const client = window.kingdomSupabase;
  const manager = document.querySelector('#admin-tools');
  const editButton = document.querySelector('#edit-communications-button');
  const status = document.querySelector('#communications-admin-status');
  const editor = document.querySelector('#communication-form');
  const list = document.querySelector('#admin-post-list');
  if (!client || !manager || !editButton || !status || !editor || !list) return;

  const get = (selector) => document.querySelector(selector);
  const postId = get('#communication-id');
  const currentImage = get('#current-image-url');
  const titleInput = get('#post-title');
  const excerptInput = get('#post-excerpt');
  const contentInput = get('#post-content');
  const imageInput = get('#post-image');
  const imageAltInput = get('#post-image-alt');
  const dateInput = get('#post-date');
  const publishedInput = get('#post-published');
  const editorTitle = get('#editor-title');
  const saveButton = get('#save-button');
  const cancelButton = get('#cancel-edit-button');
  const logoutButton = get('#logout-button');
  let activeUser = null;

  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', isError);
  };
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const localDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadCommunications = async () => {
    list.replaceChildren(make('p', 'admin-list-message', 'Cargando comunicados…'));
    const { data, error } = await client
      .from('communications')
      .select('id,title,excerpt,content,image_url,image_alt,is_published,published_at,updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      list.replaceChildren(make('p', 'admin-list-message is-error', 'No se pudieron cargar las publicaciones.'));
      return;
    }
    if (!data.length) {
      list.replaceChildren(make('p', 'admin-list-message', 'Aún no hay comunicados. Usa el formulario para crear el primero.'));
      return;
    }

    const cards = data.map((post) => {
      const card = make('article', 'admin-post-row');
      const details = make('div', 'admin-post-summary');
      details.append(make('h3', '', post.title));
      details.append(make('p', '', post.excerpt));
      const dateText = post.published_at
        ? new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' }).format(new Date(post.published_at))
        : 'Sin fecha';
      details.append(make('span', `admin-post-state${post.is_published ? ' is-published' : ''}`, `${post.is_published ? 'Publicado' : 'Borrador'} · ${dateText}`));
      card.append(details);

      const actions = make('div', 'admin-row-actions');
      const editButton = make('button', 'button button-outline', 'Editar');
      editButton.type = 'button';
      editButton.addEventListener('click', () => startEditing(post));
      const deleteButton = make('button', 'button button-outline admin-delete', 'Eliminar');
      deleteButton.type = 'button';
      deleteButton.addEventListener('click', () => deleteCommunication(post));
      actions.append(editButton, deleteButton);
      card.append(actions);
      return card;
    });
    list.replaceChildren(...cards);
  };

  const startEditing = (post) => {
    postId.value = post.id;
    currentImage.value = post.image_url || '';
    titleInput.value = post.title;
    excerptInput.value = post.excerpt || '';
    contentInput.value = post.content || '';
    imageAltInput.value = post.image_alt || '';
    dateInput.value = post.published_at ? localDate(new Date(post.published_at)) : localDate();
    publishedInput.checked = post.is_published;
    imageInput.value = '';
    editorTitle.textContent = 'Editar comunicado';
    saveButton.textContent = 'Guardar cambios';
    cancelButton.hidden = false;
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const resetEditor = () => {
    editor.reset();
    postId.value = '';
    currentImage.value = '';
    dateInput.value = localDate();
    publishedInput.checked = true;
    editorTitle.textContent = 'Crear comunicado';
    saveButton.textContent = 'Guardar comunicado';
    cancelButton.hidden = true;
  };

  const uploadImage = async (file) => {
    if (!file) return currentImage.value || null;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Elige una imagen JPG, PNG o WEBP.');
    }
    if (file.size > 10 * 1024 * 1024) throw new Error('La imagen no puede superar 10 MB.');
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const path = `${activeUser.id}/${Date.now()}-${safeName}`;
    const { error } = await client.storage.from('communications').upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw error;
    return client.storage.from('communications').getPublicUrl(path).data.publicUrl;
  };

  const saveCommunication = async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    setStatus('Guardando comunicado…');
    try {
      const imageUrl = await uploadImage(imageInput.files[0]);
      const publishedAt = dateInput.value
        ? new Date(`${dateInput.value}T12:00:00`).toISOString()
        : new Date().toISOString();
      const payload = {
        title: titleInput.value.trim(),
        excerpt: excerptInput.value.trim(),
        content: contentInput.value.trim(),
        image_url: imageUrl,
        image_alt: imageAltInput.value.trim(),
        is_published: publishedInput.checked,
        published_at: publishedAt,
      };
      if (!postId.value) payload.created_by = activeUser.id;

      const result = postId.value
        ? await client.from('communications').update(payload).eq('id', postId.value)
        : await client.from('communications').insert(payload);
      if (result.error) throw result.error;
      setStatus(postId.value ? 'Cambios guardados.' : 'Comunicado creado.');
      resetEditor();
      await loadCommunications();
      window.dispatchEvent(new Event('kingdom:communications-updated'));
    } catch (error) {
      setStatus(error.message || 'No se pudo guardar el comunicado.', true);
    } finally {
      saveButton.disabled = false;
    }
  };

  const deleteCommunication = async (post) => {
    if (!window.confirm(`¿Eliminar el comunicado “${post.title}”?`)) return;
    const { error } = await client.from('communications').delete().eq('id', post.id);
    if (error) {
      setStatus('No se pudo eliminar el comunicado.', true);
      return;
    }
    if (postId.value === post.id) resetEditor();
    setStatus('Comunicado eliminado.');
    await loadCommunications();
    window.dispatchEvent(new Event('kingdom:communications-updated'));
  };

  const showToolsForCurrentUser = async (user) => {
    const { data, error } = await client
      .from('communication_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error || !data) {
      manager.hidden = true;
      editButton.hidden = true;
      activeUser = null;
      window.kingdomAdminSession?.clear();
      return;
    }

    activeUser = user;
    manager.hidden = true;
    editButton.hidden = false;
    editButton.textContent = 'Editar comunicados';
    window.kingdomAdminSession?.activate();
    setStatus(`Sesión iniciada como ${user.email}.`);
  };

  editButton.addEventListener('click', async () => {
    manager.hidden = !manager.hidden;
    editButton.textContent = manager.hidden ? 'Editar comunicados' : 'Ocultar editor';
    if (!manager.hidden) {
      resetEditor();
      await loadCommunications();
      manager.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  editor.addEventListener('submit', saveCommunication);
  cancelButton.addEventListener('click', resetEditor);
  logoutButton.addEventListener('click', async () => {
    await client.auth.signOut();
    manager.hidden = true;
    editButton.hidden = true;
    editButton.textContent = 'Editar comunicados';
    activeUser = null;
    window.kingdomAdminSession?.clear();
    setStatus('Sesión cerrada.');
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session?.user) showToolsForCurrentUser(data.session.user);
    else window.kingdomAdminSession?.clear();
  });

  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      manager.hidden = true;
      editButton.hidden = true;
      editButton.textContent = 'Editar comunicados';
      activeUser = null;
      window.kingdomAdminSession?.clear();
      return;
    }
    if (event === 'SIGNED_IN') setTimeout(() => showToolsForCurrentUser(session.user), 0);
  });
})();
