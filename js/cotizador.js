console.log("COTIZADOR JS conectado v33 texto-mas-pdf-en-tabla");

const $ = (id) => document.getElementById(id);

let clientesDB = [];
let cotizacionesDB = [];
let cotizacionSeleccionada = null;

const TUTTO_LOGO_SVG_DATA_URI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPCFET0NUWVBFIHN2ZyBQVUJMSUMgIi0vL1czQy8vRFREIFNWRyAxLjEvL0VOIiAiaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkIj4KPCEtLSBDcmVhdG9yOiBDb3JlbERSQVcgMjAyMCAoNjQtQml0KSAtLT4KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI4OC4xOTIzbW0iIGhlaWdodD0iMjYuMDc0MW1tIiB2ZXJzaW9uPSIxLjEiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyB0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IGltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVF1YWxpdHk7IGZpbGwtcnVsZTpldmVub2RkOyBjbGlwLXJ1bGU6ZXZlbm9kZCIKdmlld0JveD0iMCAwIDM0LjYyODEgMTAuMjM3OCIKIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIgogeG1sbnM6eG9kbT0iaHR0cDovL3d3dy5jb3JlbC5jb20vY29yZWxkcmF3L29kbS8yMDAzIj4KIDxkZWZzPgogIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgIDwhW0NEQVRBWwogICAgLmZpbDEge2ZpbGw6I0Y5N0E1NDtmaWxsLXJ1bGU6bm9uemVyb30KICAgIC5maWwwIHtmaWxsOndoaXRlO2ZpbGwtcnVsZTpub256ZXJvfQogICBdXT4KICA8L3N0eWxlPgogPC9kZWZzPgogPGcgaWQ9IkNhcGFfeDAwMjBfMSI+CiAgPG1ldGFkYXRhIGlkPSJDb3JlbENvcnBJRF8wQ29yZWwtTGF5ZXIiLz4KICA8ZyBpZD0iXzEzNzA1MzY4ODM5MDQiPgogICA8cG9seWdvbiBjbGFzcz0iZmlsMCIgcG9pbnRzPSIzLjA1MDYsMS4zNTczIDMuMDUwNiw2Ljc5NTcgMS42MjQ1LDYuNzk1NyAxLjYyNDUsMS4zNTczIC0wLDEuMzU3MyAtMCwwLjE0OTggNC42NzUsMC4xNDk4IDQuNjc1LDEuMzU3MyAiLz4KICAgPHBhdGggY2xhc3M9ImZpbDAiIGQ9Ik0xMS42NTY2IDMuMTE0NWwwIDAuOTQ4M2MwLDAuNTQ0NyAtMC4xMjQ0LDAuOTU2MyAtMC4zNzIzLDEuMjM0NyAtMC4yNDc5LDAuMjc4MiAtMC42MTQ1LDAuNDE3NyAtMS4wOTg1LDAuNDE3NyAtMC40ODEyLDAgLTAuODQzLC0wLjEzODIgLTEuMDg1NCwtMC40MTU2IC0wLjI0MTQsLTAuMjc2NSAtMC4zNjMxLC0wLjY4ODkgLTAuMzYzMSwtMS4yMzY4bDAgLTMuOTEzMSAtMS40MTE2IDAgMCA0LjEzNTRjMCwwLjkwMTkgMC4yMzc2LDEuNTc1MyAwLjcxMzIsMi4wMiAwLjQ3NDksMC40NDQ5IDEuMTk4NSwwLjY2NzQgMi4xNjkyLDAuNjY3NCAwLjk1NjcsMCAxLjY3MjYsLTAuMjIyNSAyLjE0NzUsLTAuNjY3NCAwLjQ3NDksLTAuNDQ0NyAwLjcxMzEsLTEuMTE4MSAwLjcxMzEsLTIuMDJsMCAtMS4xNzA3IC0xLjQxMjIgMHoiLz4KICAgPHBvbHlnb24gY2xhc3M9ImZpbDEiIHBvaW50cz0iMTIuMzU0NSwwLjE0OTggMTIuNzExNiwxLjE3NTQgMTMuMDY4OCwyLjIwMSAxMi4zNTQ1LDIuMjAxIDExLjY0MDQsMi4yMDEgMTEuOTk3NSwxLjE3NTQgIi8+CiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwwIiBwb2ludHM9IjIxLjY0MzUsMC4xNDk4IDIxLjExNDMsMS4zNTczIDIxLjMxMTksMS4zNTczIDIyLjYyMTQsMS4zNTczIDIyLjYyMTQsNi43OTU2IDI0LjA0NzQsNi43OTU2IDI0LjA0NzQsMS4zNTczIDI1LjY3MTgsMS4zNTczIDI1LjY3MTgsMC4xNDk4ICIvPgogICA8cG9seWdvbiBjbGFzcz0iZmlsMCIgcG9pbnRzPSIyMC4zOTQ2LDAuMTQ5OCAyMC4wNzk4LDAuMTQ5OCAxNS43MTk4LDAuMTQ5OCAxNS43MTk4LDEuMzU3MyAxNy4zNDQxLDEuMzU3MyAxNy4zNDQxLDYuNzk1NiAxOC43NzAyLDYuNzk1NiAxOC43NzAyLDEuMzU3MyAyMC4wMDIsMS4zNTczIDIwLjUzMTQsMC4xNDk4ICIvPgogICA8cGF0aCBjbGFzcz0iZmlsMCIgZD0iTTMyLjU3ODQgNS4wNzI3Yy0wLjM5MTcsMC40MjI0IC0wLjg4OSwwLjYzMzQgLTEuNDkxMSwwLjYzMzQgLTAuNjE0NSwwIC0xLjExNzUsLTAuMjA5NiAtMS41MDcsLTAuNjI4NCAtMC4zOTEyLC0wLjQxOTQgLTAuNTg1OSwtMC45NDk4IC0wLjU4NTksLTEuNTkxMiAwLC0wLjYzMjQgMC4xOTgzLC0xLjE2MjggMC41OTQ0LC0xLjU5MTQgMC4zOTY3LC0wLjQyOCAwLjg5NiwtMC42NDIxIDEuNDk4NiwtMC42NDIxIDAuNTkzMSwwIDEuMDg3NSwwLjIxNDggMS40ODQxLDAuNjQ0NiAwLjM5NjcsMC40Mjk4IDAuNTk0MiwwLjk1OTIgMC41OTQyLDEuNTg4OSAwLDAuNjM1NSAtMC4xOTU0LDEuMTY0NSAtMC41ODcyLDEuNTg2M3ptMS43ODU3IC0yLjkzMDFjLTAuMTc1NCwtMC40MjA3IC0wLjQzMDksLTAuNzk0NCAtMC43NjY3LC0xLjEyMTMgLTAuMzM2MSwtMC4zMjM2IC0wLjcyMjksLTAuNTc1MSAtMS4xNjAyLC0wLjc1MzQgLTAuNDM3MSwtMC4xNzg2IC0wLjg4NzQsLTAuMjY3OSAtMS4zNDk5LC0wLjI2NzkgLTAuNDY2NSwwIC0wLjkxOTYsMC4wODkyIC0xLjM1OTYsMC4yNjc5IC0wLjQ0MDcsMC4xNzgzIC0wLjgyNjksMC40Mjk5IC0xLjE2MDEsMC43NTM0IC0wLjEwMjgsMC4wOTkzIC0wLjE4MzgsMC4yMTEyIC0wLjI3MTYsMC4zMTg5bC0wLjI2ODEgMC4zNzUyYy0wLjA4MzYsMC4xMzgxIC0wLjE2OTMsMC4yNzQ5IC0wLjIzMiwwLjQyNDcgLTAuMTc1MywwLjQxOTQgLTAuMjYzMywwLjg2NzkgLTAuMjYzMywxLjM0NjIgMCwwLjUzMjUgMC4xMTExLDEuMDMwMyAwLjMzMzksMS40OTMzIDAuMjIyMSwwLjQ2MyAwLjU0MiwwLjg2MTEgMC45NTk2LDEuMTkzOSAwLjMyNCwwLjI1NzUgMC42ODAzLDAuNDU0NiAxLjA2OTIsMC41OTI3IDAuMzg5MSwwLjEzNzcgMC43ODY0LDAuMjA2MyAxLjE5MjEsMC4yMDYzIDAuNDYyNSwwIDAuOTEwOSwtMC4wODc2IDEuMzQzOSwtMC4yNjMzIDAuNDMyMywtMC4xNzU2IDAuODIxMywtMC40MjggMS4xNjYyLC0wLjc1NzkgMC4zMzMyLC0wLjMyMDkgMC41ODc5LC0wLjY5MzEgMC43NjQ4LC0xLjExNjggMC4xNzczLC0wLjQyMzUgMC4yNjYsLTAuODcyOSAwLjI2NiwtMS4zNDgxIDAsLTAuNDc1NCAtMC4wODgsLTAuOTIyOSAtMC4yNjQxLC0xLjM0Mzh6Ii8+CiAgIDxwYXRoIGNsYXNzPSJmaWwxIiBkPSJNMi4zOTE5IDEwLjIzNzhsLTAuNzY4NiAtMS43OTAzIDAuMjkwNyAwIDAuMzg1OSAwLjkxODJjMC4wMjI5LDAuMDUzMSAwLjA0MTcsMC4xMDI1IDAuMDU2NywwLjE0NzggMC4wMTQ4LDAuMDQ1IDAuMDI2NywwLjA4NzkgMC4wMzUzLDAuMTI4NyAwLjAxMDIsLTAuMDQzMyAwLjAyMzEsLTAuMDg3OCAwLjAzOSwtMC4xMzQ0IDAuMDE1NCwtMC4wNDYyIDAuMDM0LC0wLjA5MzggMC4wNTUyLC0wLjE0MjJsMC4zODQ5IC0wLjkxODIgMC4yODk2IDAgLTAuNzY4NiAxLjc5MDN6Ii8+CiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwxIiBwb2ludHM9IjQuMTg1Myw4LjQ0NzUgNC40NjU2LDguNDQ3NSA0LjQ2NTYsMTAuMTcwOCA0LjE4NTMsMTAuMTcwOCAiLz4KICAgPHBhdGggY2xhc3M9ImZpbDEiIGQ9Ik01LjQ5MDUgMTAuMTcwOGwwIC0xLjc5MTYgMS4wOTQ3IDEuMDUzNGMwLjAzMDIsMC4wMjk5IDAuMDYwMiwwLjA2MTYgMC4wOTA4LDAuMDk1NCAwLjAzMDMsMC4wMzM4IDAuMDYyNywwLjA3MTcgMC4wOTYzLDAuMTE0MmwwIC0xLjE5NDggMC4yNTkxIDAgMCAxLjc5MDMgLTEuMTE3IC0xLjA3MjFjLTAuMDI5OCwtMC4wMjkzIC0wLjA1ODcsLTAuMDU5OCAtMC4wODY1LC0wLjA5MTkgLTAuMDI4LC0wLjAzMjIgLTAuMDU0NCwtMC4wNjYgLTAuMDc5NSwtMC4xMDEybDAgMS4xOTgzIC0wLjI1NzggMHoiLz4KICAgPHBvbHlnb24gY2xhc3M9ImZpbDEiIHBvaW50cz0iOC4wNTYyLDguNDQ3NSA4LjMzNjIsOC40NDc1IDguMzM2MiwxMC4xNzA4IDguMDU2MiwxMC4xNzA4ICIvPgogICA8cG9seWdvbiBjbGFzcz0iZmlsMSIgcG9pbnRzPSI5LjM2MTMsMTAuMTcwOCA5LjM2MTMsOC40NDc1IDkuNjQxNCw4LjQ0NzUgOS42NDE0LDkuOTIgMTAuMjY3Niw5LjkyIDEwLjI2NzYsMTAuMTcwOCAiLz4KICAgPHBhdGggY2xhc3M9ImZpbDEiIGQ9Ik0xMi44NDI3IDkuMzEyNmMwLC0wLjA4NzEgLTAuMDE1OCwtMC4xNjk4IC0wLjA0NzUsLTAuMjQ4MyAtMC4wMzE3LC0wLjA3ODUgLTAuMDc3NSwtMC4xNDgyIC0wLjEzNywtMC4yMDk2IC0wLjA1ODMsLTAuMDYwNCAtMC4xMjU0LC0wLjEwNyAtMC4yMDE5LC0wLjEzOTMgLTAuMDc2NSwtMC4wMzI4IC0wLjE1NywtMC4wNDkgLTAuMjQxNywtMC4wNDkgLTAuMDg1LDAgLTAuMTY1NywwLjAxNjMgLTAuMjQyMSwwLjA0ODMgLTAuMDc2NSwwLjAzMjMgLTAuMTQ0OCwwLjA3ODkgLTAuMjA0MywwLjE0MDEgLTAuMDU5NiwwLjA2MDQgLTAuMTA1MywwLjEzIC0wLjEzNjQsMC4yMDg0IC0wLjAzMTUsMC4wNzg1IC0wLjA0NzIsMC4xNjE3IC0wLjA0NzIsMC4yNDk1IDAsMC4wODcyIDAuMDE1NiwwLjE2OTYgMC4wNDcyLDAuMjQ3MyAwLjAzMTEsMC4wNzc3IDAuMDc2OCwwLjE0NzEgMC4xMzY0LDAuMjA4NCAwLjA1OTUsMC4wNjExIDAuMTI3NywwLjEwNzkgMC4yMDM3LDAuMTQwMSAwLjA3NjMsMC4wMzIxIDAuMTU2OSwwLjA0ODIgMC4yNDI3LDAuMDQ4MiAwLjA4MzYsMCAwLjE2MzUsLTAuMDE2MSAwLjIzOTEsLTAuMDQ4MiAwLjA3NTcsLTAuMDMyMiAwLjE0MzksLTAuMDc5IDAuMjA0NSwtMC4xNDAxIDAuMDU5NSwtMC4wNjEzIDAuMTA1MywtMC4xMzA5IDAuMTM3LC0wLjIwOSAwLjAzMTgsLTAuMDc4MSAwLjA0NzUsLTAuMTYwNCAwLjA0NzUsLTAuMjQ2N3ptMC4yOTIgMGMwLDAuMTIyMyAtMC4wMjI4LDAuMjM4MiAtMC4wNjg3LDAuMzQ3NSAtMC4wNDYsMC4xMDkgLTAuMTEzLDAuMjA2MiAtMC4yMDA4LDAuMjkxOCAtMC4wODg4LDAuMDg1NSAtMC4xODg3LDAuMTUxIC0wLjMwMDEsMC4xOTY2IC0wLjExMTQsMC4wNDU1IC0wLjIyODQsMC4wNjgyIC0wLjM1MDUsMC4wNjgyIC0wLjEyNDIsMCAtMC4yNDI3LC0wLjAyMjkgLTAuMzU1MSwtMC4wNjg5IC0wLjExMjcsLTAuMDQ1NyAtMC4yMTIsLTAuMTExMSAtMC4yOTg0LC0wLjE5NTkgLTAuMDg3OCwtMC4wODU2IC0wLjE1NDcsLTAuMTgyNiAtMC4yMDAxLC0wLjI5MDggLTAuMDQ1NiwtMC4xMDgxIC0wLjA2ODIsLTAuMjI0NCAtMC4wNjgyLC0wLjM0ODQgMCwtMC4xMjMzIDAuMDIyNiwtMC4yMzkyIDAuMDY4MiwtMC4zNDg1IDAuMDQ1NCwtMC4xMDkgMC4xMTIzLC0wLjIwNjYgMC4yMDAxLC0wLjI5MyAwLjA4NzgsLTAuMDg1NiAwLjE4NzUsLTAuMTUwNiAwLjI5ODgsLTAuMTk1NCAwLjExMTYsLTAuMDQ0NyAwLjIyOTcsLTAuMDY3MiAwLjM1NDcsLTAuMDY3MiAwLjEyMzgsMCAwLjI0MTIsMC4wMjI1IDAuMzUyNCwwLjA2NzIgMC4xMTA4LDAuMDQ0OCAwLjIxMDYsMC4xMDk5IDAuMjk4MiwwLjE5NTQgMC4wODc4LDAuMDg3MSAwLjE1NDksMC4xODU0IDAuMjAwOCwwLjI5NDggMC4wNDU5LDAuMTA5NyAwLjA2ODcsMC4yMjUgMC4wNjg3LDAuMzQ2NnoiLz4KICAgPHBhdGggY2xhc3M9ImZpbDEiIGQ9Ik0xNC4xNTk2IDkuODI1OWwwLjIyMzYgLTAuMTAzN2MwLjAyMTIsMC4wNzcgMC4wNTk5LDAuMTM1NSAwLjExNjQsMC4xNzYyIDAuMDU2NSwwLjA0MDIgMC4xMjg5LDAuMDYwNiAwLjIxNjUsMC4wNjA2IDAuMDgzNCwwIDAuMTQ5NCwtMC4wMjMyIDAuMTk4NywtMC4wNjk0IDAuMDQ5MSwtMC4wNDY0IDAuMDczMywtMC4xMDg0IDAuMDczMywtMC4xODYxIDAsLTAuMTAxMSAtMC4wODM5LC0wLjE5MTQgLTAuMjUxOCwtMC4yNzA4IC0wLjAyMzUsLTAuMDExOCAtMC4wNDE2LC0wLjAyMDIgLTAuMDU0MiwtMC4wMjYgLTAuMTg5OSwtMC4wOTI1IC0wLjMxNjMsLTAuMTc2NCAtMC4zNzk1LC0wLjI1MDkgLTAuMDYzLC0wLjA3NSAtMC4wOTQ5LC0wLjE2NjcgLTAuMDk0OSwtMC4yNzQ5IDAsLTAuMTQwNyAwLjA0NzksLTAuMjU0MyAwLjE0MzEsLTAuMzQxNCAwLjA5NTUsLTAuMDg3MiAwLjIyMDUsLTAuMTMwNyAwLjM3NDgsLTAuMTMwNyAwLjEyNzEsMCAwLjIzMzcsMC4wMjQ1IDAuMzE5MSwwLjA3MzUgMC4wODU1LDAuMDQ4OCAwLjE0NSwwLjExOTQgMC4xNzc5LDAuMjExMmwtMC4yMTkzIDAuMTEzYy0wLjAzNDQsLTAuMDU0IC0wLjA3MjEsLTAuMDkzOCAtMC4xMTM2LC0wLjExODcgLTAuMDQwOSwtMC4wMjU0IC0wLjA4ODMsLTAuMDM3NyAtMC4xNDE3LC0wLjAzNzcgLTAuMDc1MiwwIC0wLjEzNSwwLjAxOTYgLTAuMTc5NSwwLjA1ODkgLTAuMDQ0MywwLjAzOSAtMC4wNjYyLDAuMDkxNyAtMC4wNjYyLDAuMTU3NiAwLDAuMTAzNyAwLjA5NzMsMC4yMDAxIDAuMjkxNywwLjI4OTUgMC4wMTQ5LDAuMDA3IDAuMDI2NiwwLjAxMjUgMC4wMzUzLDAuMDE2NSAwLjE3MDQsMC4wNzgzIDAuMjg3MywwLjE1NTIgMC4zNTA5LDAuMjMwMiAwLjA2MzMsMC4wNzQ4IDAuMDk1MiwwLjE2ODMgMC4wOTUyLDAuMjgwNyAwLDAuMTYzMiAtMC4wNTEyLDAuMjkyOCAtMC4xNTQsMC4zODkgLTAuMTAzLDAuMDk2MiAtMC4yNDE3LDAuMTQ0IC0wLjQxNjcsMC4xNDQgLTAuMTQ2OCwwIC0wLjI2NzEsLTAuMDMzNiAtMC4zNjA5LC0wLjEwMTIgLTAuMDk0LC0wLjA2NzQgLTAuMTU1MSwtMC4xNjM4IC0wLjE4NDIsLTAuMjg5NXoiLz4KICA8L2c+CiA8L2c+Cjwvc3ZnPgo=";
let tuttoLogoPngPromise = null;

function loadImageDataUrl(src){
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function getTuttoLogoPngDataUrl(){
  if(tuttoLogoPngPromise) return tuttoLogoPngPromise;
  tuttoLogoPngPromise = (async () => {
    const img = await loadImageDataUrl(TUTTO_LOGO_SVG_DATA_URI);
    const canvas = document.createElement('canvas');
    const scale = 4;
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  })().catch(error => {
    console.warn('No se pudo rasterizar el logo de Tutto:', error);
    return null;
  });
  return tuttoLogoPngPromise;
}

function drawPdfField(doc, x, y, w, h, label, value, opts={}){
  const fill = opts.fill || [255,255,255];
  const border = opts.border || [217,222,234];
  const radius = opts.radius || 3;
  doc.setDrawColor(...border);
  doc.setFillColor(...fill);
  doc.roundedRect(x, y, w, h, radius, radius, 'FD');
  doc.setFont('helvetica','bold');
  doc.setFontSize(opts.labelSize || 7.2);
  doc.setTextColor(107,114,128);
  doc.text(String(label || '').toUpperCase(), x+3, y+4.2);
  doc.setFont('helvetica', opts.valueBold ? 'bold' : 'normal');
  doc.setFontSize(opts.valueSize || 10);
  doc.setTextColor(17,24,39);
  const lines = doc.splitTextToSize(String(value || '—'), w-6);
  doc.text(lines.slice(0, opts.maxLines || 2), x+3, y+9.8);
}

function drawPdfHeaderFooter(doc, footer, form){
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(247,248,252);
  doc.rect(0, H-20, W, 20, 'F');
  doc.setDrawColor(225,228,236);
  doc.line(14, H-20, W-14, H-20);
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(95,99,104);
  const dirLines = doc.splitTextToSize(footer?.direccion || '', W-28);
  doc.text(dirLines.slice(0,2), W/2, H-13, {align:'center'});
  doc.text(footer?.contacto || '', W/2, H-7.7, {align:'center'});
  doc.setFontSize(7.2);
  doc.setTextColor(120,124,130);
  doc.text(`${footer?.preparado_texto || 'Documento preparado por:'} ${form?.responsable || ''}`, W/2, H-3.1, {align:'center'});
}

let data = {
  tipo:"Cotización",
  responsable:"Ricardo",
  items:[{kind:"item", desc:"", qty:1, price:0}]
};

function db(){ return window.supabaseClient; }

function validarSupabase(){
  if(!db()){
    showToast("No existe conexión Supabase. Revisa js/supabase.js", "err");
    console.error("No existe window.supabaseClient");
    return false;
  }
  return true;
}

function pad2(n){ return String(n).padStart(2,"0"); }
function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function formatoFechaNumero(fechaISO){
  const [y,m,d] = String(fechaISO || todayISO()).split("-");
  return `${d}-${m}-${y}`;
}
function crearNumeroDocumento(consecutivo, fechaISO){
  return `${pad2(consecutivo)}-${formatoFechaNumero(fechaISO)}`;
}

async function obtenerSiguienteNumeroDocumento(fechaISO){
  if(!validarSupabase()) return crearNumeroDocumento(1, fechaISO);

  const sufijo = formatoFechaNumero(fechaISO);
  const { data:rows, error } = await db()
    .from("cotizaciones")
    .select("numero")
    .eq("fecha", fechaISO);

  if(error){
    console.warn("No se pudo calcular consecutivo del día:", error);
    return crearNumeroDocumento(1, fechaISO);
  }

  let max = 0;
  (rows || []).forEach(r => {
    const numero = String(r.numero || "");
    if(!numero.endsWith(sufijo)) return;
    const primero = Number(numero.split("-")[0]);
    if(Number.isFinite(primero)) max = Math.max(max, primero);
  });

  return crearNumeroDocumento(max + 1, fechaISO);
}

async function initDates(){
  const now = new Date();
  const fecha = todayISO();
  $("fecha").value = fecha;

  const due = new Date(now);
  due.setDate(due.getDate()+5);
  $("vence").value = `${due.getFullYear()}-${pad2(due.getMonth()+1)}-${pad2(due.getDate())}`;

  $("numero").value = await obtenerSiguienteNumeroDocumento(fecha);
}

async function refrescarNumeroPorFecha(){
  const fecha = $("fecha").value || todayISO();
  $("numero").value = await obtenerSiguienteNumeroDocumento(fecha);
}

function currency(n){ return "$" + Number(n || 0).toFixed(2); }
function cleanText(v){ return String(v || "").trim(); }
function normalizar(valor){
  return String(valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
function nombreBonito(valor){
  const limpio = String(valor || "").trim().replace(/\s+/g, " ");
  if(!limpio) return "";
  return limpio.split(" ").map(p => p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "").join(" ");
}
function html(v){
  return String(v ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function itemTotal(item){ return Number(item.qty || 0) * Number(item.price || 0); }
function calcularTotales(items = data.items, ivaAplicado = $("ivaCheck")?.checked){
  const subtotal = (items || []).reduce((acc,it)=> acc + (it.kind === "item" ? itemTotal(it) : 0), 0);
  const iva = ivaAplicado ? subtotal * 0.16 : 0;
  return {subtotal, iva, total: subtotal + iva};
}
function totals(){ return calcularTotales(data.items, $("ivaCheck").checked); }
function updateTotals(){
  const t = totals();
  $("subtotal").textContent = currency(t.subtotal);
  $("iva").textContent = currency(t.iva);
  $("total").textContent = currency(t.total);
}
function updateItemVisualTotal(index){
  const item = data.items[index];
  if(!item) return;
  const total = itemTotal(item);
  document.querySelectorAll(`[data-total-index="${index}"]`).forEach(el => {
    if(el.tagName === "INPUT") el.value = total.toFixed(2);
    else el.textContent = currency(total);
  });
}

function render(){
  data.tipo = $("tipoDocumento").value;
  data.responsable = $("responsable").value;
  $("banner").textContent = data.tipo;
  $("creditName").textContent = data.responsable;

  const tbody = $("tbody");
  const mobile = $("mobileItems");
  tbody.innerHTML = "";
  mobile.innerHTML = "";

  let visibleNumber = 1;
  data.items.forEach((item,index)=>{
    if(item.kind === "separator"){
      tbody.insertAdjacentHTML("beforeend", `
        <tr>
          <td class="num"></td>
          <td colspan="4"><input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc" style="text-align:center;font-weight:900;color:var(--azulOsc)"></td>
          <td class="center"><button class="btn btn-red" data-remove="${index}" type="button">✕</button></td>
        </tr>
      `);
      mobile.insertAdjacentHTML("beforeend", `
        <div class="item-card">
          <div class="item-head"><span>Separador</span><button class="btn btn-red" data-remove="${index}" type="button">✕</button></div>
          <div class="item-body"><div class="field"><label>Título de sección</label><input value="${html(item.desc)}" placeholder="Título de sección" data-index="${index}" data-field="desc"></div></div>
        </div>
      `);
      return;
    }

    const number = visibleNumber++;
    const total = itemTotal(item);
    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td class="num">${number}</td>
        <td class="desc"><input value="${html(item.desc)}" placeholder="Descripción" data-index="${index}" data-field="desc"></td>
        <td class="center"><input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty"></td>
        <td class="center"><input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price"></td>
        <td class="center total-cell"><input readonly data-total-index="${index}" value="${total.toFixed(2)}"></td>
        <td class="center"><button class="btn btn-red" data-remove="${index}" type="button">✕</button></td>
      </tr>
    `);
    mobile.insertAdjacentHTML("beforeend", `
      <div class="item-card">
        <div class="item-head"><span>Ítem ${number}</span><button class="btn btn-red" data-remove="${index}" type="button">✕</button></div>
        <div class="item-body">
          <div class="field"><label>Descripción</label><input value="${html(item.desc)}" placeholder="Descripción del producto o servicio" data-index="${index}" data-field="desc"></div>
          <div class="item-grid">
            <div class="field"><label>Cantidad</label><input type="number" min="0" step="0.01" value="${item.qty}" data-index="${index}" data-field="qty"></div>
            <div class="field"><label>P. Unit ($)</label><input type="number" min="0" step="0.01" value="${item.price}" data-index="${index}" data-field="price"></div>
          </div>
          <div class="item-total"><span>Total ítem</span><b data-total-index="${index}">${currency(total)}</b></div>
        </div>
      </div>
    `);
  });

  updateTotals();
}

function addItem(){ data.items.push({kind:"item", desc:"", qty:1, price:0}); render(); }
function addSeparator(){ data.items.push({kind:"separator", desc:""}); render(); }
function removeItem(index){
  if(data.items.length <= 1) data.items = [{kind:"item", desc:"", qty:1, price:0}];
  else data.items.splice(index,1);
  render();
}

function getFooter(){
  return {
    direccion: cleanText($("footerDireccion")?.innerText || ""),
    contacto: cleanText($("footerContacto")?.innerText || ""),
    preparado_texto: cleanText($("footerPreparadoTexto")?.innerText || "Documento preparado por:")
  };
}
function getForm(){
  return {
    tipo: $("tipoDocumento").value,
    responsable: $("responsable").value,
    fecha: $("fecha").value,
    numero: cleanText($("numero").value || ""),
    vence: $("vence").value,
    cliente: nombreBonito($("cliente").value),
    rif: cleanText($("rif").value),
    telefono: cleanText($("telefono").value),
    email: cleanText($("email").value),
    direccion: cleanText($("direccion").value),
    notas: cleanText($("notas").value),
    iva: $("ivaCheck").checked,
    footer: getFooter()
  };
}
function crearSnapshotActual(){
  const form = getForm();
  const items = JSON.parse(JSON.stringify(data.items || []));
  const t = calcularTotales(items, form.iva);
  return {form, items, totals:t, footer:form.footer};
}

function showToast(msg,type="ok"){
  const t = $("toast");
  if(!t){ alert(msg); return; }
  t.textContent = msg;
  t.className = "toast " + type + " show";
  setTimeout(()=>{ t.className = "toast"; }, 3600);
}

async function cargarClientesCotizador(){
  if(!validarSupabase()) return;
  const { data:clientes, error } = await db()
    .from("clientes")
    .select("id,nombre,rif_cedula,telefono,correo,direccion,tipo_cliente,notas,activo")
    .order("nombre", { ascending:true });

  if(error){
    console.error("Error cargando clientes:", error);
    showToast("Error cargando clientes", "err");
    return;
  }
  clientesDB = clientes || [];
  renderClientesDatalist();
}
function renderClientesDatalist(){
  const lista = $("clientesList");
  if(!lista) return;
  lista.innerHTML = clientesDB
    .filter(c => c.activo !== false)
    .map(c => `<option value="${html(c.nombre || "")}"></option>`)
    .join("");
}
function buscarClientePorNombre(nombre){
  const n = normalizar(nombre);
  if(!n) return null;
  return clientesDB.find(c => normalizar(c.nombre) === n) || null;
}
function llenarDatosCliente(cliente){
  if(!cliente) return;
  $("rif").value = cliente.rif_cedula || "";
  $("telefono").value = cliente.telefono || "";
  $("email").value = cliente.correo || "";
  $("direccion").value = cliente.direccion || "";
  const mini = $("clienteMini");
  if(mini) mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
}
function revisarClienteActual(){
  const nombre = $("cliente").value;
  const cliente = buscarClientePorNombre(nombre);
  const mini = $("clienteMini");
  if(cliente) llenarDatosCliente(cliente);
  else if(mini) mini.innerHTML = nombre.trim() ? `Cliente nuevo: se guardará automáticamente en clientes.` : `Escribe para buscar o crear cliente nuevo.`;
}
async function guardarOActualizarClienteDesdeCotizacion(){
  if(!validarSupabase()) throw new Error("No hay conexión Supabase.");
  const form = getForm();
  const nombre = nombreBonito(form.cliente);
  if(!nombre) throw new Error("Coloca el nombre del cliente.");

  const existente = buscarClientePorNombre(nombre);
  const datosCliente = {
    nombre,
    rif_cedula: form.rif || "",
    telefono: form.telefono || "",
    correo: form.email || "",
    direccion: form.direccion || "",
    tipo_cliente: existente?.tipo_cliente || "Cliente Básico",
    activo: true
  };

  if(existente){
    const { data:actualizado, error } = await db()
      .from("clientes")
      .update(datosCliente)
      .eq("id", existente.id)
      .select()
      .single();
    if(error) throw error;
    const idx = clientesDB.findIndex(c => Number(c.id) === Number(existente.id));
    if(idx >= 0) clientesDB[idx] = actualizado;
    return actualizado;
  }

  const { data:nuevo, error } = await db()
    .from("clientes")
    .insert([datosCliente])
    .select()
    .single();
  if(error) throw error;
  clientesDB.push(nuevo);
  renderClientesDatalist();
  return nuevo;
}

function normalizarSnapshotDesdeRegistro(reg){
  const raw = reg?.items;
  let rows = [];
  let footer = null;
  let ivaAplicado = Number(reg?.iva || 0) > 0;

  if(Array.isArray(raw)){
    rows = raw;
  }else if(raw && typeof raw === "object"){
    rows = Array.isArray(raw.rows) ? raw.rows : (Array.isArray(raw.items) ? raw.items : []);
    footer = raw.footer || null;
    if(typeof raw.iva_aplicado === "boolean") ivaAplicado = raw.iva_aplicado;
  }

  const form = {
    tipo: reg?.tipo_documento || "Cotización",
    responsable: reg?.responsable || "",
    fecha: reg?.fecha || "",
    numero: reg?.numero || "",
    vence: reg?.vence || "",
    cliente: reg?.cliente || "",
    rif: reg?.rif_cedula || "",
    telefono: reg?.telefono || "",
    email: reg?.correo || "",
    direccion: reg?.direccion || "",
    notas: reg?.notas || "",
    iva: ivaAplicado,
    footer: footer || {
      direccion:"Avenida Universidad, Urbanización La Granja, Edificio Diario El Carabobeño, en el Municipio Naguanagua del estado Carabobo,",
      contacto:"Tel: (0414) 414.30.04 | tuttovinilos@gmail.com",
      preparado_texto:"Documento preparado por:"
    }
  };
  const t = {
    subtotal:Number(reg?.subtotal || calcularTotales(rows, ivaAplicado).subtotal),
    iva:Number(reg?.iva || calcularTotales(rows, ivaAplicado).iva),
    total:Number(reg?.total || calcularTotales(rows, ivaAplicado).total)
  };
  return {form, items:rows, totals:t, footer:form.footer};
}

async function crearDocumentoPDF(snapshot = crearSnapshotActual()){
  if(!window.jspdf || !window.jspdf.jsPDF) throw new Error("No cargó la librería PDF.");

  const form = snapshot.form;
  const items = snapshot.items || [];
  const t = snapshot.totals || calcularTotales(items, form.iva);
  const footer = snapshot.footer || form.footer || getFooter();

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({orientation:"portrait", unit:"mm", format:"letter"});
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const blue = [21,59,255];
  const blueDark = [11,31,122];
  const lightBlue = [238,241,255];
  const line = [217,222,234];
  const panel = [249,250,252];

  doc.setFillColor(...blue);
  doc.rect(0, 0, W, 30, 'F');

  doc.setFillColor(255,255,255);
  doc.roundedRect(14, 8, 44, 11, 4, 4, 'F');

  const logoDataUrl = await getTuttoLogoPngDataUrl();
  if(logoDataUrl){
    try{
      doc.addImage(logoDataUrl, 'PNG', 16, 10.2, 39.5, 6.9, undefined, 'FAST');
    }catch(error){
      console.warn('No se pudo insertar el logo en el PDF:', error);
      doc.setFont('helvetica','bold');
      doc.setFontSize(14);
      doc.setTextColor(...blue);
      doc.text('TUTTO VINILOS', 36, 15.2, {align:'center'});
    }
  }else{
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.setTextColor(...blue);
    doc.text('TUTTO VINILOS', 36, 15.2, {align:'center'});
  }

  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.text('Tel: 0414-414-3004', W-14, 10.8, {align:'right'});
  doc.text('Email: tuttovinilos@gmail.com', W-14, 15.4, {align:'right'});
  doc.text('RIF: ____________', W-14, 20, {align:'right'});

  doc.setFillColor(...blueDark);
  doc.roundedRect(14, 35, W-28, 11, 4, 4, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(15);
  doc.setTextColor(255,255,255);
  doc.text((form.tipo || 'Cotización').toUpperCase(), W/2, 42.2, {align:'center'});

  drawPdfField(doc, 14, 50, 54, 14, 'Fecha', form.fecha || '');
  drawPdfField(doc, 71, 50, 62, 14, 'N° Documento', form.numero || '', {valueBold:true});
  drawPdfField(doc, 136, 50, 62, 14, 'Válido hasta', form.vence || '');

  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...blue);
  doc.text('DATOS DEL CLIENTE', 14, 72.5);
  doc.setDrawColor(...line);
  doc.line(14, 74.2, W-14, 74.2);

  drawPdfField(doc, 14, 77, 92, 17, 'Cliente', form.cliente || '', {valueBold:true, valueSize:10.5});
  drawPdfField(doc, 109, 77, 89, 17, 'RIF / Cédula', form.rif || '', {valueSize:10.2});
  drawPdfField(doc, 14, 97, 92, 17, 'Email', form.email || '', {valueSize:9.2, maxLines:2});
  drawPdfField(doc, 109, 97, 89, 17, 'Teléfono', form.telefono || '', {valueSize:10.2});
  drawPdfField(doc, 14, 117, 184, 17, 'Dirección', form.direccion || '', {valueSize:9.4, maxLines:2});

  let count = 1;
  const body = items.map(item => {
    if(item.kind === 'separator'){
      return [{
        content:item.desc || 'SECCIÓN',
        colSpan:5,
        styles:{
          halign:'center',
          fontStyle:'bold',
          fillColor:[232,236,255],
          textColor:[11,31,122]
        }
      }];
    }
    const total = itemTotal(item);
    return [
      String(count++),
      item.desc || '',
      String(item.qty || 0),
      '$' + Number(item.price || 0).toFixed(2),
      '$' + total.toFixed(2)
    ];
  });

  doc.autoTable({
    startY: 141,
    head: [["#","DESCRIPCIÓN DEL PRODUCTO / SERVICIO","CANT.","P. UNIT ($)","TOTAL ($)"]],
    body,
    theme: 'grid',
    margin: {left:14, right:14, bottom:26},
    styles: {
      font:'helvetica',
      fontSize:8.5,
      cellPadding:3.2,
      textColor:[17,17,17],
      lineColor:[217,222,234],
      lineWidth:0.2,
      overflow:'linebreak',
      valign:'middle'
    },
    headStyles: {
      fillColor:[243,245,252],
      textColor:[17,17,17],
      fontStyle:'bold',
      halign:'center',
      fontSize:7.7
    },
    columnStyles: {
      0:{halign:'center', cellWidth:12, fontStyle:'bold', textColor:[220,38,38]},
      1:{cellWidth:'auto'},
      2:{halign:'center', cellWidth:19},
      3:{halign:'center', cellWidth:28},
      4:{halign:'center', cellWidth:30, fontStyle:'bold', textColor:[21,59,255]}
    },
    alternateRowStyles:{fillColor:[252,252,254]},
    didDrawPage: () => {
      drawPdfHeaderFooter(doc, footer, form);
    }
  });

  let fy = doc.lastAutoTable.finalY + 6;
  const notesH = form.notas ? 33 : 18;
  const rightBoxH = Number(t.iva || 0) > 0 ? 33 : 25;
  if(fy > H - Math.max(notesH, rightBoxH) - 26){
    doc.addPage();
    fy = 20;
  }

  const leftW = 126;
  const rightX = 145;
  const rightW = W - rightX - 14;

  if(form.notas){
    doc.setDrawColor(...line);
    doc.setFillColor(252,252,254);
    doc.roundedRect(14, fy, leftW, 33, 3, 3, 'FD');
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.setTextColor(...blueDark);
    doc.text('NOTAS / CONDICIONES', 17, fy + 5.5);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8.4);
    doc.setTextColor(70,74,82);
    const lines = doc.splitTextToSize(form.notas, leftW - 6);
    doc.text(lines.slice(0, 7), 17, fy + 11);
  }

  doc.setDrawColor(...line);
  doc.setFillColor(255,255,255);
  doc.roundedRect(rightX, fy, rightW, rightBoxH, 3, 3, 'FD');

  let rowY = fy;
  const drawSummaryRow = (label, value, fill, txtColor, bold=false, size=9.2, white=false) => {
    doc.setFillColor(...fill);
    doc.rect(rightX, rowY, rightW, 8, 'F');
    doc.setDrawColor(...line);
    doc.rect(rightX, rowY, rightW, 8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...txtColor);
    doc.text(label, rightX + 3, rowY + 5.4);
    doc.text(value, rightX + rightW - 3, rowY + 5.4, {align:'right'});
    rowY += 8;
  };

  drawSummaryRow('Sub Total', currency(t.subtotal), [255,255,255], [17,24,39], true);
  if(Number(t.iva || 0) > 0){
    drawSummaryRow('IVA 16%', currency(t.iva), [255,255,255], [17,24,39], true);
  }
  doc.setFillColor(...blue);
  doc.roundedRect(rightX, rowY, rightW, 10, 0, 0, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(12);
  doc.setTextColor(255,255,255);
  doc.text('TOTAL', rightX + 3, rowY + 6.7);
  doc.text(currency(t.total), rightX + rightW - 3, rowY + 6.7, {align:'right'});

  drawPdfHeaderFooter(doc, footer, form);
  return doc;
}

function nombreArchivoPDF(snapshot){
  const form = snapshot.form || getForm();
  const clientName = (form.cliente || "cliente").replace(/[^\wáéíóúÁÉÍÓÚñÑ-]+/g,"_").slice(0,60);
  const tipo = (form.tipo || "Cotizacion").replace(/\s+/g,"_");
  return `${tipo}_Tuttovinilos_${form.numero || "sin_numero"}_${clientName}.pdf`;
}


function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, mime="application/pdf"){
  const clean = String(base64 || "").includes(",") ? String(base64).split(",").pop() : String(base64 || "");
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for(let i=0;i<len;i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {type:mime});
}

function abrirBlobPdf(blob){
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

async function numeroExiste(numero){
  const { data:rows, error } = await db().from("cotizaciones").select("id").eq("numero", numero).limit(1);
  if(error) throw error;
  return (rows || []).length > 0;
}
async function asegurarNumeroDisponible(){
  const form = getForm();
  if(!form.numero){
    $("numero").value = await obtenerSiguienteNumeroDocumento(form.fecha || todayISO());
    return;
  }
  if(await numeroExiste(form.numero)){
    $("numero").value = await obtenerSiguienteNumeroDocumento(form.fecha || todayISO());
  }
}

async function guardarRegistroCotizacionTexto(clienteGuardado, pdfInfo = null){
  const snapshot = crearSnapshotActual();
  const form = snapshot.form;
  const t = snapshot.totals;

  const registroBase = {
    fecha: form.fecha || null,
    numero: form.numero,
    tipo_documento: form.tipo,
    cliente_id: clienteGuardado?.id || null,
    cliente: form.cliente,
    rif_cedula: form.rif,
    telefono: form.telefono,
    correo: form.email,
    direccion: form.direccion,
    responsable: form.responsable,
    vence: form.vence || null,
    items: {
      version: 3,
      modo: "texto_json_mas_pdf_base64",
      rows: snapshot.items,
      footer: snapshot.footer,
      iva_aplicado: form.iva
    },
    notas: form.notas,
    subtotal: Number(t.subtotal.toFixed(2)),
    iva: Number(t.iva.toFixed(2)),
    total: Number(t.total.toFixed(2)),
    pdf_path: "",
    pdf_url: ""
  };

  const registroConPdf = {
    ...registroBase,
    pdf_base64: pdfInfo?.base64 || "",
    pdf_mime: pdfInfo?.mime || "application/pdf",
    pdf_nombre: pdfInfo?.nombre || ""
  };

  let res = await db()
    .from("cotizaciones")
    .insert([registroConPdf])
    .select()
    .single();

  if(res.error){
    const msg = String(res.error.message || "");
    const faltaColumnasPdf = msg.includes("pdf_base64") || msg.includes("pdf_mime") || msg.includes("pdf_nombre") || msg.includes("schema cache");
    if(!faltaColumnasPdf) throw res.error;

    console.warn("Faltan columnas PDF en cotizaciones. Guardando solo texto:", res.error);
    res = await db()
      .from("cotizaciones")
      .insert([registroBase])
      .select()
      .single();

    if(res.error) throw res.error;
    showToast("Guardó texto. Para guardar PDF aplica el SQL de columnas PDF.", "warn");
  }

  return res.data;
}

async function createPDF(){
  const btn = $("pdfBtn");
  try{
    if(!validarSupabase()) return;
    let form = getForm();
    if(!form.cliente){ showToast("Coloca el nombre del cliente", "err"); return; }
    if(!data.items.some(it => it.kind === "item" && cleanText(it.desc))){ showToast("Agrega al menos un ítem con descripción", "err"); return; }

    btn.classList.add("loading"); btn.disabled = true;

    await asegurarNumeroDisponible();
    form = getForm();
    const clienteGuardado = await guardarOActualizarClienteDesdeCotizacion();

    const snapshot = crearSnapshotActual();
    const doc = await crearDocumentoPDF(snapshot);
    const pdfBlob = doc.output("blob");
    const pdfNombre = nombreArchivoPDF(snapshot);
    const pdfBase64 = await blobToBase64(pdfBlob);

    await guardarRegistroCotizacionTexto(clienteGuardado, {
      base64: pdfBase64,
      mime: "application/pdf",
      nombre: pdfNombre
    });

    doc.save(pdfNombre);

    showToast("Cotización guardada con texto + PDF en Supabase", "ok");
    await cargarCotizacionesPrevias();
    await refrescarNumeroPorFecha();
  }catch(err){
    console.error(err);
    showToast("Error: " + (err.message || err), "err");
  }finally{
    btn.classList.remove("loading"); btn.disabled = false;
  }
}

async function cargarCotizacionesPrevias(){
  if(!validarSupabase()) return;
  const body = $("cotizacionesBody");
  if(body) body.innerHTML = `<tr><td colspan="6" class="empty">Cargando...</td></tr>`;

  const { data:rows, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,pdf_mime,created_at")
    .order("created_at", { ascending:false })
    .limit(150);

  if(error){
    console.error("Error cargando cotizaciones:", error);
    if(body) body.innerHTML = `<tr><td colspan="6" class="empty">Error cargando cotizaciones</td></tr>`;
    showToast("Error cargando cotizaciones", "err");
    return;
  }
  cotizacionesDB = rows || [];
  renderCotizacionesPrevias();
}
function renderCotizacionesPrevias(){
  const body = $("cotizacionesBody");
  if(!body) return;
  const q = normalizar($("buscarCotizaciones")?.value || "");
  let lista = [...cotizacionesDB];
  if(q){
    lista = lista.filter(c => normalizar([c.fecha,c.numero,c.cliente,c.telefono,c.total,c.tipo_documento].join(" ")).includes(q));
  }
  if(!lista.length){
    body.innerHTML = `<tr><td colspan="6" class="empty">Sin cotizaciones</td></tr>`;
    return;
  }
  body.innerHTML = lista.map(c => `
    <tr>
      <td>${html(c.fecha || "")}</td>
      <td><b>${html(c.numero || "")}</b></td>
      <td>${html(c.cliente || "")}</td>
      <td>${html(c.telefono || "")}</td>
      <td><b>${currency(c.total || 0)}</b></td>
      <td class="center">
        <button class="mini-btn dark" type="button" data-ver-cot="${Number(c.id)}">Abrir</button>
        <button class="mini-btn" type="button" data-pdf-cot="${Number(c.id)}">${c.pdf_nombre ? "Abrir PDF" : "Generar PDF"}</button>
      </td>
    </tr>
  `).join("");
}
function buscarCotizacionPorId(id){ return cotizacionesDB.find(c => Number(c.id) === Number(id)) || null; }

async function obtenerCotizacionCompleta(id){
  let reg = buscarCotizacionPorId(id);
  if(reg && Object.prototype.hasOwnProperty.call(reg, "pdf_base64")) return reg;

  const { data:full, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_base64,pdf_mime,pdf_nombre,created_at")
    .eq("id", id)
    .single();

  if(error) throw error;
  if(full){
    cotizacionesDB = cotizacionesDB.map(c => Number(c.id) === Number(id) ? {...c, ...full} : c);
    return full;
  }
  return reg;
}
function abrirDetalleCotizacion(id){
  const reg = buscarCotizacionPorId(id);
  if(!reg){ showToast("No se encontró la cotización", "err"); return; }
  cotizacionSeleccionada = reg;
  const snap = normalizarSnapshotDesdeRegistro(reg);
  const form = snap.form;
  $("detalleTitle").textContent = `${form.tipo || "Cotización"} · ${form.numero || ""}`;
  const itemsHtml = (snap.items || []).map((it, i) => {
    if(it.kind === "separator") return `<div class="detail-item"><b>${html(it.desc || "SECCIÓN")}</b></div>`;
    return `<div class="detail-item"><b>${i+1}. ${html(it.desc || "")}</b><br>Cant: ${html(it.qty || 0)} · P.Unit: ${currency(it.price || 0)} · Total: ${currency(itemTotal(it))}</div>`;
  }).join("");
  $("detalleBody").innerHTML = `
    <div class="detail-list">
      <div class="detail-item"><b>Cliente:</b> ${html(form.cliente || "")}<br><b>Teléfono:</b> ${html(form.telefono || "")}<br><b>Correo:</b> ${html(form.email || "")}<br><b>Dirección:</b> ${html(form.direccion || "")}</div>
      <div class="detail-item"><b>Fecha:</b> ${html(form.fecha || "")} · <b>Vence:</b> ${html(form.vence || "")}<br><b>Responsable:</b> ${html(form.responsable || "")}</div>
      ${itemsHtml || `<div class="empty">Sin ítems</div>`}
      <div class="detail-item"><b>Notas:</b><br>${html(form.notas || "—")}</div>
      <div class="detail-item"><b>Subtotal:</b> ${currency(snap.totals.subtotal)}<br><b>IVA:</b> ${currency(snap.totals.iva)}<br><b>Total:</b> ${currency(snap.totals.total)}</div>
    </div>
  `;
  $("detalleBackdrop").style.display = "flex";
}
function cerrarDetalle(){
  $("detalleBackdrop").style.display = "none";
  cotizacionSeleccionada = null;
}
async function generarPdfDesdeCotizacion(id){
  try{
    const base = id ? buscarCotizacionPorId(id) : cotizacionSeleccionada;
    if(!base){ showToast("No se encontró la cotización", "err"); return; }

    const reg = await obtenerCotizacionCompleta(base.id);

    if(reg?.pdf_base64){
      const blob = base64ToBlob(reg.pdf_base64, reg.pdf_mime || "application/pdf");
      abrirBlobPdf(blob);
      showToast("PDF guardado abierto", "ok");
      return;
    }

    const snap = normalizarSnapshotDesdeRegistro(reg);
    const doc = await crearDocumentoPDF(snap);
    doc.save(nombreArchivoPDF(snap));
    showToast("Esta cotización no tenía PDF guardado; se generó desde el texto", "warn");
  }catch(error){
    console.error(error);
    showToast("No se pudo abrir/generar el PDF", "err");
  }
}
function cargarCotizacionEnFormulario(){
  if(!cotizacionSeleccionada) return;
  const snap = normalizarSnapshotDesdeRegistro(cotizacionSeleccionada);
  const f = snap.form;
  $("tipoDocumento").value = f.tipo || "Cotización";
  $("responsable").value = f.responsable || $("responsable").value;
  $("fecha").value = f.fecha || todayISO();
  $("numero").value = f.numero || "";
  $("vence").value = f.vence || "";
  $("cliente").value = f.cliente || "";
  $("rif").value = f.rif || "";
  $("telefono").value = f.telefono || "";
  $("email").value = f.email || "";
  $("direccion").value = f.direccion || "";
  $("notas").value = f.notas || "";
  $("ivaCheck").checked = !!f.iva;
  if(f.footer){
    $("footerDireccion").innerText = f.footer.direccion || $("footerDireccion").innerText;
    $("footerContacto").innerText = f.footer.contacto || $("footerContacto").innerText;
    $("footerPreparadoTexto").innerText = f.footer.preparado_texto || $("footerPreparadoTexto").innerText;
  }
  data.items = JSON.parse(JSON.stringify(snap.items && snap.items.length ? snap.items : [{kind:"item", desc:"", qty:1, price:0}]));
  render();
  cerrarDetalle();
  activarTab("nueva");
  showToast("Cotización cargada para editar", "ok");
}

function clearAll(){
  if(!confirm("¿Seguro que deseas limpiar todo?")) return;
  data.items = [{kind:"item", desc:"", qty:1, price:0}];
  $("cliente").value = ""; $("rif").value = ""; $("telefono").value = ""; $("email").value = ""; $("direccion").value = ""; $("notas").value = ""; $("ivaCheck").checked = false;
  $("clienteMini").textContent = "Escribe para buscar o crear cliente nuevo.";
  initDates().then(()=>{ render(); updateTotals(); });
}
function setResponsableDesdeSesion(){
  try{
    if(typeof window.getSesionOperador !== "function") return;
    const op = window.getSesionOperador();
    const nombre = op?.nombre || "";
    if(!nombre) return;
    const select = $("responsable");
    const existe = [...select.options].some(o => normalizar(o.value) === normalizar(nombre));
    if(!existe){ const opt = document.createElement("option"); opt.value = nombre; opt.textContent = "👤 " + nombre; select.appendChild(opt); }
    select.value = [...select.options].find(o => normalizar(o.value) === normalizar(nombre))?.value || select.value;
  }catch(error){ console.warn("No se pudo tomar responsable desde sesión", error); }
}
function activarTab(cual){
  const nueva = cual === "nueva";
  $("tabNueva").classList.toggle("active", nueva);
  $("tabPrevias").classList.toggle("active", !nueva);
  $("panelNueva").classList.toggle("active", nueva);
  $("panelPrevias").classList.toggle("active", !nueva);
  if(!nueva) cargarCotizacionesPrevias();
}
function bindEvents(){
  document.addEventListener("input", (e)=>{
    if(e.target.matches("[data-index][data-field]")){
      const index = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      const value = e.target.value;
      if(!data.items[index]) return;
      if(field === "qty" || field === "price") data.items[index][field] = Number(value || 0);
      else data.items[index][field] = value;
      updateItemVisualTotal(index);
      updateTotals();
    }
  });
  document.addEventListener("change", async (e)=>{
    if(e.target.id === "tipoDocumento" || e.target.id === "responsable") render();
    if(e.target.id === "ivaCheck") updateTotals();
    if(e.target.id === "fecha") await refrescarNumeroPorFecha();
  });
  document.addEventListener("click", (e)=>{
    const remove = e.target.closest("[data-remove]");
    if(remove){ removeItem(Number(remove.dataset.remove)); return; }
    const ver = e.target.closest("[data-ver-cot]");
    if(ver){ abrirDetalleCotizacion(Number(ver.dataset.verCot)); return; }
    const pdf = e.target.closest("[data-pdf-cot]");
    if(pdf){ generarPdfDesdeCotizacion(Number(pdf.dataset.pdfCot)); return; }
  });

  $("cliente").addEventListener("change", revisarClienteActual);
  $("cliente").addEventListener("blur", revisarClienteActual);
  $("cliente").addEventListener("input", ()=>{
    const mini = $("clienteMini");
    const cliente = buscarClientePorNombre($("cliente").value);
    if(cliente) mini.innerHTML = `Cliente encontrado: <b>${html(cliente.nombre)}</b>`;
    else mini.textContent = $("cliente").value.trim() ? "Cliente nuevo: se guardará automáticamente en clientes." : "Escribe para buscar o crear cliente nuevo.";
  });

  $("addItem").addEventListener("click", addItem);
  $("addSep").addEventListener("click", addSeparator);
  $("pdfBtn").addEventListener("click", createPDF);
  $("printBtn").addEventListener("click", ()=>window.print());
  $("clearBtn").addEventListener("click", clearAll);
  $("tabNueva").addEventListener("click", ()=>activarTab("nueva"));
  $("tabPrevias").addEventListener("click", ()=>activarTab("previas"));
  $("recargarCotizaciones").addEventListener("click", cargarCotizacionesPrevias);
  $("buscarCotizaciones").addEventListener("input", renderCotizacionesPrevias);
  $("cerrarDetalle").addEventListener("click", cerrarDetalle);
  $("detalleBackdrop").addEventListener("click", (e)=>{ if(e.target.id === "detalleBackdrop") cerrarDetalle(); });
  $("pdfDetalle").addEventListener("click", ()=>generarPdfDesdeCotizacion());
  $("cargarDetalleForm").addEventListener("click", cargarCotizacionEnFormulario);
}
async function iniciarCotizador(){
  setResponsableDesdeSesion();
  await initDates();
  render();
  bindEvents();
  await cargarClientesCotizador();
  await cargarCotizacionesPrevias();
}
document.addEventListener("DOMContentLoaded", iniciarCotizador);
