import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { usePdfLoader } from "@/hooks/use-pdf-loader";
import { useHistory } from "@/hooks/use-history";
import { UploadDropzone } from "@/components/editor/UploadDropzone";
import { Toolbar } from "@/components/editor/Toolbar";
import { PageThumbnails } from "@/components/editor/PageThumbnails";
import { PageCanvas } from "@/components/editor/PageCanvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { SignaturePad } from "@/components/editor/SignaturePad";
import type { EditorObject, ImageObject, Tool } from "@/lib/editor-types";
import { exportEditedPdf } from "@/lib/pdf-export";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PDF Studio – Free Browser-Based PDF Editor" },
      {
        name: "description",
        content:
          "Edit any PDF in your browser. Add text, shapes, highlights, images, and signatures. 100% client-side, no uploads.",
      },
    ],
  }),
  component: EditorPage,
});

function EditorPage() {
  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading editor…
      </div>
    );
  }
  return <EditorClient />;
}

function EditorClient() {
  const { pdf, loading, error, load, renderPage } = usePdfLoader();
  const { state: objects, set: setObjects, undo, redo, reset } = useHistory<EditorObject[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const baseScale = 1.5; // render quality scale
  const displayScale = baseScale * zoom; // pixels per PDF point

  // Re-render the active page when it changes (or zoom changes meaningfully)
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    renderPage(currentPage, baseScale).then((url) => {
      if (!cancelled) setBgUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [pdf, currentPage, renderPage]);

  // Reset state when a new PDF is loaded
  useEffect(() => {
    if (pdf) {
      reset([]);
      setCurrentPage(1);
      setSelectedId(null);
      setZoom(1);
      setTool("select");
    }
  }, [pdf, reset]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        setObjects((prev) => prev.filter((o) => o.id !== selectedId));
        setSelectedId(null);
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedId, setObjects]);

  const addObject = useCallback(
    (obj: EditorObject) => {
      setObjects((prev) => [...prev, obj]);
    },
    [setObjects],
  );

  const updateObject = useCallback(
    (id: string, patch: Partial<EditorObject>) => {
      setObjects((prev) => prev.map((o) => (o.id === id ? ({ ...o, ...patch } as EditorObject) : o)));
    },
    [setObjects],
  );

  const selected = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId]);

  const handleToolChange = (t: Tool) => {
    if (t === "image") {
      imageInputRef.current?.click();
      return;
    }
    if (t === "signature") {
      setShowSignature(true);
      return;
    }
    setTool(t);
    setSelectedId(null);
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const page = pdf!.pages.find((p) => p.pageNumber === currentPage)!;
      const obj: ImageObject = {
        id: Math.random().toString(36).slice(2, 10),
        type: "image",
        page: currentPage,
        x: page.widthPt * 0.2,
        y: page.heightPt * 0.2,
        width: 200,
        height: 150,
        src: dataUrl,
      };
      addObject(obj);
      setSelectedId(obj.id);
      setTool("select");
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureSave = (dataUrl: string) => {
    const page = pdf!.pages.find((p) => p.pageNumber === currentPage)!;
    const obj: ImageObject = {
      id: Math.random().toString(36).slice(2, 10),
      type: "image",
      page: currentPage,
      x: page.widthPt * 0.3,
      y: page.heightPt * 0.7,
      width: 220,
      height: 80,
      src: dataUrl,
    };
    addObject(obj);
    setSelectedId(obj.id);
    setShowSignature(false);
    setTool("select");
  };

  const handleExport = async () => {
    if (!pdf) return;
    setExporting(true);
    try {
      const bytes = await exportEditedPdf(pdf.bytes, objects);
      // bytes is Uint8Array
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdf.fileName.replace(/\.pdf$/i, "") + "-edited.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e: any) {
      console.error(e);
      alert("Failed to export PDF: " + e?.message);
    } finally {
      setExporting(false);
    }
  };

  const fitWidth = () => {
    const vp = viewportRef.current;
    const page = pdf?.pages.find((p) => p.pageNumber === currentPage);
    if (!vp || !page) return;
    const padding = 80;
    const target = (vp.clientWidth - padding) / (page.widthPt * baseScale);
    setZoom(Math.max(0.25, Math.min(3, target)));
  };

  if (!pdf) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/30">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/60 px-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              P
            </div>
            <span className="text-base font-semibold text-foreground">PDF Studio</span>
          </div>
          <span className="text-xs text-muted-foreground">100% client-side · No uploads</span>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="mb-10 max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              The free browser PDF editor
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Add text, shapes, highlights, images, and signatures to any PDF. Everything happens
              in your browser — your files never leave your device.
            </p>
          </div>
          <UploadDropzone onFile={load} />
          {loading && (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
            </div>
          )}
          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}
          <div className="mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {["Text & fonts", "Shapes & lines", "Highlights", "Image & signature"].map((f) => (
              <div
                key={f}
                className="rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground"
              >
                {f}
              </div>
            ))}
          </div>
        </main>
        <footer className="border-t border-border bg-card/60 px-6 py-4 text-center text-xs text-muted-foreground">
          Built by <span className="font-medium text-foreground">Vikas Yadav</span> · PDF Studio
        </footer>
      </div>
    );
  }

  const activePage = pdf.pages.find((p) => p.pageNumber === currentPage)!;

  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <Toolbar
        tool={tool}
        setTool={handleToolChange}
        onUndo={undo}
        onRedo={redo}
        onZoomIn={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
        onZoomOut={() => setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))}
        onFit={fitWidth}
        onExport={handleExport}
        onNewFile={() => fileInputRef.current?.click()}
        onDeleteSelected={() => {
          if (!selectedId) return;
          setObjects((prev) => prev.filter((o) => o.id !== selectedId));
          setSelectedId(null);
        }}
        zoom={zoom}
        exporting={exporting}
        fileName={pdf.fileName}
      />

      <div className="flex flex-1 overflow-hidden">
        <PageThumbnails pages={pdf.pages} current={currentPage} onSelect={setCurrentPage} />

        <div
          ref={viewportRef}
          className="relative flex flex-1 items-start justify-center overflow-auto bg-muted/40 p-10"
        >
          {bgUrl ? (
            <PageCanvas
              page={activePage}
              bgUrl={bgUrl}
              scale={displayScale}
              tool={tool}
              objects={objects}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addObject}
              onUpdate={updateObject}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Rendering page…
            </div>
          )}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs text-muted-foreground shadow">
            Page {currentPage} of {pdf.pages.length}
          </div>
        </div>

        <PropertiesPanel
          object={selected}
          onChange={(patch) => selectedId && updateObject(selectedId, patch)}
        />
      </div>

      <footer className="flex h-8 items-center justify-between border-t border-border bg-card px-4 text-[11px] text-muted-foreground">
        <span>PDF Studio · client-side editor</span>
        <span>
          Built by <span className="font-medium text-foreground">Vikas Yadav</span>
        </span>
      </footer>

      {showSignature && (
        <SignaturePad onSave={handleSignatureSave} onClose={() => setShowSignature(false)} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) load(f);
          e.target.value = "";
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleImageUpload(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
