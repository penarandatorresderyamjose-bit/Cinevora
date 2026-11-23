# Publicar CINEVORA 1.1 en Netlify, sin pagar

Esta versión mantiene React/Vite y usa **Netlify Functions** para consultar TMDB e Internet Archive; no subas solo `index.html` porque las consultas `/api/*` dependen del servidor. No hace falta iniciar procesos `npm run dev` en Netlify.

## Opción recomendada: desde GitHub

1. Extrae este ZIP en Windows.
2. Abre la carpeta `Cinevora_Lista_Netlify` y selecciona *todo su contenido*, no la carpeta contenedora. Nunca subas `.env` o `node_modules`.
3. En el repositorio `https://github.com/penarandatorresderyamjose-bit/Cinevora`, haz clic en **«sube uno existente»** (o **«Agregar archivo» > «Subir archivos»**), arrastra los archivos y confirma los cambios. La raíz debe tener `package.json`, `netlify.toml`, `src/`, `server/` y `netlify/functions/api.ts`.
4. En `https://app.netlify.com/start`, elige **Agregar un proyecto** > **Importar un repositorio existente** (el texto puede variar) > **GitHub** > **Cinevora**.
5. Verifica: comando `npm run build`, carpeta de publicación `dist`, rama `main`; `netlify.toml` ya contiene esos valores.
6. Antes de publicar, en **Configuración del proyecto > Variables de entorno** agrega `TMDB_READ_ACCESS_TOKEN` con tu token real de lectura, marcado como secreto si se ofrece. El valor **no** debe llevar el prefijo `Bearer `; si usas la clave v3 en vez del token puedes definir `TMDB_API_KEY`. No compartas la credencial.
7. Publica. Netlify te dará un subdominio del tipo `nombre.netlify.app`. Comprueba `https://TU-SITIO.netlify.app/api/health` y `https://TU-SITIO.netlify.app/api/genres`. `tmdbConfigured:true` solo indica que detectó el token, mientras que `/api/genres` prueba una consulta real a TMDB.
8. Si la página abre pero `/api` falla, verifica que GitHub tenga `netlify/functions/api.ts`, que el token esté configurado para el ámbito de funciones y los logs de Netlify. Después de cambiar el token, vuelve a desplegar.

**No uses la opción de subir `index.html` ni solo la carpeta `dist`** para esta aplicación: así no se instala su backend. Se necesita el despliegue desde un repositorio o un flujo que construya y publique también las funciones.

El plan Free de Netlify tiene un cupo mensual y puede suspender la aplicación al agotarlo. Comprueba los límites vigentes antes de usarlo con mucha gente; no configures pagos automáticos si no quieres cargos.

## Qué se modificó para Netlify

- `netlify.toml`: compila Vite y publica `dist`, envía `/api/*` a una función y mantiene rutas de React Router al recargar.
- `netlify/functions/api.ts`: ejecuta `server/app.ts` con `serverless-http` sin levantar un puerto.
- `package.json`: añade `serverless-http`; la versión local sigue disponible con `npm install` y `npm run dev`.
- `.nvmrc`: Node 22.

### Comprobación local

Si tu ZIP original funcionaba en Windows, esta versión conserva el mismo frontend y API local. Abre CMD en `Cinevora_Lista_Netlify` y ejecuta `npm install` seguido de `npm run dev`; copia tu archivo `.env` **solo al computador local**.

Para simular Netlify Functions localmente, usa la CLI de Netlify (`npx netlify dev`) con las dependencias instaladas, o despliega en un sitio de prueba.

No se verificó un despliegue de producción en tu cuenta; debes conectar Netlify y añadir tu token privado.
