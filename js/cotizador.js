console.log("COTIZADOR JS conectado v38 responsable en cotizaciones previas");

const $ = (id) => document.getElementById(id);

let clientesDB = [];
let cotizacionesDB = [];
let cotizacionSeleccionada = null;

const TUTTO_LOGO_SVG_DATA_URI = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DQo8IS0tIENyZWF0b3I6IENvcmVsRFJBVyAyMDIwICg2NC1CaXQpIC0tPg0KPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIHdpZHRoPSI2MG1tIiBoZWlnaHQ9IjE3LjczOW1tIiB2ZXJzaW9uPSIxLjEiIHN0eWxlPSJzaGFwZS1yZW5kZXJpbmc6Z2VvbWV0cmljUHJlY2lzaW9uOyB0ZXh0LXJlbmRlcmluZzpnZW9tZXRyaWNQcmVjaXNpb247IGltYWdlLXJlbmRlcmluZzpvcHRpbWl6ZVF1YWxpdHk7IGZpbGwtcnVsZTpldmVub2RkOyBjbGlwLXJ1bGU6ZXZlbm9kZCINCnZpZXdCb3g9IjAgMCAwLjY0NiAwLjE5MSINCiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayINCiB4bWxuczp4b2RtPSJodHRwOi8vd3d3LmNvcmVsLmNvbS9jb3JlbGRyYXcvb2RtLzIwMDMiPg0KIDxkZWZzPg0KICA8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KICAgPCFbQ0RBVEFbDQogICAgLmZpbDEge2ZpbGw6I0Y5N0E1NDtmaWxsLXJ1bGU6bm9uemVyb30NCiAgICAuZmlsMCB7ZmlsbDp3aGl0ZTtmaWxsLXJ1bGU6bm9uemVyb30NCiAgIF1dPg0KICA8L3N0eWxlPg0KIDwvZGVmcz4NCiA8ZyBpZD0iQ2FwYV94MDAyMF8xIj4NCiAgPG1ldGFkYXRhIGlkPSJDb3JlbENvcnBJRF8wQ29yZWwtTGF5ZXIiLz4NCiAgPGcgaWQ9Il8xNTY0OTUzMzQzNzEyIj4NCiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwwIiBwb2ludHM9IjAuMDU2OSwwLjAyNTMgMC4wNTY5LDAuMTI2OCAwLjAzMDMsMC4xMjY4IDAuMDMwMywwLjAyNTMgLTAsMC4wMjUzIC0wLDAuMDAyOCAwLjA4NzIsMC4wMDI4IDAuMDg3MiwwLjAyNTMgIi8+DQogICA8cGF0aCBjbGFzcz0iZmlsMCIgZD0iTTAuMjE3NCAwLjA1ODFsMCAwLjAxNzdjMCwwLjAxMDIgLTAuMDAyMywwLjAxNzggLTAuMDA2OSwwLjAyMyAtMC4wMDQ2LDAuMDA1MiAtMC4wMTE1LDAuMDA3OCAtMC4wMjA1LDAuMDA3OCAtMC4wMDksMCAtMC4wMTU3LC0wLjAwMjYgLTAuMDIwMiwtMC4wMDc4IC0wLjAwNDUsLTAuMDA1MiAtMC4wMDY4LC0wLjAxMjkgLTAuMDA2OCwtMC4wMjMxbDAgLTAuMDczIC0wLjAyNjMgMCAwIDAuMDc3MWMwLDAuMDE2OCAwLjAwNDQsMC4wMjk0IDAuMDEzMywwLjAzNzcgMC4wMDg5LDAuMDA4MyAwLjAyMjQsMC4wMTI0IDAuMDQwNSwwLjAxMjQgMC4wMTc4LDAgMC4wMzEyLC0wLjAwNDEgMC4wNDAxLC0wLjAxMjQgMC4wMDg5LC0wLjAwODMgMC4wMTMzLC0wLjAyMDkgMC4wMTMzLC0wLjAzNzdsMCAtMC4wMjE4IC0wLjAyNjMgMHoiLz4NCiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwxIiBwb2ludHM9IjAuMjMwNSwwLjAwMjggMC4yMzcxLDAuMDIxOSAwLjI0MzgsMC4wNDExIDAuMjMwNSwwLjA0MTEgMC4yMTcxLDAuMDQxMSAwLjIyMzgsMC4wMjE5ICIvPg0KICAgPHBvbHlnb24gY2xhc3M9ImZpbDAiIHBvaW50cz0iMC40MDM3LDAuMDAyOCAwLjM5MzksMC4wMjUzIDAuMzk3NiwwLjAyNTMgMC40MjIsMC4wMjUzIDAuNDIyLDAuMTI2OCAwLjQ0ODYsMC4xMjY4IDAuNDQ4NiwwLjAyNTMgMC40Nzg5LDAuMDI1MyAwLjQ3ODksMC4wMDI4ICIvPg0KICAgPHBvbHlnb24gY2xhc3M9ImZpbDAiIHBvaW50cz0iMC4zODA0LDAuMDAyOCAwLjM3NDYsMC4wMDI4IDAuMjkzMiwwLjAwMjggMC4yOTMyLDAuMDI1MyAwLjMyMzUsMC4wMjUzIDAuMzIzNSwwLjEyNjggMC4zNTAxLDAuMTI2OCAwLjM1MDEsMC4wMjUzIDAuMzczMSwwLjAyNTMgMC4zODMsMC4wMDI4ICIvPg0KICAgPHBhdGggY2xhc3M9ImZpbDAiIGQ9Ik0wLjYwNzcgMC4wOTQ2Yy0wLjAwNzMsMC4wMDc5IC0wLjAxNjYsMC4wMTE4IC0wLjAyNzgsMC4wMTE4IC0wLjAxMTUsMCAtMC4wMjA4LC0wLjAwMzkgLTAuMDI4MSwtMC4wMTE3IC0wLjAwNzMsLTAuMDA3OCAtMC4wMTA5LC0wLjAxNzcgLTAuMDEwOSwtMC4wMjk3IDAsLTAuMDExOCAwLjAwMzcsLTAuMDIxNyAwLjAxMTEsLTAuMDI5NyAwLjAwNzQsLTAuMDA4IDAuMDE2NywtMC4wMTIgMC4wMjgsLTAuMDEyIDAuMDExMSwwIDAuMDIwMywwLjAwNCAwLjAyNzcsMC4wMTIgMC4wMDc0LDAuMDA4IDAuMDExMSwwLjAxNzkgMC4wMTExLDAuMDI5NiAwLDAuMDExOSAtMC4wMDM2LDAuMDIxNyAtMC4wMTEsMC4wMjk2em0wLjAzMzMgLTAuMDU0N2MtMC4wMDMzLC0wLjAwNzggLTAuMDA4LC0wLjAxNDggLTAuMDE0MywtMC4wMjA5IC0wLjAwNjMsLTAuMDA2IC0wLjAxMzUsLTAuMDEwNyAtMC4wMjE2LC0wLjAxNDEgLTAuMDA4MiwtMC4wMDMzIC0wLjAxNjYsLTAuMDA1IC0wLjAyNTIsLTAuMDA1IC0wLjAwODcsMCAtMC4wMTcyLDAuMDAxNyAtMC4wMjU0LDAuMDA1IC0wLjAwODIsMC4wMDMzIC0wLjAxNTQsMC4wMDggLTAuMDIxNiwwLjAxNDEgLTAuMDAxOSwwLjAwMTkgLTAuMDAzNCwwLjAwMzkgLTAuMDA1MSwwLjAwNTlsLTAuMDA1IDAuMDA3Yy0wLjAwMTYsMC4wMDI2IC0wLjAwMzIsMC4wMDUxIC0wLjAwNDMsMC4wMDc5IC0wLjAwMzMsMC4wMDc4IC0wLjAwNDksMC4wMTYyIC0wLjAwNDksMC4wMjUxIDAsMC4wMDk5IDAuMDAyMSwwLjAxOTIgMC4wMDYyLDAuMDI3OSAwLjAwNDEsMC4wMDg2IDAuMDEwMSwwLjAxNjEgMC4wMTc5LDAuMDIyMyAwLjAwNiwwLjAwNDggMC4wMTI3LDAuMDA4NSAwLjAxOTksMC4wMTExIDAuMDA3MywwLjAwMjYgMC4wMTQ3LDAuMDAzOCAwLjAyMjIsMC4wMDM4IDAuMDA4NiwwIDAuMDE3LC0wLjAwMTYgMC4wMjUxLC0wLjAwNDkgMC4wMDgxLC0wLjAwMzMgMC4wMTUzLC0wLjAwOCAwLjAyMTgsLTAuMDE0MSAwLjAwNjIsLTAuMDA2IDAuMDExLC0wLjAxMjkgMC4wMTQzLC0wLjAyMDggMC4wMDMzLC0wLjAwNzkgMC4wMDUsLTAuMDE2MyAwLjAwNSwtMC4wMjUxIDAsLTAuMDA4OSAtMC4wMDE2LC0wLjAxNzIgLTAuMDA0OSwtMC4wMjUxeiIvPg0KICAgPHBhdGggY2xhc3M9ImZpbDEiIGQ9Ik0wLjA0NDYgMC4xOTFsLTAuMDE0MyAtMC4wMzM0IDAuMDA1NCAwIDAuMDA3MiAwLjAxNzFjMC4wMDA0LDAuMDAxIDAuMDAwOCwwLjAwMTkgMC4wMDExLDAuMDAyOCAwLjAwMDMsMC4wMDA4IDAuMDAwNSwwLjAwMTYgMC4wMDA3LDAuMDAyNCAwLjAwMDIsLTAuMDAwOCAwLjAwMDQsLTAuMDAxNiAwLjAwMDcsLTAuMDAyNSAwLjAwMDMsLTAuMDAwOSAwLjAwMDYsLTAuMDAxNyAwLjAwMSwtMC4wMDI3bDAuMDA3MiAtMC4wMTcxIDAuMDA1NCAwIC0wLjAxNDMgMC4wMzM0eiIvPg0KICAgPHBvbHlnb24gY2xhc3M9ImZpbDEiIHBvaW50cz0iMC4wNzgxLDAuMTU3NiAwLjA4MzMsMC4xNTc2IDAuMDgzMywwLjE4OTcgMC4wNzgxLDAuMTg5NyAiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWwxIiBkPSJNMC4xMDI0IDAuMTg5N2wwIC0wLjAzMzQgMC4wMjA0IDAuMDE5N2MwLjAwMDYsMC4wMDA2IDAuMDAxMSwwLjAwMTEgMC4wMDE3LDAuMDAxOCAwLjAwMDYsMC4wMDA2IDAuMDAxMiwwLjAwMTMgMC4wMDE4LDAuMDAyMWwwIC0wLjAyMjMgMC4wMDQ4IDAgMCAwLjAzMzQgLTAuMDIwOCAtMC4wMmMtMC4wMDA2LC0wLjAwMDUgLTAuMDAxMSwtMC4wMDExIC0wLjAwMTYsLTAuMDAxNyAtMC4wMDA1LC0wLjAwMDYgLTAuMDAxLC0wLjAwMTIgLTAuMDAxNSwtMC4wMDE5bDAgMC4wMjI0IC0wLjAwNDggMHoiLz4NCiAgIDxwb2x5Z29uIGNsYXNzPSJmaWwxIiBwb2ludHM9IjAuMTUwMywwLjE1NzYgMC4xNTU1LDAuMTU3NiAwLjE1NTUsMC4xODk3IDAuMTUwMywwLjE4OTcgIi8+DQogICA8cG9seWdvbiBjbGFzcz0iZmlsMSIgcG9pbnRzPSIwLjE3NDYsMC4xODk3IDAuMTc0NiwwLjE1NzYgMC4xNzk5LDAuMTU3NiAwLjE3OTksMC4xODUgMC4xOTE1LDAuMTg1IDAuMTkxNSwwLjE4OTcgIi8+DQogICA8cGF0aCBjbGFzcz0iZmlsMSIgZD0iTTAuMjM5NiAwLjE3MzdjMCwtMC4wMDE2IC0wLjAwMDMsLTAuMDAzMiAtMC4wMDA5LC0wLjAwNDYgLTAuMDAwNiwtMC4wMDE1IC0wLjAwMTQsLTAuMDAyOCAtMC4wMDI2LC0wLjAwMzkgLTAuMDAxMSwtMC4wMDExIC0wLjAwMjMsLTAuMDAyIC0wLjAwMzgsLTAuMDAyNiAtMC4wMDE0LC0wLjAwMDYgLTAuMDAyOSwtMC4wMDA5IC0wLjAwNDUsLTAuMDAwOSAtMC4wMDE2LDAgLTAuMDAzMSwwLjAwMDMgLTAuMDA0NSwwLjAwMDkgLTAuMDAxNCwwLjAwMDYgLTAuMDAyNywwLjAwMTUgLTAuMDAzOCwwLjAwMjYgLTAuMDAxMSwwLjAwMTEgLTAuMDAyLDAuMDAyNCAtMC4wMDI1LDAuMDAzOSAtMC4wMDA2LDAuMDAxNSAtMC4wMDA5LDAuMDAzIC0wLjAwMDksMC4wMDQ3IDAsMC4wMDE2IDAuMDAwMywwLjAwMzIgMC4wMDA5LDAuMDA0NiAwLjAwMDYsMC4wMDE1IDAuMDAxNCwwLjAwMjcgMC4wMDI1LDAuMDAzOSAwLjAwMTEsMC4wMDExIDAuMDAyNCwwLjAwMiAwLjAwMzgsMC4wMDI2IDAuMDAxNCwwLjAwMDYgMC4wMDI5LDAuMDAwOSAwLjAwNDUsMC4wMDA5IDAuMDAxNiwwIDAuMDAzMSwtMC4wMDAzIDAuMDA0NSwtMC4wMDA5IDAuMDAxNCwtMC4wMDA2IDAuMDAyNywtMC4wMDE1IDAuMDAzOCwtMC4wMDI2IDAuMDAxMSwtMC4wMDExIDAuMDAyLC0wLjAwMjQgMC4wMDI2LC0wLjAwMzkgMC4wMDA2LC0wLjAwMTUgMC4wMDA5LC0wLjAwMyAwLjAwMDksLTAuMDA0NnptMC4wMDU0IDBjMCwwLjAwMjMgLTAuMDAwNCwwLjAwNDQgLTAuMDAxMywwLjAwNjUgLTAuMDAwOSwwLjAwMiAtMC4wMDIxLDAuMDAzOCAtMC4wMDM3LDAuMDA1NCAtMC4wMDE3LDAuMDAxNiAtMC4wMDM1LDAuMDAyOCAtMC4wMDU2LDAuMDAzNyAtMC4wMDIxLDAuMDAwOCAtMC4wMDQzLDAuMDAxMyAtMC4wMDY1LDAuMDAxMyAtMC4wMDIzLDAgLTAuMDA0NSwtMC4wMDA0IC0wLjAwNjYsLTAuMDAxMyAtMC4wMDIxLC0wLjAwMDkgLTAuMDA0LC0wLjAwMjEgLTAuMDA1NiwtMC4wMDM3IC0wLjAwMTYsLTAuMDAxNiAtMC4wMDI5LC0wLjAwMzQgLTAuMDAzNywtMC4wMDU0IC0wLjAwMDksLTAuMDAyIC0wLjAwMTMsLTAuMDA0MiAtMC4wMDEzLC0wLjAwNjUgMCwtMC4wMDIzIDAuMDAwNCwtMC4wMDQ1IDAuMDAxMywtMC4wMDY1IDAuMDAwOCwtMC4wMDIgMC4wMDIxLC0wLjAwMzkgMC4wMDM3LC0wLjAwNTUgMC4wMDE2LC0wLjAwMTYgMC4wMDM1LC0wLjAwMjggMC4wMDU2LC0wLjAwMzYgMC4wMDIxLC0wLjAwMDggMC4wMDQzLC0wLjAwMTMgMC4wMDY2LC0wLjAwMTMgMC4wMDIzLDAgMC4wMDQ1LDAuMDAwNCAwLjAwNjYsMC4wMDEzIDAuMDAyMSwwLjAwMDggMC4wMDM5LDAuMDAyIDAuMDA1NiwwLjAwMzYgMC4wMDE2LDAuMDAxNiAwLjAwMjksMC4wMDM1IDAuMDAzNywwLjAwNTUgMC4wMDA5LDAuMDAyIDAuMDAxMywwLjAwNDIgMC4wMDEzLDAuMDA2NXoiLz4NCiAgIDxwYXRoIGNsYXNzPSJmaWwxIiBkPSJNMC4yNjQxIDAuMTgzM2wwLjAwNDIgLTAuMDAxOWMwLjAwMDQsMC4wMDE0IDAuMDAxMSwwLjAwMjUgMC4wMDIyLDAuMDAzMyAwLjAwMTEsMC4wMDA3IDAuMDAyNCwwLjAwMTEgMC4wMDQsMC4wMDExIDAuMDAxNiwwIDAuMDAyOCwtMC4wMDA0IDAuMDAzNywtMC4wMDEzIDAuMDAwOSwtMC4wMDA5IDAuMDAxNCwtMC4wMDIgMC4wMDE0LC0wLjAwMzUgMCwtMC4wMDE5IC0wLjAwMTYsLTAuMDAzNiAtMC4wMDQ3LC0wLjAwNTEgLTAuMDAwNCwtMC4wMDAyIC0wLjAwMDgsLTAuMDAwNCAtMC4wMDEsLTAuMDAwNSAtMC4wMDM1LC0wLjAwMTcgLTAuMDA1OSwtMC4wMDMzIC0wLjAwNzEsLTAuMDA0NyAtMC4wMDEyLC0wLjAwMTQgLTAuMDAxOCwtMC4wMDMxIC0wLjAwMTgsLTAuMDA1MSAwLC0wLjAwMjYgMC4wMDA5LC0wLjAwNDcgMC4wMDI3LC0wLjAwNjQgMC4wMDE4LC0wLjAwMTYgMC4wMDQxLC0wLjAwMjQgMC4wMDcsLTAuMDAyNCAwLjAwMjQsMCAwLjAwNDQsMC4wMDA1IDAuMDA2LDAuMDAxNCAwLjAwMTYsMC4wMDA5IDAuMDAyNywwLjAwMjIgMC4wMDMzLDAuMDAzOWwtMC4wMDQxIDAuMDAyMWMtMC4wMDA2LC0wLjAwMSAtMC4wMDEzLC0wLjAwMTcgLTAuMDAyMSwtMC4wMDIyIC0wLjAwMDgsLTAuMDAwNSAtMC4wMDE2LC0wLjAwMDcgLTAuMDAyNiwtMC4wMDA3IC0wLjAwMTQsMCAtMC4wMDI1LDAuMDAwNCAtMC4wMDMzLDAuMDAxMSAtMC4wMDA4LDAuMDAwNyAtMC4wMDEyLDAuMDAxNyAtMC4wMDEyLDAuMDAyOSAwLDAuMDAxOSAwLjAwMTgsMC4wMDM3IDAuMDA1NCwwLjAwNTQgMC4wMDAzLDAuMDAwMSAwLjAwMDUsMC4wMDAyIDAuMDAwNywwLjAwMDMgMC4wMDMyLDAuMDAxNSAwLjAwNTQsMC4wMDI5IDAuMDA2NSwwLjAwNDMgMC4wMDEyLDAuMDAxNCAwLjAwMTgsMC4wMDMxIDAuMDAxOCwwLjAwNTIgMCwwLjAwMyAtMC4wMDEsMC4wMDU1IC0wLjAwMjksMC4wMDczIC0wLjAwMTksMC4wMDE4IC0wLjAwNDUsMC4wMDI3IC0wLjAwNzgsMC4wMDI3IC0wLjAwMjcsMCAtMC4wMDUsLTAuMDAwNiAtMC4wMDY3LC0wLjAwMTkgLTAuMDAxOCwtMC4wMDEzIC0wLjAwMjksLTAuMDAzMSAtMC4wMDM0LC0wLjAwNTR6Ii8+DQogIDwvZz4NCiA8L2c+DQo8L3N2Zz4NCg==";
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
  doc.text(String(label || '').toUpperCase(), x+3, y+(opts.labelY || 4.2));
  doc.setFont('helvetica', opts.valueBold ? 'bold' : 'normal');
  doc.setFontSize(opts.valueSize || 10);
  doc.setTextColor(17,24,39);
  const lines = doc.splitTextToSize(String(value || '—'), w-6);
  doc.text(lines.slice(0, opts.maxLines || 2), x+3, y+(opts.valueY || 9.8));
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

  // Logo directo sobre el fondo azul.
  // El SVG original tiene letras blancas; si se pone encima de una caja blanca, desaparece en el PDF.
  const logoDataUrl = await getTuttoLogoPngDataUrl();
  if(logoDataUrl){
    try{
      doc.addImage(logoDataUrl, 'PNG', 14, 7.2, 48, 14.2, undefined, 'FAST');
    }catch(error){
      console.warn('No se pudo insertar el logo en el PDF:', error);
      doc.setFont('helvetica','bold');
      doc.setFontSize(14);
      doc.setTextColor(255,255,255);
      doc.text('TUTTO VINILOS', 38, 15.6, {align:'center'});
    }
  }else{
    doc.setFont('helvetica','bold');
    doc.setFontSize(14);
    doc.setTextColor(255,255,255);
    doc.text('TUTTO VINILOS', 38, 15.6, {align:'center'});
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

  // Bloque superior compacto: menos separación vertical entre fecha, documento y datos del cliente.
  const compactField = {labelY:3.7, valueY:8.5, labelSize:6.8};
  drawPdfField(doc, 14, 50, 54, 10, 'Fecha', form.fecha || '', compactField);
  drawPdfField(doc, 71, 50, 62, 10, 'N° Documento', form.numero || '', {...compactField, valueBold:true});
  drawPdfField(doc, 136, 50, 62, 10, 'Válido hasta', form.vence || '', compactField);

  doc.setFont('helvetica','bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...blue);
  doc.text('DATOS DEL CLIENTE', 14, 66.2);
  doc.setDrawColor(...line);
  doc.line(14, 67.8, W-14, 67.8);

  const clientField = {labelY:3.7, valueY:8.7, labelSize:6.8};
  drawPdfField(doc, 14, 70, 92, 12, 'Cliente', form.cliente || '', {...clientField, valueBold:true, valueSize:9.6});
  drawPdfField(doc, 109, 70, 89, 12, 'RIF / Cédula', form.rif || '', {...clientField, valueSize:9.3});
  drawPdfField(doc, 14, 85, 92, 12, 'Email', form.email || '', {...clientField, valueSize:8.5, maxLines:1});
  drawPdfField(doc, 109, 85, 89, 12, 'Teléfono', form.telefono || '', {...clientField, valueSize:9.3});
  drawPdfField(doc, 14, 100, 184, 12, 'Dirección', form.direccion || '', {...clientField, valueSize:8.7, maxLines:1});

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
    startY: 122,
    head: [["#","DESCRIPCIÓN DEL PRODUCTO / SERVICIO","CANT.","P. UNIT ($)","TOTAL ($)"]],
    body,
    theme: 'grid',
    margin: {left:14, right:14, bottom:26},
    styles: {
      font:'helvetica',
      fontSize:7.7,
      cellPadding:2.9,
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
      fontSize:6.9
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
  if(body) body.innerHTML = `<tr><td colspan="8" class="empty">Cargando...</td></tr>`;

  const selectConAprobacion = "id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,pdf_mime,aprobado,aprobado_at,aprobado_por,created_at";
  const selectBasico = "id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_nombre,pdf_mime,created_at";

  let res = await db()
    .from("cotizaciones")
    .select(selectConAprobacion)
    .order("created_at", { ascending:false })
    .limit(150);

  if(res.error){
    const msg = String(res.error.message || "");
    const faltaColumnasAprobado = msg.includes("aprobado") || msg.includes("aprobado_at") || msg.includes("aprobado_por") || msg.includes("schema cache");

    if(faltaColumnasAprobado){
      console.warn("Faltan columnas de aprobación. Ejecuta el SQL de aprobado. Cargando sin aprobación:", res.error);
      res = await db()
        .from("cotizaciones")
        .select(selectBasico)
        .order("created_at", { ascending:false })
        .limit(150);

      if(!res.error){
        showToast("Falta SQL de aprobado. Se cargó la lista sin check.", "warn");
      }
    }
  }

  if(res.error){
    console.error("Error cargando cotizaciones:", res.error);
    if(body) body.innerHTML = `<tr><td colspan="8" class="empty">Error cargando cotizaciones</td></tr>`;
    showToast("Error cargando cotizaciones", "err");
    return;
  }

  cotizacionesDB = (res.data || []).map(c => ({...c, aprobado: c.aprobado === true}));
  renderCotizacionesPrevias();
}
function renderCotizacionesPrevias(){
  const body = $("cotizacionesBody");
  if(!body) return;

  const q = normalizar($("buscarCotizaciones")?.value || "");
  const filtroAprobado = $("filtroAprobado")?.value || "";
  let lista = [...cotizacionesDB];

  if(q){
    lista = lista.filter(c => normalizar([c.fecha,c.numero,c.cliente,c.responsable,c.telefono,c.total,c.tipo_documento,c.aprobado ? "aprobada aprobado" : "pendiente"].join(" ")).includes(q));
  }

  if(filtroAprobado === "aprobadas"){
    lista = lista.filter(c => c.aprobado === true);
  }

  if(filtroAprobado === "pendientes"){
    lista = lista.filter(c => c.aprobado !== true);
  }

  if(!lista.length){
    body.innerHTML = `<tr><td colspan="8" class="empty">Sin cotizaciones</td></tr>`;
    return;
  }

  body.innerHTML = lista.map(c => {
    const aprobadoMeta = c.aprobado
      ? `<span class="approved-meta">${html(c.aprobado_por || "")} ${c.aprobado_at ? "· " + html(String(c.aprobado_at).slice(0,10)) : ""}</span>`
      : "";

    return `
      <tr>
        <td class="center">
          <button class="mini-btn ${c.aprobado ? "approved" : "pending"}" type="button" data-aprobar-cot="${Number(c.id)}">
            ${c.aprobado ? "✅ Aprobada" : "☐ Pendiente"}
          </button>
          ${aprobadoMeta}
        </td>
        <td>${html(c.fecha || "")}</td>
        <td><b>${html(c.numero || "")}</b></td>
        <td>${html(c.cliente || "")}</td>
        <td><span class="badge-responsable">${html(c.responsable || "Sin responsable")}</span></td>
        <td>${html(c.telefono || "")}</td>
        <td><b>${currency(c.total || 0)}</b></td>
        <td class="center">
          <button class="mini-btn dark" type="button" data-ver-cot="${Number(c.id)}">Abrir</button>
          <button class="mini-btn" type="button" data-pdf-cot="${Number(c.id)}">${c.pdf_nombre ? "Abrir PDF" : "Generar PDF"}</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function toggleAprobadoCotizacion(id){
  const cot = cotizacionesDB.find(c => Number(c.id) === Number(id));
  if(!cot){
    showToast("No se encontró la cotización", "err");
    return;
  }

  const nuevoEstado = !cot.aprobado;
  let operador = "";

  try{
    const op = JSON.parse(localStorage.getItem("comanda_operador_actual") || "null");
    operador = op?.nombre || "";
  }catch(error){
    operador = "";
  }

  const update = {
    aprobado: nuevoEstado,
    aprobado_at: nuevoEstado ? new Date().toISOString() : null,
    aprobado_por: nuevoEstado ? operador : null
  };

  const { error } = await db()
    .from("cotizaciones")
    .update(update)
    .eq("id", id);

  if(error){
    console.error("Error actualizando aprobación:", error);
    const msg = String(error.message || "");
    if(msg.includes("aprobado") || msg.includes("schema cache")){
      showToast("Falta ejecutar el SQL de aprobado en Supabase", "err");
    }else{
      showToast("No se pudo actualizar aprobación", "err");
    }
    return;
  }

  cot.aprobado = update.aprobado;
  cot.aprobado_at = update.aprobado_at;
  cot.aprobado_por = update.aprobado_por;

  renderCotizacionesPrevias();
  showToast(nuevoEstado ? "Cotización aprobada" : "Cotización marcada como pendiente", "ok");
}

function buscarCotizacionPorId(id){ return cotizacionesDB.find(c => Number(c.id) === Number(id)) || null; }

async function obtenerCotizacionCompleta(id){
  let reg = buscarCotizacionPorId(id);
  if(reg && Object.prototype.hasOwnProperty.call(reg, "pdf_base64")) return reg;

  const { data:full, error } = await db()
    .from("cotizaciones")
    .select("id,fecha,numero,tipo_documento,cliente,rif_cedula,telefono,correo,direccion,responsable,vence,items,notas,subtotal,iva,total,pdf_url,pdf_path,pdf_base64,pdf_mime,pdf_nombre,aprobado,aprobado_at,aprobado_por,created_at")
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
    const aprobar = e.target.closest("[data-aprobar-cot]");
    if(aprobar){ toggleAprobadoCotizacion(Number(aprobar.dataset.aprobarCot)); return; }
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
  $("filtroAprobado")?.addEventListener("change", renderCotizacionesPrevias);
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
