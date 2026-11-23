# CINEVORA 1.1 - Corrección para Netlify

## Problema corregido

`This function has crashed` / `TypeError: The "path" argument must be of type string or an instance of URL. Received undefined`.

La función de Netlify fallaba en `server/app.ts` porque usaba `fileURLToPath(import.meta.url)`. Esbuild puede convertirla en CommonJS, donde esa propiedad queda indefinida. Se reemplazó por `path.resolve(process.cwd(), 'dist')`, que no depende de `import.meta`.

## Publicación

- Reemplaza en el repositorio el proyecto anterior por el contenido de esta carpeta (no subas `.env` ni `node_modules`). `netlify.toml` debe quedar junto a `package.json`.
- En Netlify, en Configuración del proyecto > Variables de entorno, configura `TMDB_READ_ACCESS_TOKEN` como secreto con tu token real, sin `Bearer`. Debe estar disponible para Functions.
- Activa un nuevo despliegue del proyecto corregido.
- Comprueba `https://TU-SITIO.netlify.app/api/health`: debe devolver JSON con `status: ok`. Si `tmdbConfigured: false`, revisa la variable de entorno.
- Comprueba `https://TU-SITIO.netlify.app/api/genres`: si devuelve un 401, el token puede ser inválido, pero ya no será el error de la ruta.

Esta revisión no altera películas, idiomas, calidades o el diseño.
