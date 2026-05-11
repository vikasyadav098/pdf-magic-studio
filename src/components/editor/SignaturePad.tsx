import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function SignaturePad({
  onSave,
  onClose,
}: {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#0a0a0a");
  const [size, setSize] = useState(3);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  const pos = (e: React.PointerEvent) => {
    const c = ref.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-xl rounded-xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Draw your signature</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mb-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Size
            <input
              type="range"
              min={1}
              max={10}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </label>
        </div>
        <canvas
          ref={ref}
          width={600}
          height={220}
          className="w-full cursor-crosshair rounded-md border border-border bg-white"
          onPointerDown={(e) => {
            drawing.current = true;
            const ctx = ref.current!.getContext("2d")!;
            const { x, y } = pos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = ref.current!.getContext("2d")!;
            const { x, y } = pos(e);
            ctx.lineTo(x, y);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.stroke();
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => {
              const c = ref.current!;
              const ctx = c.getContext("2d")!;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, c.width, c.height);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-muted"
          >
            Clear
          </button>
          <button
            onClick={() => onSave(ref.current!.toDataURL("image/png"))}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add to page
          </button>
        </div>
      </div>
    </div>
  );
}
