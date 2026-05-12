// Lazy, client-only loader for pdf.js. Avoids SSR (no DOMMatrix in Node).
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

export async function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("pdfjs is client-only");
  }
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjsLib = await import("pdfjs-dist");
      const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;
      return pdfjsLib;
    })();
  }
  return pdfjsPromise;
}
