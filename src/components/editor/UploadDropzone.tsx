import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

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
    <label
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
      className={`relative flex w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"
      }`}
    >
      <div className="mb-4 rounded-full bg-primary/10 p-5 text-primary">
        <Upload className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground">Drop a PDF to start editing</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Or click to browse · Files never leave your browser
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
    </label>
  );
}
