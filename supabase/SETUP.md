# Administración de comunicados

El panel está en `admin.html`. La migración crea la tabla `communications`, el bucket público de imágenes `communications` y reglas RLS: cualquier visitante puede leer solo publicaciones públicas; solo usuarios asignados en `communication_admins` pueden escribir.

## Publicar la migración

El proyecto Supabase está enlazado al repositorio `crech23/the-kingdom-web`. La integración debe tener activado **Deploy to production** para que aplique automáticamente los archivos nuevos de `supabase/migrations/` al recibir cambios en `main`. Si no está activado, abre **SQL Editor** en Supabase, copia `20261028120000_admin_communications.sql` y ejecútalo una sola vez.

## Dar acceso al primer administrador

1. En Supabase, abre **Authentication → Users** y crea el usuario administrador con el correo acordado. Define la contraseña directamente en Supabase; no la guardes en este repositorio.
2. En **SQL Editor**, ejecuta lo siguiente después de reemplazar `CORREO_ADMIN` por el correo exacto del usuario:

   ```sql
   insert into public.communication_admins (user_id)
   select id
   from auth.users
   where lower(email) = lower('CORREO_ADMIN')
   on conflict (user_id) do nothing;
   ```

3. Entra a `admin.html` con ese correo y contraseña. El panel permite crear, editar, publicar, guardar como borrador y eliminar comunicados. Las imágenes nuevas se cargan al bucket `communications`.

La clave `sb_publishable_…` del navegador es pública por diseño. La seguridad depende de las políticas RLS de esta migración. Nunca agregues una clave `sb_secret_…` o `service_role` a los archivos web.
