"use client";
// src/components/BalanceDisplay.tsx
// ============================================================
// StarkSend – Wallet Balance Strip
// ============================================================
// Compact horizontal display of tracked token balances with
// auto-refresh indicator.
// ============================================================

import React from "react";
import { useBalance } from "@/hooks/useBalance";

// ── Token icon map (emoji fallback — replace with real icons) ─

const ICON: Record<string, string> = {
  STRK: "⚡",
  ETH: "◆",
  USDC: "$",
};

export function BalanceDisplay() {
  const { balances, isLoading, error, refresh } = useBalance(15_000);

  if (balances.length === 0 && !isLoading) {
    return null; // nothing to show yet
  }

  return (
    <div className="space-y-2">
      {/* Balance pills */}
      <div className="flex flex-wrap gap-2">
        {balances.map((b) => (
          <div
            key={b.symbol}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50"
          >
            <span className="text-xs opacity-60">
              {ICON[b.symbol] ?? "●"}
            </span>
            <span
              className={`text-xs font-semibold tabular-nums ${
                b.isZero ? "text-neutral-500" : "text-neutral-200"
              }`}
            >
              {parseFloat(b.formatted).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="text-[10px] text-neutral-500 font-medium">
              {b.symbol}
            </span>
          </div>
        ))}

        {/* Refresh button */}
        <button
          onClick={refresh}
          disabled={isLoading}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/40 transition-colors cursor-pointer disabled:opacity-40"
          title="Refresh balances"
        >
          <span className={isLoading ? "animate-spin" : ""}>↻</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-[10px] text-red-400/80">{error}</p>
      )}
    </div>
  );
}
