import type { EditorObject, ShapeObject, TextObject } from "@/lib/editor-types";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2 } from "lucide-react";

export function PropertiesPanel({
  object,
  onChange,
}: {
  object: EditorObject | null;
  onChange: (patch: Partial<EditorObject>) => void;
}) {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-[color:var(--color-panel)]/80 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Settings2 className="h-3.5 w-3.5" /> Properties
      </div>

      <AnimatePresence mode="wait">
        {!object && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-border bg-[color:var(--color-elevated)]/40 p-5 text-sm text-muted-foreground"
          >
            Select an element on the page to edit its properties, or pick a tool from the toolbar to add new content.
          </motion.div>
        )}
      </AnimatePresence>

      {object?.type === "text" && <TextProps obj={object as TextObject} onChange={onChange} />}
      {(object?.type === "rect" ||
        object?.type === "circle" ||
        object?.type === "line" ||
        object?.type === "highlight") && (
        <ShapeProps obj={object as ShapeObject} onChange={onChange} />
      )}

      {object && (
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <Field label="X">
            <input
              type="number"
              className="num-input"
              value={Math.round(object.x)}
              onChange={(e) => onChange({ x: Number(e.target.value) })}
            />
          </Field>
          <Field label="Y">
            <input
              type="number"
              className="num-input"
              value={Math.round(object.y)}
              onChange={(e) => onChange({ y: Number(e.target.value) })}
            />
          </Field>
          <Field label="W">
            <input
              type="number"
              className="num-input"
              value={Math.round(object.width)}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
            />
          </Field>
          <Field label="H">
            <input
              type="number"
              className="num-input"
              value={Math.round(object.height)}
              onChange={(e) => onChange({ height: Number(e.target.value) })}
            />
          </Field>
        </div>
      )}
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function TextProps({
  obj,
  onChange,
}: {
  obj: TextObject;
  onChange: (p: Partial<TextObject>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Text">
        <textarea
          className="min-h-[80px] resize-y rounded-md border border-input bg-background p-2 text-sm text-foreground"
          value={obj.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Font size">
          <input
            type="number"
            min={6}
            max={144}
            className="num-input"
            value={obj.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label="Color">
          <input
            type="color"
            className="h-9 w-full rounded-md border border-input bg-background"
            value={obj.color}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Style">
        <div className="flex gap-1">
          {(["normal", "bold", "italic", "bold italic"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onChange({ fontStyle: s })}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs ${
                obj.fontStyle === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {s === "normal" ? "Reg" : s === "bold" ? "B" : s === "italic" ? "I" : "BI"}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Align">
        <div className="flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ align: a })}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs capitalize ${
                obj.align === a
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );
}

function ShapeProps({
  obj,
  onChange,
}: {
  obj: ShapeObject;
  onChange: (p: Partial<ShapeObject>) => void;
}) {
  const isFilled = obj.type === "highlight";
  return (
    <div className="flex flex-col gap-3">
      {!isFilled && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Stroke">
            <input
              type="color"
              className="h-9 w-full rounded-md border border-input bg-background"
              value={obj.stroke}
              onChange={(e) => onChange({ stroke: e.target.value })}
            />
          </Field>
          <Field label="Width">
            <input
              type="number"
              min={1}
              max={20}
              className="num-input"
              value={obj.strokeWidth}
              onChange={(e) => onChange({ strokeWidth: Number(e.target.value) })}
            />
          </Field>
        </div>
      )}
      {(obj.type === "rect" || obj.type === "circle" || obj.type === "highlight") && (
        <Field label={isFilled ? "Highlight color" : "Fill"}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 rounded-md border border-input bg-background"
              value={obj.fill === "transparent" ? "#ffff00" : obj.fill}
              onChange={(e) => onChange({ fill: e.target.value })}
            />
            {!isFilled && (
              <button
                onClick={() => onChange({ fill: "transparent" })}
                className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground hover:bg-muted"
              >
                None
              </button>
            )}
          </div>
        </Field>
      )}
    </div>
  );
}
