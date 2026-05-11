export type EditorObjectBase = {
  id: string;
  page: number; // 1-indexed
  x: number; // PDF points, origin top-left of page (we convert on export)
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type TextObject = EditorObjectBase & {
  type: "text";
  text: string;
  fontSize: number;
  color: string; // hex
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  align: "left" | "center" | "right";
};

export type ShapeObject = EditorObjectBase & {
  type: "rect" | "circle" | "line" | "highlight";
  stroke: string;
  fill: string;
  strokeWidth: number;
};

export type ImageObject = EditorObjectBase & {
  type: "image";
  src: string; // data URL
};

export type EditorObject = TextObject | ShapeObject | ImageObject;

export type Tool =
  | "select"
  | "text"
  | "rect"
  | "circle"
  | "line"
  | "highlight"
  | "image"
  | "signature";
