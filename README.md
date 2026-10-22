# Portafolio — Luis Ángel Díaz Bernal

Sitio estático, estilo Apple, con perfil profesional, experiencia, instalaciones, aplicaciones, testimonios, educación y documentos.

**Sitio en línea:** https://code-reset.github.io/My-portafolio/

No necesita compilación: GitHub Pages publica los archivos tal cual.

## Estructura

```
index.html              Página única. Orden: inicio (con los 3 servicios), Proyectos
                        (pestañas Instalaciones / Aplicaciones), Testimonios,
                        Sobre mí (pestañas Experiencia / Habilidades / Educación /
                        Documentos) y Contacto. Cada parte está marcada con <!-- NOMBRE -->.
css/styles.css          Diseño. El índice de secciones está al inicio del archivo.
js/main.js              Punto de entrada: solo inicia los módulos.
js/modules/
  utils.js              Funciones compartidas (escapar texto, leer JSON, contadores).
  theme.js              Modo claro / oscuro.
  nav.js                Menú superior y menú de celular.
  reveal.js             Animación de aparición al hacer scroll.
  tabs.js               Pestañas. Un enlace a algo dentro de una pestaña (#documentos,
                        #caso-minero…) abre esa pestaña solo.
  contact.js            Arma correo, teléfono y enlaces de WhatsApp.
  pagination.js         Paginación reutilizable (apps y documentos).
  viewer.js             Visor de imágenes: vista previa de apps y documentos.
  apps.js               Sección "Aplicaciones desarrolladas" (lee data/apps.json).
  documents.js          Sección "Documentos" (lee data/documents.json).
data/apps.json          Lista de aplicaciones.
data/documents.json     Lista de documentos.
assets/projects/        Capturas de apps e instalaciones.
assets/docs-view/       Imagen de cada página de los documentos (lo que muestra el visor).
assets/thumbs/          Miniaturas de los documentos.
assets/documents/       Solo el CV en PDF, que es lo único descargable.
tools/bump_version.py   Cambia el número de versión para que los celulares no usen archivos viejos.
tests/                  Pruebas automáticas.
```

## Agregar una aplicación

1. Guarda las capturas en `assets/projects/` (JPG, 720 px de ancho, sin barra de estado ni datos de clientes).
2. Agrega una entrada al final de `data/apps.json`:

```json
{
  "id": "nombre-corto",
  "name": "Nombre de la app",
  "tag": "Qué es, en pocas palabras",
  "description": "Qué hace, en primera persona y sin datos de clientes.",
  "stack": ["App web", "Firebase"],
  "images": [
    { "src": "assets/projects/nombre-1.jpg", "alt": "Qué se ve en la captura" },
    { "src": "assets/projects/nombre-2.jpg", "alt": "Qué se ve en la captura" }
  ]
}
```

La primera imagen es la portada de la tarjeta; todas aparecen en la vista previa. Los contadores de apps de la página se actualizan solos, pero también cambia el número escrito en `index.html` (busca `data-count="apps"`) para que coincida; las pruebas avisan si no coincide.

La cantidad de apps por página se cambia en `index.html`, en `data-page-size` de `#appsGrid` (hoy 6). Los documentos usan `data-page-size` de `#docGrid` (hoy 8).

## Agregar un documento

1. Convierte cada página a JPG (unos 1400 px en el lado largo) en `assets/docs-view/nombre-1.jpg`, `nombre-2.jpg`…
2. Guarda una miniatura en `assets/thumbs/nombre.jpg`.
3. Agrega una entrada en `data/documents.json` con `id`, `title`, `issuer`, `date` (AAAA-MM-DD), `category`, `pages` y `thumb`.
4. Cambia el número en `index.html` donde dice `data-count="docs"`.

Los documentos están ocultos hasta que el visitante pulsa "Ver documentos" y solo se muestran como imágenes, sin botón de descarga. No se publican los PDF originales.

## Antes de publicar

```bash
python3 tools/bump_version.py      # si cambiaste algo en css/ o js/
pip install pytest playwright      # solo la primera vez
python3 -m pytest tests -q         # deben pasar todas
```

Las pruebas revisan, entre otras cosas: que no haya errores en la consola, que todas las imágenes y enlaces existan, que no haya scroll horizontal en 7 anchos de pantalla, la paginación, la vista previa de cada app, que los documentos no se puedan descargar, que los contadores coincidan con los datos, que no aparezcan CURP, RFC ni usuarios admin, y que no haya archivos sin usar. Si Playwright no encuentra Chromium, indica la ruta con la variable `CHROMIUM_PATH`.

Para ver el sitio en tu computadora:

```bash
python3 -m http.server 8000        # y abre http://localhost:8000
```

## Seguridad y privacidad de datos personales

- **Documentos de identidad excluidos**: acta de nacimiento, CURP y constancias fiscales/RFC no se publican. El CURP está tapado en los certificados que lo incluyen.
- **Datos de clientes**: en las capturas se tapan nombres completos, teléfonos, direcciones, montos y usuarios de administrador.
- **Solo ver, no descargar**: los documentos se muestran como imágenes sin enlace de descarga. Cualquier imagen que se ve en pantalla puede capturarse; no publiques nada que no deba verse.
- **Contacto protegido contra scraping**: el correo y el teléfono no aparecen completos en el HTML; se arman en el navegador.
- **Texto sin HTML**: todo lo que viene de los archivos JSON se escapa antes de mostrarse, así un texto con `<` o comillas no rompe la página.
