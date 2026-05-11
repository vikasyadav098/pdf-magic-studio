import type { LoadedPage } from "@/hooks/use-pdf-loader";
import { motion } from "framer-motion";

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
    <aside className="flex h-full w-48 shrink-0 flex-col overflow-y-auto border-r border-border bg-[color:var(--color-sidebar)] p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Pages
        </span>
        <span className="rounded-full bg-[color:var(--color-elevated)] px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
          {pages.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {pages.map((p, i) => {
          const active = current === p.pageNumber;
          return (
            <motion.button
              key={p.pageNumber}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(p.pageNumber)}
              className={`group relative overflow-hidden rounded-lg border text-left transition-all ${
                active
                  ? "border-primary/70 ring-glow"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="relative bg-white">
                <img
                  src={p.thumbnail}
                  alt={`Page ${p.pageNumber}`}
                  className="block w-full transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {active && (
                  <motion.span
                    layoutId="thumb-active-overlay"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 14%, transparent), transparent 60%)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  />
                )}
              </div>
              <div className="flex items-center justify-between px-2 py-1.5 text-[11px]">
                <span className={active ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  Page {p.pageNumber}
                </span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px] shadow-primary/70" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
}
