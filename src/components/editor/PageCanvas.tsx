import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Image as KImage, Rect, Ellipse, Line, Text, Transformer, Group } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import type { EditorObject, ImageObject, ShapeObject, TextObject, Tool } from "@/lib/editor-types";
import type { LoadedPage } from "@/hooks/use-pdf-loader";

type Props = {
  page: LoadedPage;
  bgUrl: string | null;
  scale: number; // display scale (pixels per PDF point)
  tool: Tool;
  objects: EditorObject[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (obj: EditorObject) => void;
  onUpdate: (id: string, patch: Partial<EditorObject>, record?: boolean) => void;
};

export function PageCanvas({
  page,
  bgUrl,
  scale,
  tool,
  objects,
  selectedId,
  onSelect,
  onAdd,
  onUpdate,
}: Props) {
  const [bg] = useImage(bgUrl || "");
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [draft, setDraft] = useState<EditorObject | null>(null);
  const drawing = useRef(false);
  const startPt = useRef({ x: 0, y: 0 });

  const widthPx = page.widthPt * scale;
  const heightPx = page.heightPt * scale;

  // Attach transformer to selected node
  useEffect(() => {
    const tr = trRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = stage.findOne("#" + selectedId);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, objects]);

  const pageObjects = useMemo(
    () => objects.filter((o) => o.page === page.pageNumber),
    [objects, page.pageNumber],
  );

  const toPt = (px: number) => px / scale;

  const newId = () => Math.random().toString(36).slice(2, 10);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    // Click on empty area
    const clickedEmpty = e.target === stage || e.target.attrs.id === "bg-image";
    if (tool === "select") {
      if (clickedEmpty) onSelect(null);
      return;
    }
    if (!clickedEmpty) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;
    const x = toPt(pos.x);
    const y = toPt(pos.y);

    if (tool === "text") {
      const obj: TextObject = {
        id: newId(),
        type: "text",
        page: page.pageNumber,
        x,
        y,
        width: 220,
        height: 40,
        text: "New text",
        fontSize: 18,
        color: "#111111",
        fontStyle: "normal",
        align: "left",
      };
      onAdd(obj);
      onSelect(obj.id);
      return;
    }

    // Shape draft
    drawing.current = true;
    startPt.current = { x, y };
    const baseShape = {
      id: newId(),
      page: page.pageNumber,
      x,
      y,
      width: 1,
      height: 1,
    };
    if (tool === "rect") {
      setDraft({
        ...baseShape,
        type: "rect",
        stroke: "#1f2937",
        fill: "transparent",
        strokeWidth: 2,
      } as ShapeObject);
    } else if (tool === "circle") {
      setDraft({
        ...baseShape,
        type: "circle",
        stroke: "#1f2937",
        fill: "transparent",
        strokeWidth: 2,
      } as ShapeObject);
    } else if (tool === "line") {
      setDraft({
        ...baseShape,
        type: "line",
        stroke: "#1f2937",
        fill: "transparent",
        strokeWidth: 2,
      } as ShapeObject);
    } else if (tool === "highlight") {
      setDraft({
        ...baseShape,
        type: "highlight",
        stroke: "transparent",
        fill: "#fde047",
        strokeWidth: 0,
      } as ShapeObject);
    }
  };

  const handleStageMouseMove = () => {
    if (!drawing.current || !draft) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const x = toPt(pos.x);
    const y = toPt(pos.y);
    const sx = startPt.current.x;
    const sy = startPt.current.y;
    setDraft({
      ...draft,
      x: Math.min(sx, x),
      y: Math.min(sy, y),
      width: Math.abs(x - sx) || 1,
      height: Math.abs(y - sy) || 1,
    } as EditorObject);
  };

  const handleStageMouseUp = () => {
    if (drawing.current && draft) {
      drawing.current = false;
      // Reject tiny shapes
      if (draft.width > 4 && draft.height > 4) {
        onAdd(draft);
        onSelect(draft.id);
      }
      setDraft(null);
    }
  };

  const renderObject = (o: EditorObject, isDraft = false) => {
    const common = {
      id: o.id,
      x: o.x * scale,
      y: o.y * scale,
      draggable: !isDraft && tool === "select",
      onClick: () => tool === "select" && onSelect(o.id),
      onTap: () => tool === "select" && onSelect(o.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
        onUpdate(o.id, { x: e.target.x() / scale, y: e.target.y() / scale });
      },
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
        const node = e.target;
        const sx = node.scaleX();
        const sy = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onUpdate(o.id, {
          x: node.x() / scale,
          y: node.y() / scale,
          width: Math.max(5, (o.width * sx)),
          height: Math.max(5, (o.height * sy)),
        });
      },
    };

    if (o.type === "text") {
      const t = o as TextObject;
      return (
        <Text
          key={o.id}
          {...common}
          text={t.text}
          width={o.width * scale}
          height={o.height * scale}
          fontSize={t.fontSize * scale}
          fill={t.color}
          align={t.align}
          fontStyle={t.fontStyle}
          fontFamily="Helvetica, Arial, sans-serif"
        />
      );
    }
    if (o.type === "rect" || o.type === "highlight") {
      const s = o as ShapeObject;
      return (
        <Rect
          key={o.id}
          {...common}
          width={o.width * scale}
          height={o.height * scale}
          stroke={s.stroke === "transparent" ? undefined : s.stroke}
          strokeWidth={s.strokeWidth * scale}
          fill={s.fill === "transparent" ? undefined : s.fill}
          opacity={o.type === "highlight" ? 0.4 : 1}
        />
      );
    }
    if (o.type === "circle") {
      const s = o as ShapeObject;
      return (
        <Ellipse
          key={o.id}
          {...common}
          x={(o.x + o.width / 2) * scale}
          y={(o.y + o.height / 2) * scale}
          radiusX={(o.width / 2) * scale}
          radiusY={(o.height / 2) * scale}
          stroke={s.stroke === "transparent" ? undefined : s.stroke}
          strokeWidth={s.strokeWidth * scale}
          fill={s.fill === "transparent" ? undefined : s.fill}
          onDragEnd={(e) => {
            onUpdate(o.id, {
              x: e.target.x() / scale - o.width / 2,
              y: e.target.y() / scale - o.height / 2,
            });
          }}
        />
      );
    }
    if (o.type === "line") {
      const s = o as ShapeObject;
      return (
        <Line
          key={o.id}
          {...common}
          points={[0, 0, o.width * scale, o.height * scale]}
          stroke={s.stroke}
          strokeWidth={s.strokeWidth * scale}
        />
      );
    }
    if (o.type === "image") {
      const im = o as ImageObject;
      return (
        <KonvaImageObj
          key={o.id}
          obj={im}
          scale={scale}
          common={common}
        />
      );
    }
    return null;
  };

  return (
    <div
      className="relative shadow-2xl"
      style={{ width: widthPx, height: heightPx, backgroundColor: "#fff" }}
    >
      <Stage
        ref={stageRef}
        width={widthPx}
        height={heightPx}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown as any}
        onTouchMove={handleStageMouseMove as any}
        onTouchEnd={handleStageMouseUp as any}
        style={{ cursor: tool === "select" ? "default" : "crosshair" }}
      >
        <Layer>
          {bg && <KImage id="bg-image" image={bg} width={widthPx} height={heightPx} listening />}
        </Layer>
        <Layer>
          <Group>
            {pageObjects.map((o) => renderObject(o))}
            {draft && renderObject(draft, true)}
          </Group>
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorSize={8}
            anchorStroke="#2563eb"
            anchorFill="#fff"
            borderStroke="#2563eb"
          />
        </Layer>
      </Stage>
    </div>
  );
}

function KonvaImageObj({
  obj,
  scale,
  common,
}: {
  obj: ImageObject;
  scale: number;
  common: any;
}) {
  const [img] = useImage(obj.src);
  return (
    <KImage
      {...common}
      image={img}
      width={obj.width * scale}
      height={obj.height * scale}
    />
  );
}
