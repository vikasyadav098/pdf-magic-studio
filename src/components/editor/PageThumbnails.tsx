import type { LoadedPage } from "@/hooks/use-pdf-loader";

export function PageThumbnails({
  pages,
  current,
  onSelect,
}: {
  pages: LoadedPage[];
  current: number;
  onSelect: (n: number) => void;
}) {
  return (
    <aside className="flex h-full w-44 shrink-0 flex-col overflow-y-auto border-r border-border bg-card p-3">
      <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Pages
      </div>
      <div className="flex flex-col gap-2">
        {pages.map((p) => (
          <button
            key={p.pageNumber}
            onClick={() => onSelect(p.pageNumber)}
            className={`group relative overflow-hidden rounded-md border transition-all ${
              current === p.pageNumber
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img src={p.thumbnail} alt={`Page ${p.pageNumber}`} className="block w-full" />
            <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
              {p.pageNumber}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
