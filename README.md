# Portafolio — Luis Ángel Díaz Bernal

Sitio estático, estilo Apple, con perfil profesional, experiencia, habilidades, educación y documentos certificados (títulos, constancias y cursos).

**Sitio en línea:** https://code-reset.github.io/My-portafolio/

## Estructura

- `index.html` — página única con todas las secciones.
- `css/styles.css` — diseño (modo claro/oscuro automático + selector manual).
- `js/main.js` — animaciones, menú, sección de documentos y visor de documentos.
- `data/documents.json` — catálogo de documentos mostrados en la sección "Documentos".
- `assets/docs-view/` — imágenes de cada página de los documentos (lo que muestra el visor).
- `assets/thumbs/` — miniaturas (primera página) de cada documento.
- `assets/documents/` — solo el CV en PDF, que es lo único descargable.

## Agregar un documento nuevo

1. Convierte cada página del documento a imagen JPG (unos 1400 px en el lado largo) y guárdala en `assets/docs-view/` como `nombre-1.jpg`, `nombre-2.jpg`…
2. Guarda una miniatura de la primera página en `assets/thumbs/nombre.jpg`.
3. Agrega una entrada en `data/documents.json` con `title`, `issuer`, `date` (YYYY-MM-DD), `category` (`educacion`, `certificacion` o `curso`), `pages` (lista de imágenes) y `thumb`.
4. Haz commit y push.

Los documentos están ocultos hasta que el visitante pulsa "Ver documentos" y solo se muestran como imágenes, sin botón de descarga ni menú contextual. No se publican los PDF originales.

## Seguridad y privacidad de datos personales

- **Documentos de identidad excluidos**: acta de nacimiento, CURP y constancias fiscales/RFC no se publican. El CURP está tapado en los certificados que lo incluyen.
- **Solo ver, no descargar**: los documentos se muestran como imágenes sin enlace de descarga. Esto evita la descarga directa, pero cualquier imagen que se ve en pantalla puede capturarse; no publiques nada que no deba verse.
- **Contacto protegido contra scraping**: el correo y el teléfono no aparecen en texto plano en el HTML; se construyen en el navegador a partir de atributos separados (`data-user`/`data-domain`, `data-cc`/`data-num`).

## Desarrollo local

No requiere build ni dependencias. Basta con abrir `index.html` en un navegador o servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

## Al publicar cambios de diseño

`index.html` carga `css/styles.css?v=…` y `js/main.js?v=…`. Cambia ese número cada vez que modifiques el CSS o el JS para que los navegadores (sobre todo en celular) no usen la versión vieja guardada.
