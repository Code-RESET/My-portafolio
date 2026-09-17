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

## Nota de privacidad

Documentos de identidad (acta de nacimiento, CURP, constancias fiscales/RFC) fueron excluidos intencionalmente del sitio público por seguridad. Solo se publican documentos académicos y profesionales de respaldo.

## Desarrollo local

No requiere build ni dependencias. Basta con abrir `index.html` en un navegador o servir la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
```
