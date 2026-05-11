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
} from "lucide-react";
import type { Tool } from "@/lib/editor-types";

const tools: { id: Tool; icon: any; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "text", icon: Type, label: "Text" },
  { id: "rect", icon: Square, label: "Rectangle" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "line", icon: Minus, label: "Line" },
  { id: "highlight", icon: Highlighter, label: "Highlight" },
  { id: "image", icon: ImageIcon, label: "Image" },
  { id: "signature", icon: PenLine, label: "Signature" },
];

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
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <div className="flex items-center gap-2 pr-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Type className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-foreground">PDF Studio</div>
          <div className="max-w-[180px] truncate text-[11px] text-muted-foreground">{fileName}</div>
        </div>
      </div>

      <div className="mx-1 h-7 w-px bg-border" />

      <div className="flex items-center gap-1">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.label}
            className={`flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
              tool === t.id
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mx-1 h-7 w-px bg-border" />

      <button
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        onClick={onRedo}
        title="Redo (Ctrl+Y)"
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
      >
        <Redo2 className="h-4 w-4" />
      </button>
      <button
        onClick={onDeleteSelected}
        title="Delete selected (Del)"
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <div className="mx-1 h-7 w-px bg-border" />

      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={onFit}
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
          title="Fit width"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onNewFile}
          className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
        >
          <FileUp className="h-4 w-4" /> Open
        </button>
        <button
          onClick={onExport}
          disabled={exporting}
          className="flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Download className="h-4 w-4" />
          {exporting ? "Exporting…" : "Export PDF"}
        </button>
      </div>
    </header>
  );
}
