# Portafolio — Luis Ángel Díaz Bernal

Sitio estático, estilo Apple, con perfil profesional, experiencia, habilidades, educación y documentos certificados (títulos, constancias y cursos).

## Estructura

- `index.html` — página única con todas las secciones.
- `css/styles.css` — diseño (modo claro/oscuro automático + selector manual).
- `js/main.js` — animaciones, filtros de documentos, visor de PDF y carga de nuevos documentos.
- `data/documents.json` — catálogo de documentos mostrados en la sección "Documentos".
- `assets/documents/` — archivos PDF originales.
- `assets/thumbs/` — miniaturas (primera página) de cada documento.

## Agregar un documento nuevo de forma permanente

1. Coloca el PDF en `assets/documents/` y, si quieres una vista previa, una imagen de la primera página en `assets/thumbs/`.
2. Agrega una entrada en `data/documents.json` con `title`, `issuer`, `date` (YYYY-MM-DD), `category` (`educacion`, `certificacion` o `curso`), `file` y `thumb`.
3. Haz commit y push — el documento aparecerá para todos los visitantes.

## Subir documentos desde el sitio (sin tocar código)

En la sección "Documentos" hay una tarjeta **"Agregar documento"**. Permite subir un PDF o imagen (máx. 4 MB) con título, institución y fecha. Estos documentos se guardan únicamente en el navegador de quien los sube (localStorage) y no son visibles para otros visitantes. Desde el mismo panel se puede exportar un `documents.json` actualizado para publicarlo de forma permanente siguiendo los pasos anteriores.

## Quitar un documento visible

Cada tarjeta en "Documentos" tiene un botón "×" (visible al pasar el cursor) que la oculta. Los documentos propios (subidos por ti) se eliminan por completo; los del repositorio solo se ocultan en ese navegador y se pueden restaurar con el enlace "Mostrar de nuevo" que aparece arriba de la cuadrícula.

## Seguridad y privacidad de datos personales

- **Documentos de identidad excluidos**: acta de nacimiento, CURP y constancias fiscales/RFC fueron excluidos intencionalmente del sitio público. Solo se publican documentos académicos y profesionales de respaldo.
- **Aviso en el panel de carga**: al agregar un documento nuevo, el sitio advierte no subir identificaciones oficiales ni datos sensibles (CURP, RFC, domicilio).
- **Contacto protegido contra scraping**: el correo y el teléfono no aparecen en texto plano en el HTML; se construyen en el navegador a partir de atributos separados (`data-user`/`data-domain`, `data-cc`/`data-num`) para dificultar su cosecha automática por bots de spam.
- **Aviso de privacidad en el pie de página**: recuerda a cualquier visitante que el sitio solo expone información profesional/académica.

## Desarrollo local

No requiere build ni dependencias. Basta con abrir `index.html` en un navegador o servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```
