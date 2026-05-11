// Configure PDF.js worker for client-side use only.
import * as pdfjsLib from "pdfjs-dist";
// Vite handles the ?url import to give us a hashed asset URL for the worker.
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
}

export { pdfjsLib };
