import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import type { EditorObject, TextObject, ShapeObject, ImageObject } from "./editor-types";

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v, 16);
  return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

export async function exportEditedPdf(
  originalBytes: ArrayBuffer,
  objects: EditorObject[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvIt = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const helvBoldIt = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const pages = pdfDoc.getPages();

  for (const obj of objects) {
    const page = pages[obj.page - 1];
    if (!page) continue;
    const { height: pageH } = page.getSize();
    // Convert top-left origin (editor) to bottom-left (PDF)
    const pdfY = pageH - obj.y - obj.height;

    if (obj.type === "text") {
      const t = obj as TextObject;
      const font =
        t.fontStyle === "bold"
          ? helvBold
          : t.fontStyle === "italic"
            ? helvIt
            : t.fontStyle === "bold italic"
              ? helvBoldIt
              : helv;
      // Naive multi-line wrap based on width
      const lines = t.text.split("\n");
      let cursorY = pageH - obj.y - t.fontSize;
      for (const line of lines) {
        const w = font.widthOfTextAtSize(line, t.fontSize);
        let drawX = obj.x;
        if (t.align === "center") drawX = obj.x + (obj.width - w) / 2;
        if (t.align === "right") drawX = obj.x + obj.width - w;
        page.drawText(line, {
          x: drawX,
          y: cursorY,
          size: t.fontSize,
          font,
          color: hexToRgb(t.color),
        });
        cursorY -= t.fontSize * 1.2;
      }
    } else if (obj.type === "rect") {
      const s = obj as ShapeObject;
      page.drawRectangle({
        x: obj.x,
        y: pdfY,
        width: obj.width,
        height: obj.height,
        borderColor: hexToRgb(s.stroke),
        borderWidth: s.strokeWidth,
        color: s.fill && s.fill !== "transparent" ? hexToRgb(s.fill) : undefined,
        opacity: s.fill && s.fill !== "transparent" ? 1 : 0,
        borderOpacity: 1,
      });
    } else if (obj.type === "highlight") {
      const s = obj as ShapeObject;
      page.drawRectangle({
        x: obj.x,
        y: pdfY,
        width: obj.width,
        height: obj.height,
        color: hexToRgb(s.fill || "#FFFF00"),
        opacity: 0.4,
      });
    } else if (obj.type === "circle") {
      const s = obj as ShapeObject;
      const rx = obj.width / 2;
      const ry = obj.height / 2;
      page.drawEllipse({
        x: obj.x + rx,
        y: pdfY + ry,
        xScale: rx,
        yScale: ry,
        borderColor: hexToRgb(s.stroke),
        borderWidth: s.strokeWidth,
        color: s.fill && s.fill !== "transparent" ? hexToRgb(s.fill) : undefined,
        opacity: s.fill && s.fill !== "transparent" ? 1 : 0,
      });
    } else if (obj.type === "line") {
      const s = obj as ShapeObject;
      page.drawLine({
        start: { x: obj.x, y: pageH - obj.y },
        end: { x: obj.x + obj.width, y: pageH - (obj.y + obj.height) },
        thickness: s.strokeWidth,
        color: hexToRgb(s.stroke),
      });
    } else if (obj.type === "image") {
      const im = obj as ImageObject;
      const dataUrl = im.src;
      const bytes = await (await fetch(dataUrl)).arrayBuffer();
      const isPng = dataUrl.startsWith("data:image/png");
      const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
      page.drawImage(img, {
        x: obj.x,
        y: pdfY,
        width: obj.width,
        height: obj.height,
        rotate: degrees(obj.rotation || 0),
      });
    }
  }

  return await pdfDoc.save();
}
