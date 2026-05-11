# PDF Studio

A free, browser-based PDF editor. Upload a PDF, add text, shapes, highlights, images, and signatures, then download the edited file. Everything runs locally in your browser — no uploads, no backend, no accounts.

## Features

- Drag-and-drop or click to upload a PDF
- Page thumbnails sidebar with multi-page navigation
- Add and edit text (font size, color, bold/italic, alignment)
- Draw rectangles, ellipses, lines, and highlight boxes
- Insert images and a hand-drawn signature
- Move, resize, and delete elements with a transformer
- Undo / redo (Ctrl+Z, Ctrl+Shift+Z)
- Zoom in / out / fit width
- Export the final PDF using `pdf-lib`
- 100% client-side — your files never leave your browser

## Technologies

- React + TanStack Start (Vite)
- PDF.js (`pdfjs-dist`) for page rendering
- pdf-lib for PDF export
- react-konva / Konva for the editable overlay
- Tailwind CSS

## Setup

```bash
bun install
bun run dev
```

Then open http://localhost:5173

To build for production:

```bash
bun run build
```

## Keyboard shortcuts

- `Ctrl/Cmd + Z` — Undo
- `Ctrl/Cmd + Shift + Z` / `Ctrl + Y` — Redo
- `Delete` / `Backspace` — Remove selected element
- `Esc` — Deselect / return to select tool

## Notes on editing existing PDF text

Browser PDF editors cannot reliably modify the original text layer of an
arbitrary PDF, so PDF Studio uses an overlay model: edits are added on top
of the rendered page and merged into the PDF on export. This is the same
approach used by most online PDF editors.

## Developer

**Developer: Vikas Yadav**
