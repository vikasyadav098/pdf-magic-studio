import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export function ExportSuccess({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.6, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="flex items-center gap-3 rounded-2xl glass-strong px-5 py-4 shadow-elegant"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 14, delay: 0.05 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground"
            >
              <Check className="h-5 w-5" strokeWidth={3} />
              <span className="absolute inset-0 rounded-full pulse-ring" />
            </motion.div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-foreground">PDF exported</div>
              <div className="text-xs text-muted-foreground">Saved to your downloads</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
