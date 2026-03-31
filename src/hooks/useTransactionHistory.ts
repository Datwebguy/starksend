"use client";
// src/hooks/useTransactionHistory.ts
// ============================================================
// StarkSend – Session-level Transaction History
// ============================================================
// Stores completed tips in React state so the UI can show a
// live feed.  This is ephemeral (clears on page reload).
// A persistent backend could be added later via an API route.
//
// Beaver logging: [StarkSend:History]
// ============================================================

import { useCallback, useState } from "react";

// ── Types ────────────────────────────────────────────────────

export interface TipRecord {
  id: string;
  recipient: string;
  recipientShort: string;
  amount: string;
  tokenSymbol: string;
  txHash: string;
  explorerUrl: string;
  timestamp: number;
}

export interface UseTransactionHistoryReturn {
  tips: TipRecord[];
  addTip: (tip: Omit<TipRecord, "id" | "timestamp" | "recipientShort">) => void;
  clearHistory: () => void;
  totalTipped: string;
}

// ── Logging ──────────────────────────────────────────────────

const LOG = "[StarkSend:History]";

function log(stage: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`${LOG} ${stage}`, payload);
  } else {
    console.log(`${LOG} ${stage}`);
  }
}

// ── Utility ──────────────────────────────────────────────────

function truncate(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `tip-${Date.now()}-${counter}`;
}

// ── Hook ─────────────────────────────────────────────────────

export function useTransactionHistory(): UseTransactionHistoryReturn {
  const [tips, setTips] = useState<TipRecord[]>([]);

  const addTip = useCallback(
    (tip: Omit<TipRecord, "id" | "timestamp" | "recipientShort">) => {
      const record: TipRecord = {
        ...tip,
        id: nextId(),
        timestamp: Date.now(),
        recipientShort: truncate(tip.recipient),
      };

      log("📝 Tip recorded", {
        to: record.recipientShort,
        amount: `${record.amount} ${record.tokenSymbol}`,
      });

      setTips((prev) => [record, ...prev]); // newest first
    },
    []
  );

  const clearHistory = useCallback(() => {
    log("🗑️ History cleared");
    setTips([]);
  }, []);

  // Sum all tips for the default token (STRK).
  const totalTipped = tips
    .filter((t) => t.tokenSymbol === "STRK")
    .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0)
    .toFixed(2);

  return { tips, addTip, clearHistory, totalTipped };
}
