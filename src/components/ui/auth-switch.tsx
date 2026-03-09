import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AuthSwitchProps {
  mode: "login" | "signup";
  onSwitch: (mode: "login" | "signup") => void;
}

export function AuthSwitch({ mode, onSwitch }: AuthSwitchProps) {
  return (
    <div className="relative flex w-full rounded-xl bg-white/5 border border-white/10 p-1">
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-opti-accent/20 border border-opti-accent/30"
        animate={{
          left: mode === "login" ? "4px" : "50%",
          width: "calc(50% - 8px)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
      <button
        type="button"
        onClick={() => onSwitch("login")}
        className={cn(
          "relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors",
          mode === "login" ? "text-opti-accent" : "text-opti-text-secondary hover:text-opti-text-primary"
        )}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onSwitch("signup")}
        className={cn(
          "relative z-10 flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors",
          mode === "signup" ? "text-opti-accent" : "text-opti-text-secondary hover:text-opti-text-primary"
        )}
      >
        Sign Up
      </button>
    </div>
  );
}
