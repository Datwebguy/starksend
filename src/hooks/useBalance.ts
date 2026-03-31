"use client";
// src/hooks/useBalance.ts
// ============================================================
// StarkSend – Live Balance Hook
// ============================================================
// Polls ERC20 balanceOf() on an interval so the UI stays
// fresh without manual refreshes.
// Uses starknet.js Contract directly — no Starkzap SDK.
//
// Beaver logging: [StarkSend:Balance]
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useStarkSendSession } from "@/components/StarkSendSessionProvider";

// ── Types ────────────────────────────────────────────────────

export interface TokenBalance {
  symbol: string;
  formatted: string;      // "150.25"
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

// ── Token config ──────────────────────────────────────────────

const TOKEN_CONFIG: Record<string, { address: string; decimals: number }> = {
  STRK: { address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", decimals: 18 },
  ETH:  { address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", decimals: 18 },
  USDC: { address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8", decimals: 6  },
};

// ── Helpers ───────────────────────────────────────────────────

function formatBalance(raw: bigint, decimals: number): string {
  if (raw === 0n) return "0";
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const remainder = raw % divisor;
  if (remainder === 0n) return whole.toString();
  const fracStr = remainder.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracStr.slice(0, 4)}`;
}

// ── Default tokens to track ──────────────────────────────────

const TRACKED_SYMBOLS = ["STRK", "ETH", "USDC"] as const;

// ── Hook ─────────────────────────────────────────────────────

export function useBalance(
  pollInterval = 15_000,
  symbols: readonly string[] = TRACKED_SYMBOLS
): UseBalanceReturn {
  const { session } = useStarkSendSession();

  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);

      const account = session.wallet;
      log("🔄 Fetching balances", { symbols, address: session.address });

      const results: TokenBalance[] = [];

      for (const sym of symbols) {
        const config = TOKEN_CONFIG[sym];
        if (!config) {
          log(`⚠️ Token ${sym} not in config — skipping`);
          continue;
        }

        const response = await account.callContract({
          contractAddress: config.address,
          entrypoint: "balanceOf",
          calldata: [session.address],
        });
        // Response is an array of felt252 strings; u256 = [low, high]
        const raw = BigInt(response[0] ?? "0");

        const formatted = formatBalance(raw, config.decimals);
        results.push({
          symbol: sym,
          formatted,
          formattedFull: `${sym} ${formatted}`,
          isZero: raw === 0n,
          raw: raw.toString(),
        });
      }

      log("✅ Balances fetched", results.map((b) => b.formattedFull));
      setBalances(results);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Balance fetch failed";
      log("❌ Balance error", { message });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session, symbols]);

  useEffect(() => {
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
