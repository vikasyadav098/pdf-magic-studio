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
import { Loader2, ShieldCheck, Sparkles, Type, Square, Highlighter, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ExportSuccess } from "@/components/editor/ExportSuccess";
import { useTheme } from "@/hooks/use-theme";

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
  // initialize theme on mount
  useTheme();
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading editor…
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
  const [exportedFlash, setExportedFlash] = useState(false);
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
      setExportedFlash(true);
      setTimeout(() => setExportedFlash(false), 1800);
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

  const { theme, toggle } = useTheme();

  if (!pdf) {
    const features = [
      { icon: Type, label: "Text & fonts" },
      { icon: Square, label: "Shapes & lines" },
      { icon: Highlighter, label: "Highlights" },
      { icon: PenLine, label: "Signature" },
    ];
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
        {/* ambient backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(900px 540px at 15% 0%, color-mix(in oklab, var(--color-primary) 16%, transparent), transparent 60%), radial-gradient(800px 500px at 90% 20%, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 60%)",
          }}
        />
        <header className="relative z-10 flex h-14 items-center justify-between border-b border-border bg-[color:var(--color-toolbar)]/60 px-6 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-glow">
              <Type className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              PDF <span className="text-gradient">Studio</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-success)]" />
              100% client-side · No uploads
            </span>
            <button
              onClick={toggle}
              className="rounded-md border border-border bg-[color:var(--color-surface)]/60 px-2.5 py-1.5 text-xs text-foreground hover:bg-[color:var(--color-elevated)]"
            >
              {theme === "dark" ? "Light" : "Dark"} mode
            </button>
          </div>
        </header>

        <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 max-w-2xl text-center"
          >
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-[color:var(--color-surface)]/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              Free · Private · Runs in your browser
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
              The free <span className="text-gradient">browser</span> PDF editor
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Add text, shapes, highlights, images, and signatures to any PDF.
              Everything happens locally — your files never leave your device.
            </p>
          </motion.div>

          <UploadDropzone onFile={load} />

          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Loader2 className="h-4 w-4 animate-spin" /> Loading PDF…
              </motion.div>
            )}
          </AnimatePresence>
          {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

          <div className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-[color:var(--color-surface)]/60 p-4 text-center backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elegant"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-elevated)] text-primary transition-colors group-hover:bg-primary/10">
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="text-xs font-medium text-foreground">{f.label}</span>
              </motion.div>
            ))}
          </div>
        </main>

        <footer className="relative z-10 border-t border-border bg-[color:var(--color-toolbar)]/60 px-6 py-4 text-center text-xs text-muted-foreground backdrop-blur">
          Built by <span className="font-semibold text-foreground">Vikas Yadav</span> · PDF Studio · Credits: PDF.js, pdf-lib, Konva, Framer Motion
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
          className="relative flex flex-1 items-start justify-center overflow-auto bg-[color:var(--color-canvas)] p-10"
          style={{
            backgroundImage:
              "radial-gradient(color-mix(in oklab, var(--color-foreground) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        >
          <AnimatePresence mode="wait">
            {bgUrl ? (
              <motion.div
                key={currentPage + "-" + bgUrl}
                initial={{ opacity: 0, y: 16, scale: 0.985, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.99, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.div>
            ) : (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full w-full items-center justify-center"
              >
                <div
                  className="shimmer rounded-lg shadow-elegant"
                  style={{ width: 600, height: 800 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full glass px-3.5 py-1.5 text-xs font-medium text-foreground shadow-elegant"
          >
            Page <span className="text-primary">{currentPage}</span> / {pdf.pages.length}
          </motion.div>
        </div>

        <PropertiesPanel
          object={selected}
          onChange={(patch) => selectedId && updateObject(selectedId, patch)}
        />
      </div>

      <footer className="flex h-8 items-center justify-between border-t border-border bg-[color:var(--color-toolbar)]/70 px-4 text-[11px] text-muted-foreground backdrop-blur">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-[color:var(--color-success)]" />
          PDF Studio · client-side editor
        </span>
        <span>
          Built by <span className="font-semibold text-foreground">Vikas Yadav</span>
        </span>
      </footer>

      <ExportSuccess show={exportedFlash} />

      <AnimatePresence>
        {showSignature && (
          <SignaturePad onSave={handleSignatureSave} onClose={() => setShowSignature(false)} />
        )}
      </AnimatePresence>

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
