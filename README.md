# CINEVORA 1.1 — versión Netlify

**Para publicar en Netlify, abre `INSTRUCCIONES_NETLIFY.md` primero.** Esta variante contiene `netlify.toml` y `netlify/functions/api.ts`. La sección anterior de Render es histórica y no describe el despliegue de este ZIP.

---

# CINEVORA — Cine para descubrir

## Novedad: selección de idioma, resolución y reproducción en CINEVORA

La biblioteca de **Descargas legales** ahora muestra **todas las versiones de video compatibles que declare Internet Archive**, hasta 30 por elemento. La ficha permite:

- **Filtrar por idioma declarado** (Español / Inglés / todos) y seleccionar una versión por idioma cuando está indicada. El idioma procede de los metadatos del publicador o del nombre explícito del archivo. **No es una comprobación de doblaje o pista de audio**; si la fuente no indica español, no se ofrece como tal.
- **Elegir la resolución real disponible:** 480p, 720p, 1080p o 4K **solo cuando el archivo informa su altura en píxeles**. No reescala los archivos ni inventa versiones. Si faltan las dimensiones, aparece «Resolución no indicada».
- **Ver videos en un reproductor HTML5 propio**, sin anuncios inyectados por CINEVORA, desde archivos de Internet Archive cuya URL se comprobó mediante una petición HEAD; el funcionamiento depende del formato y del navegador. No podemos impedir anuncios incorporados al video o mostrados por un sitio externo, como YouTube o Archive.
- **Descargar la versión elegida**: el botón solo aparece cuando el enlace del archivo específico responde a la comprobación del servidor. La descarga y la transmisión usan enlaces directos del proveedor y su licencia declarada.

**Importante:** TMDB es un catálogo de información, no un servicio de streaming ni un catálogo de pistas de audio. Su API ya entrega títulos y sinopsis en español (`es-ES`), pero esto no cambia el audio de películas; tener ficha en español no implica que exista descarga en español. No se puede añadir un doblaje o 4K de una película sin disponer legalmente del material.

### Actualizar tu instalación de Windows sin perder el token

1. Detén la aplicación anterior con `Ctrl + C` en CMD.
2. Descomprime el nuevo ZIP **en una carpeta nueva**. Entra a `Cinevora_Actualizada` (la que contiene `package.json`).
3. Copia tu archivo `.env` **desde la carpeta anterior `cinevora`** a esta carpeta nueva. Ese archivo no está dentro del ZIP por seguridad. No lo compartas ni lo subas a GitHub.
4. En CMD dentro de la carpeta nueva ejecuta `npm install` y luego `npm run dev`.
5. Abre `http://localhost:5173/descargas`; elige un idioma, abre un archivo y selecciona la resolución que ofrezca.

Si ya publicaste el proyecto en GitHub o Render, sube estos cambios a tu repositorio y vuelve a desplegar. En Render conserva el token como variable de entorno, **nunca** en el repositorio.

Ruta nueva: `GET /api/archive/:identifier/variant/:index` para verificar la versión seleccionada antes de entregar su URL.

---

Web responsive creada con **React 19, TypeScript, Vite, Tailwind CSS, Express y Node.js**. Consulta el catálogo real de **TMDB** y una biblioteca independiente de archivos con licencias explícitas de **Internet Archive**. No usa servidores piratas ni incluye enlaces de descarga inventados.

## 1. Requisitos

- Node.js **20.11+** (mejor: 22).
- npm.
- Cuenta y credencial de TMDB obtenida en https://www.themoviedb.org/settings/api (respeta sus condiciones de uso).

## 2. Ejecutar en tu computador

Abre una terminal dentro de la carpeta `cinevora` y ejecuta:

```bash
npm install
cp .env.example .env
```

En Windows PowerShell, en lugar de `cp` puedes usar `Copy-Item .env.example .env`.

Edita `.env` con tu credencial **en el servidor**:

```dotenv
TMDB_READ_ACCESS_TOKEN=TU_TOKEN_REAL_DE_LECTURA
PORT=3001
NODE_ENV=development
```

Es el **API Read Access Token de TMDB**, no la clave de Gemini ni una clave de OpenAI. Alternativamente puedes configurar `TMDB_API_KEY` con la clave v3. Si están ambas, se usa el token de lectura.

Luego ejecuta:

```bash
npm run dev
```

Abre **http://localhost:5173**. El frontend Vite redirige `/api/*` a Express en el puerto `3001`. El comando inicia los dos servidores.

Puedes ejecutar las pruebas con `npm test` y revisar los tipos con `npm run check`.

Puedes consultar **http://localhost:3001/api/health** para comprobar que `tmdbConfigured` sea `true`.

## 3. Publicar GRATIS o con un plan de Render

Se eligió Render como un solo **Web Service** porque aloja frontend y backend juntos: no es necesario exponer una clave ni montar funciones serverless separadas. Los precios y la disponibilidad del plan pueden cambiar.

1. Sube la carpeta del proyecto a un repositorio de GitHub (no subas `.env`).
2. En https://dashboard.render.com crea un servicio desde el repositorio, preferiblemente **Blueprint** para que Render lea `render.yaml`, o manualmente **New > Web Service**.
3. Si lo creas manualmente, configura **Build Command** `npm install && npm run build`, **Start Command** `npm start`, **Health Check Path** `/api/health`. El servicio necesita Node 20.11+.
4. En **Environment**, añade `NODE_ENV=production` y `TMDB_READ_ACCESS_TOKEN` con tu token secreto. No escribas el token en GitHub ni en código React.
5. Despliega y prueba las rutas `/api/health`, `/`, `/explorar`, `/pelicula/ID`, `/descargas` y una categoría.

La ruta `*` de Express sirve la SPA compilada, por lo que actualizar una página interna no produce un error 404. Render asigna una URL HTTPS al servicio.

**Recomendación:** Ejecuta `npm install` antes de subirlo a GitHub para generar `package-lock.json` y mantener versiones reproducibles. Si lo incluyes, después puedes usar `npm ci && npm run build`.

## 4. Estructura

```text
cinevora/
├── src/
│   ├── components/        # Cabecera, tarjetas, carruseles, estados
│   ├── context/           # Favoritos, historial, notificaciones
│   ├── data/              # Géneros, países e idiomas
│   ├── lib/               # Cliente HTTP y persistencia local
│   ├── pages/             # Inicio, explorar, géneros, fichas, descargas
│   ├── styles.css         # Tailwind y diseño adaptable
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── app.ts             # Express, rutas, seguridad, SPA
│   ├── tmdb.ts            # TMDB y filtros
│   ├── archive.ts         # Búsqueda, licencias y validación de archivos
│   ├── categories.ts      # 20 categorías
│   ├── utils.ts           # Validación, errores, caché
│   └── server.ts
├── public/favicon.svg
├── .env.example
├── render.yaml
└── package.json
```

## 5. Funciones implementadas

- Portada real basada en resultados de TMDB, varias carteleras y carruseles navegables.
- 20 categorías. Las categorías especiales (artes marciales, peleas, superhéroes y catástrofes) usan **palabras clave de TMDB**; la cantidad de resultados depende de sus etiquetas disponibles.
- Búsqueda por título, año, actor, director, género, país e idioma original. Ordenación y páginas adicionales. Con título, los filtros se aplican a la página de TMDB que se está consultando (las búsquedas de TMDB por título no admiten todos los filtros directamente).
- Fichas con reparto, dirección, idiomas, sinopsis, duración, calificación, recomendaciones y tráileres de YouTube embebidos cuando TMDB los aporta.
- Favoritos e historial en almacenamiento local del **navegador del dispositivo**. No se sincronizan entre usuarios o dispositivos. Puedes borrar el historial.
- Búsqueda en Internet Archive. Muestra únicamente registros de tipo `movies` con licencia `creativecommons.org` reconocida y un archivo de video indicado en los metadatos. En la ficha, el servidor hace una petición `HEAD` para confirmar la disponibilidad antes de habilitar el botón externo de descarga.
- Estados de carga, mensajes de error, navegación móvil, posters alternativos y aviso al guardar.
- Rate limiting, validación de entradas, caché de peticiones, credenciales solo en Node y respuesta API de errores sin secretos.

## 6. Descargas: límites y derechos

**TMDB NO proporciona películas ni archivos de descarga.** Una ficha de TMDB enlaza a una búsqueda aparte en Internet Archive; no se identifica automáticamente como la misma obra y no se promete que exista una copia legal.

Internet Archive contiene obras con distintos estados de derechos. La app comprueba que haya una **licencia declarada por el publicador** (CC0, dominio público marcado o licencias Creative Commons identificables), muestra sus condiciones y solo ofrece el enlace directo tras verificar que el servidor externo responde. La licencia declarada en metadatos puede ser incorrecta; revisa los derechos originales antes de redistribuir, modificar o usar comercialmente una película. Si la verificación falla, se ofrece solo la página de la fuente. Una respuesta HEAD positiva confirma disponibilidad técnica, no validez jurídica.

No copiamos ni hospedamos los videos ni hacemos scraping de servidores no autorizados.

## 7. API interna

- `GET /api/health`
- `GET /api/home`
- `GET /api/feed/:feed?page=1` (trending, popular, top, now, upcoming, recent)
- `GET /api/categories`
- `GET /api/genres`
- `GET /api/category/:slug?page=1&sort=popularity.desc`
- `GET /api/search?q=&year=&genre=&actor=&director=&language=&country=&sort=&page=1`
- `GET /api/suggest?q=...`
- `GET /api/recommendations?ids=123,456`
- `GET /api/movie/:id`
- `GET /api/archive?q=&page=1`
- `GET /api/archive/:identifier`

## 8. Créditos

La app incluye el aviso requerido por TMDB: “This product uses the TMDB API but is not endorsed or certified by TMDB.”

- TMDB: https://developer.themoviedb.org/docs/authentication-application
- TMDB atribución: https://developer.themoviedb.org/docs/faq
- Internet Archive: https://archive.org
- Internet Archive licencias: https://archivesupport.zendesk.com/hc/en-us/articles/360018359991-Search-A-Basic-Guide
- Render Node: https://render.com/docs/deploy-node-express-app

No se incluye ninguna clave en este repositorio. Debes aportar tu credencial TMDB para que el catálogo real funcione.
