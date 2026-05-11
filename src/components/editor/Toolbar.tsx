import {
  MousePointer2,
  Type,
  Square,
  Circle,
  Minus,
  Highlighter,
  Image as ImageIcon,
  PenLine,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileUp,
  Trash2,
  Sun,
  Moon,
  Loader2,
} from "lucide-react";
import type { Tool } from "@/lib/editor-types";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";

const tools: { id: Tool; icon: any; label: string; shortcut?: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "text", icon: Type, label: "Text", shortcut: "T" },
  { id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
  { id: "circle", icon: Circle, label: "Circle", shortcut: "O" },
  { id: "line", icon: Minus, label: "Line", shortcut: "L" },
  { id: "highlight", icon: Highlighter, label: "Highlight", shortcut: "H" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "signature", icon: PenLine, label: "Signature" },
];

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors ${
        active
          ? "text-primary-foreground"
          : "hover:bg-[color:var(--color-elevated)] text-muted-foreground hover:text-foreground"
      }`}
    >
      {active && (
        <motion.span
          layoutId="tool-active"
          className="absolute inset-0 rounded-lg gradient-primary shadow-glow"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export function Toolbar({
  tool,
  setTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFit,
  onExport,
  onNewFile,
  onDeleteSelected,
  zoom,
  exporting,
  fileName,
}: {
  tool: Tool;
  setTool: (t: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onExport: () => void;
  onNewFile: () => void;
  onDeleteSelected: () => void;
  zoom: number;
  exporting: boolean;
  fileName: string;
}) {
  const { theme, toggle } = useTheme();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-[color:var(--color-toolbar)]/80 px-3 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5 pr-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-glow">
          <Type className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            PDF <span className="text-gradient">Studio</span>
          </div>
          <div className="max-w-[200px] truncate text-[11px] text-muted-foreground">{fileName}</div>
        </div>
      </div>

      <div className="mx-1 h-7 w-px bg-border" />

      <div className="flex items-center gap-0.5">
        {tools.map((t) => (
          <ToolButton
            key={t.id}
            active={tool === t.id}
            onClick={() => setTool(t.id)}
            title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label}
          >
            <t.icon className="h-4 w-4" />
          </ToolButton>
        ))}
      </div>

      <div className="mx-1 h-7 w-px bg-border" />

      <ToolButton onClick={onUndo} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={onRedo} title="Redo (Ctrl+Y)"><Redo2 className="h-4 w-4" /></ToolButton>
      <ToolButton onClick={onDeleteSelected} title="Delete selected (Del)">
        <Trash2 className="h-4 w-4" />
      </ToolButton>

      <div className="mx-1 h-7 w-px bg-border" />

      <div className="flex items-center gap-0.5 rounded-lg bg-[color:var(--color-elevated)]/60 px-1">
        <ToolButton onClick={onZoomOut} title="Zoom out"><ZoomOut className="h-4 w-4" /></ToolButton>
        <motion.span
          key={zoom}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-12 text-center text-xs font-medium tabular-nums text-foreground"
        >
          {Math.round(zoom * 100)}%
        </motion.span>
        <ToolButton onClick={onZoomIn} title="Zoom in"><ZoomIn className="h-4 w-4" /></ToolButton>
        <ToolButton onClick={onFit} title="Fit width"><Maximize2 className="h-4 w-4" /></ToolButton>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ToolButton onClick={toggle} title="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </ToolButton>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={onNewFile}
          className="flex h-9 items-center gap-2 rounded-lg border border-border bg-[color:var(--color-surface)]/70 px-3 text-sm font-medium text-foreground backdrop-blur hover:bg-[color:var(--color-elevated)]"
        >
          <FileUp className="h-4 w-4" /> Open
        </motion.button>

        <motion.button
          whileHover={{ y: -1, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExport}
          disabled={exporting}
          className="relative flex h-9 items-center gap-2 overflow-hidden rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity disabled:opacity-70"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {exporting ? "Exporting…" : "Export PDF"}
        </motion.button>
      </div>
    </motion.header>
  );
}
