"use client";
// src/hooks/useBalance.ts
// ============================================================
// StarkSend – Live Balance Hook
// ============================================================
// Polls wallet.balanceOf() on an interval so the UI stays
// fresh without manual refreshes.
//
// Starkzap API used:
//   wallet.balanceOf(token)  → Amount
//   getPresets(chainId)      → Record<string, Token>
//
// Beaver logging: [StarkSend:Balance]
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { getPresets } from "starkzap";
import { useStarkSendSession } from "@/components/StarkSendSessionProvider";

// ── Types ────────────────────────────────────────────────────

export interface TokenBalance {
  symbol: string;
  formatted: string;     // "150.25"
  formattedFull: string;  // "STRK 150.25"
  isZero: boolean;
  raw: string;            // bigint as string for serialisation
}

export interface UseBalanceReturn {
  balances: TokenBalance[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ── Logging ──────────────────────────────────────────────────

const LOG = "[StarkSend:Balance]";

function log(stage: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`${LOG} ${stage}`, payload);
  } else {
    console.log(`${LOG} ${stage}`);
  }
}

// ── Default tokens to track ──────────────────────────────────

const TRACKED_SYMBOLS = ["STRK", "ETH", "USDC"] as const;

// ── Hook ─────────────────────────────────────────────────────

export function useBalance(
  /** Poll interval in ms.  Set to 0 to disable polling. */
  pollInterval = 15_000,
  /** Override which token symbols to track. */
  symbols: readonly string[] = TRACKED_SYMBOLS
): UseBalanceReturn {
  const { session } = useStarkSendSession();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core fetch ─────────────────────────────────────────────

  const fetchBalances = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);

      const wallet = session.wallet;
      const chainId = wallet.getChainId();
      const presets = getPresets(chainId);

      log("🔄 Fetching balances", { symbols, chainId });

      const results: TokenBalance[] = [];

      for (const sym of symbols) {
        const token = presets[sym];
        if (!token) {
          log(`⚠️ Token ${sym} not in presets — skipping`);
          continue;
        }

        const balance = await wallet.balanceOf(token);
        results.push({
          symbol: token.symbol,
          formatted: balance.toUnit(),
          formattedFull: balance.toFormatted(true),
          isZero: balance.isZero(),
          raw: balance.toBase().toString(),
        });
      }

      log("✅ Balances fetched", results.map((b) => b.formattedFull));
      setBalances(results);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Balance fetch failed";
      log("❌ Balance error", { message });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session, symbols]);

  // ── Polling lifecycle ──────────────────────────────────────

  useEffect(() => {
    // Fetch immediately when session becomes active.
    if (session) {
      fetchBalances();
    } else {
      setBalances([]);
      return;
    }

    if (pollInterval > 0) {
      timerRef.current = setInterval(fetchBalances, pollInterval);
      log("⏱️ Polling started", { intervalMs: pollInterval });
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        log("⏱️ Polling stopped");
      }
    };
  }, [session, pollInterval, fetchBalances]);

  return { balances, isLoading, error, refresh: fetchBalances };
}
