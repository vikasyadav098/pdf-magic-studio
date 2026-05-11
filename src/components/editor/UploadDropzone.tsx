import { useCallback, useState } from "react";
import { Upload, FileText, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UploadDropzone({ onFile }: { onFile: (file: File) => void }) {
  const [drag, setDrag] = useState(false);

  const handle = useCallback(
    (file?: File | null) => {
      if (!file) return;
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please select a PDF file.");
        return;
      }
      onFile(file);
    },
    [onFile],
  );

  return (
    <motion.label
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      className={`group relative flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
        drag
          ? "border-primary bg-primary/5 shadow-glow scale-[1.01]"
          : "border-border bg-[color:var(--color-surface)]/60 hover:border-primary/60 hover:bg-[color:var(--color-surface)]"
      }`}
    >
      {/* Animated gradient blob backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px 240px at 30% 20%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 60%), radial-gradient(420px 240px at 80% 90%, color-mix(in oklab, var(--color-accent) 18%, transparent), transparent 60%)",
        }}
      />
      <AnimatePresence>
        {drag && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="absolute inset-3 rounded-[22px] ring-2 ring-primary/60 ring-glow"
          />
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05, rotate: -3 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant"
      >
        <Upload className="h-9 w-9" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-surface)] text-accent shadow">
          <Sparkles className="h-3 w-3" />
        </span>
      </motion.div>

      <h2 className="relative text-2xl font-semibold tracking-tight text-foreground">
        Drop a PDF to start editing
      </h2>
      <p className="relative mt-2 text-sm text-muted-foreground">
        Or click to browse · Files never leave your browser
      </p>

      <div className="relative mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>Supports any standard PDF</span>
      </div>

      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </motion.label>
  );
}
