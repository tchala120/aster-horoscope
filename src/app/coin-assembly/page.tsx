"use client";

import { useState } from "react";
import { CoinAssemblyScene } from "@/modules/token/CoinAssembly";

export default function CoinAssemblyPage() {
  const [replayToken, setReplayToken] = useState(0);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100dvh", background: "#050b17" }}>
      <CoinAssemblyScene className="h-full w-full" autoLoop replayToken={replayToken} />

      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: "0.75rem",
        }}
      >
        <button
          type="button"
          onClick={() => setReplayToken((n) => n + 1)}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "999px",
            border: "1px solid rgba(125,211,252,0.4)",
            background: "rgba(15,30,60,0.7)",
            color: "#dff2ff",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
            cursor: "pointer",
            backdropFilter: "blur(6px)",
          }}
        >
          Replay assembly
        </button>
      </div>
    </div>
  );
}
