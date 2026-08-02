"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type TxAction = "approve" | "stake" | "withdraw" | "claim" | "exit" | "emergency";
export type TxPhase = "sign" | "confirm";

const ACTION_LABELS: Record<TxAction, string> = {
  approve: "Approving HP…",
  stake: "Staking HP…",
  withdraw: "Withdrawing HP…",
  claim: "Claiming rewards…",
  exit: "Exiting position…",
  emergency: "Emergency withdrawing…",
};

const BLOCK_COUNT = 4;

/** A short chain of blocks that travels left-to-right and loops, like new
 * blocks moving through the chain while a transaction confirms. */
function BlockTrain({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative h-14 w-64 overflow-hidden">
      {/* Faint track the chain rides along. */}
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />

      <motion.div
        className="absolute inset-y-0 left-0 flex items-center gap-1"
        animate={reduced ? undefined : { x: ["-15%", "115%"] }}
        transition={reduced ? undefined : { duration: 2.2, ease: "linear", repeat: Infinity }}
        style={reduced ? { left: "42%" } : undefined}
      >
        {Array.from({ length: BLOCK_COUNT }).map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <motion.div
              className="h-9 w-9 rounded-lg bg-brand-gradient"
              style={{ boxShadow: "0 0 14px -2px rgba(51,204,173,0.7)" }}
              animate={reduced ? undefined : { opacity: [0.55, 1, 0.55] }}
              transition={
                reduced ? undefined : { duration: 1.1, ease: "easeInOut", repeat: Infinity, delay: i * 0.15 }
              }
            />
            {i < BLOCK_COUNT - 1 && <div className="h-0.5 w-3 shrink-0 bg-white/25" />}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

interface TransactionOverlayProps {
  /** null hides the overlay. */
  action: TxAction | null;
  phase: TxPhase;
}

/** Full-screen blocking overlay shown while a staking transaction is signing/confirming. */
export function TransactionOverlay({ action, phase }: TransactionOverlayProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <AnimatePresence>
      {action ? (
        <motion.div
          key="tx-overlay"
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-grey-950/85 backdrop-blur-sm"
        >
          <BlockTrain reduced={reduced} />
          <div className="text-center">
            <p className="text-text-lg font-semibold text-grey-50">{ACTION_LABELS[action]}</p>
            <p className="mt-1 text-text-sm text-grey-400">
              {phase === "sign" ? "Confirm the transaction in your wallet…" : "Waiting for on-chain confirmation…"}
            </p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
