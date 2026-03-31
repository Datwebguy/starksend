"use client";
// src/components/TransactionHistory.tsx
// ============================================================
// StarkSend – Tip History Feed
// ============================================================
// Scrollable list of tips sent during the current session.
// Each entry shows recipient, amount, timestamp, and explorer link.
// ============================================================

import React from "react";
import type { TipRecord } from "@/hooks/useTransactionHistory";

interface TransactionHistoryProps {
  tips: TipRecord[];
  totalTipped: string;
  onClear: () => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function TransactionHistory({
  tips,
  totalTipped,
  onClear,
}: TransactionHistoryProps) {
  if (tips.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs text-neutral-600">
          No tips sent yet this session.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
          Session History ({tips.length})
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-amber-400/80 font-semibold tabular-nums">
            {totalTipped} STRK tipped
          </span>
          <button
            onClick={onClear}
            className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {tips.map((tip) => (
          <div
            key={tip.id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-800/40 border border-neutral-800/60 hover:bg-neutral-800/60 transition-colors group"
          >
            {/* Left: recipient + time */}
            <div className="min-w-0">
              <p className="text-xs font-mono text-neutral-300 truncate">
                → {tip.recipientShort}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5">
                {timeAgo(tip.timestamp)}
              </p>
            </div>

            {/* Right: amount + explorer link */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <span className="text-xs font-semibold text-amber-400 tabular-nums">
                {tip.amount} {tip.tokenSymbol}
              </span>
              {tip.explorerUrl && (
                <a
                  href={tip.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-neutral-600 group-hover:text-neutral-400 transition-colors"
                  title="View on explorer"
                >
                  ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
