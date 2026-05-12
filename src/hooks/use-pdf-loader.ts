import { useCallback, useEffect, useRef, useState } from "react";
import { getPdfjs } from "@/lib/pdfjs-setup";

export type LoadedPage = {
  pageNumber: number;
  widthPt: number;
  heightPt: number;
  thumbnail: string; // data URL
};

export type LoadedPdf = {
  bytes: ArrayBuffer;
  pages: LoadedPage[];
  fileName: string;
};

export function usePdfLoader() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const docRef = useRef<any>(null);

  const load = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const pdfjsLib = await getPdfjs();
      // pdfjs consumes the buffer; clone for export later
      const docTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const doc = await docTask.promise;
      docRef.current = doc;
      const pages: LoadedPage[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const baseVp = page.getViewport({ scale: 1 });
        pages.push({
          pageNumber: i,
          widthPt: baseVp.width,
          heightPt: baseVp.height,
          thumbnail: canvas.toDataURL("image/jpeg", 0.7),
        });
      }
      setPdf({ bytes, pages, fileName: file.name });
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to load PDF");
    } finally {
      setLoading(false);
    }
  }, []);

  const renderPage = useCallback(
    async (pageNumber: number, scale: number): Promise<string> => {
      if (!docRef.current) throw new Error("No document loaded");
      const page = await docRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      return canvas.toDataURL("image/jpeg", 0.85);
    },
    [],
  );

  useEffect(() => {
    return () => {
      docRef.current?.destroy?.();
    };
  }, []);

  return { pdf, loading, error, load, renderPage };
}
