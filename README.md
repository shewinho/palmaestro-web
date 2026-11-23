# Pa´l Maestro — Repositorio Estético y Web (`palmaestro.xyz`)

Repositorio central de estética, componentes, loader animado, configuración y herramientas HTML para **Pa´l Maestro** (Chile), conectado automáticamente con **Blogger** vía **GitHub Pages**.

## Estructura de carpetas

```text
palmaestro-web/
├── theme/
│   ├── palmaestro-theme.css     ← Estética compartida (Allo variable, colores vivos, patrones hover, móvil)
│   └── palmaestro-ui.js         ← Menú Caja de Herramientas, cinta de obra, stickers y contador LED
├── loader/
│   └── palmaestro-loader.js     ← Animación vectorial tetera roja + llamas + vapor + mate café
├── config/
│   └── palmaestro-config.json   ← Lista de herramientas, links, cinta de obra, nota y stickers
├── blogger/
│   └── plantilla-palmaestro.xml ← Plantilla limpia lista para subir 1 sola vez a Blogger
├── admin/
│   └── panel-maestro.html       ← Panel local visual para gestionar herramientas, artículos y apps
└── apps/
    └── (tus programas HTML)     ← Cada HTML que pongas acá queda online en GitHub Pages
```

---

## Puesta en marcha (solo se hace 1 vez)

### Paso 1 — Subir este repositorio a GitHub
1. Entra a [github.com/new](https://github.com/new) con tu cuenta **`shewinho`**.
2. Crea un repositorio **Público** llamado exactamente **`palmaestro-web`** (sin inicializar con README).
3. Sube todo el contenido de la carpeta `G:\Mi unidad\Pa´l Maestro\palmaestro-web` (ya sea arrastrando los archivos en GitHub o con Git desde tu PC):
   ```bash
   git init
   git add .
   git commit -m "Primera versión estética Pa'l Maestro"
   git branch -M main
   git remote add origin https://github.com/shewinho/palmaestro-web.git
   git push -u origin main
   ```

### Paso 2 — Activar GitHub Pages (gratis)
1. En tu repo `shewinho/palmaestro-web`, entra a **Settings → Pages**.
2. En **Build and deployment → Source**, elige **Deploy from a branch**.
3. Selecciona la rama **`main`** y carpeta **`/ (root)`**, y haz clic en **Save**.
4. En ~1 minuto tu estética quedará activa en:
   `https://shewinho.github.io/palmaestro-web/theme/palmaestro-theme.css`

### Paso 3 — Subir la nueva plantilla a Blogger (1 sola vez)
*(Ya tienes tu respaldo guardado en `Estetica/theme-8001730903311089116.xml`, así que puedes volver atrás cuando quieras).*
1. Entra a **Blogger → Tema**.
2. Haz clic en la flechita al lado de **Personalizar → Restablecer → Subir**.
3. Selecciona el archivo **`blogger/plantilla-palmaestro.xml`**.
4. ¡Listo! Ya conserva tu **AdSense**, tu **mascota ofreciendo mate (`ÚNETE`)**, tu **Spotify + video animado**, tus **páginas `/p/...`** en ancho completo, **Lo más mejor** y tu widget de **Instagram**.

---

## Día a día (cómo actualizar tu web sin tocar Blogger)
* **Cambiar herramientas, links, cinta de obra o nota rápida:**
  Abre `admin/panel-maestro.html` con doble clic → edita → **Guardar config.json** → sube a GitHub. En ~30 segundos cambia en `palmaestro.xyz`.
* **Escribir un nuevo artículo con la estética de Pa´l Maestro:**
  En `admin/panel-maestro.html` → pestaña **2. Redactor de Artículos** → escribe → **Copiar HTML listo para Blogger** → pégalo en Blogger (*Vista HTML*).
* **Subir una nueva app HTML:**
  Guarda tu archivo en `apps/mi-app.html`, súbelo a GitHub, y usa la pestaña **3. Incrustar Nueva App HTML** del panel local para copiar el código con tu loader de tetera + mate incluido.
