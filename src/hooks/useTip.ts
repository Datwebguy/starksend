"use client";
// src/hooks/useTip.ts
// ============================================================
// StarkSend – Tipping Transaction Hook
// ============================================================
// Encapsulates the full tip lifecycle:
//   1. Validate recipient address + amount
//   2. Check sender balance
//   3. Execute gasless transfer via Starkzap
//   4. Wait for on-chain confirmation
//
// All Starkzap API calls follow the official ERC20 docs:
//   https://docs.starknet.io/build/starkzap/erc20
// ============================================================

import { useCallback, useState } from "react";
import { Amount, fromAddress, getPresets } from "starkzap";
import { useStarkSendSession } from "@/components/StarkSendSessionProvider";

// ── Types ────────────────────────────────────────────────────

export type TipStatus =
  | "idle"
  | "validating"
  | "sending"
  | "confirming"
  | "success"
  | "error";

export interface TipResult {
  /** Transaction hash (hex) */
  txHash: string;
  /** Block explorer URL */
  explorerUrl: string;
}

export interface UseTipReturn {
  status: TipStatus;
  error: string | null;
  result: TipResult | null;
  /** Send a tip. Amount is in human-readable units (e.g. "5" = 5 STRK). */
  sendTip: (recipientAddress: string, amount: string, tokenSymbol?: string) => Promise<void>;
  /** Reset to idle for another tip. */
  reset: () => void;
}

// ── Logging ──────────────────────────────────────────────────

const LOG = "[StarkSend:Tip]";

function log(stage: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`${LOG} ${stage}`, payload);
  } else {
    console.log(`${LOG} ${stage}`);
  }
}

// ── Address validation ───────────────────────────────────────

const STARK_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

function isValidStarknetAddress(addr: string): boolean {
  return STARK_ADDRESS_RE.test(addr);
}

// ── Hook ─────────────────────────────────────────────────────

export function useTip(): UseTipReturn {
  const { session } = useStarkSendSession();

  const [status, setStatus] = useState<TipStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TipResult | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
  }, []);

  const sendTip = useCallback(
    async (recipientAddress: string, amount: string, tokenSymbol = "STRK") => {
      if (!session) {
        setError("No active session — connect your wallet first.");
        setStatus("error");
        return;
      }

      try {
        // ── Step 1: Validate inputs ────────────────────────
        log("📝 Validating inputs", { recipientAddress, amount, tokenSymbol });
        setStatus("validating");
        setError(null);
        setResult(null);

        if (!isValidStarknetAddress(recipientAddress)) {
          throw new Error(
            "Invalid Starknet address. Expected 0x followed by 1-64 hex chars."
          );
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          throw new Error("Tip amount must be a positive number.");
        }

        // ── Step 2: Resolve token + check balance ──────────
        const wallet = session.wallet;
        const presets = getPresets(wallet.getChainId());
        const token = presets[tokenSymbol];

        if (!token) {
          throw new Error(
            `Token "${tokenSymbol}" not found in presets for this network.`
          );
        }

        log("💰 Checking balance", { token: token.symbol });
        const balance = await wallet.balanceOf(token);
        const tipAmount = Amount.parse(amount, token);

        log("📊 Balance check", {
          balance: balance.toFormatted(true),
          tipAmount: tipAmount.toFormatted(true),
        });

        if (balance.lt(tipAmount)) {
          throw new Error(
            `Insufficient balance. You have ${balance.toFormatted(true)} ` +
              `but tried to tip ${tipAmount.toFormatted(true)}.`
          );
        }

        // ── Step 3: Execute transfer ───────────────────────
        log("🚀 Sending tip transaction…");
        setStatus("sending");

        const tx = await wallet.transfer(token, [
          {
            to: fromAddress(recipientAddress),
            amount: tipAmount,
          },
        ]);

        log("⏳ Tx submitted, waiting for confirmation", {
          explorerUrl: tx.explorerUrl,
        });
        setStatus("confirming");

        await tx.wait();

        // ── Step 4: Done ───────────────────────────────────
        const tipResult: TipResult = {
          txHash: tx.explorerUrl?.split("/tx/")[1] ?? "unknown",
          explorerUrl: tx.explorerUrl ?? "",
        };

        log("🎉 Tip confirmed!", tipResult);
        setResult(tipResult);
        setStatus("success");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error sending tip";
        log("❌ Tip failed", { message });
        setError(message);
        setStatus("error");
      }
    },
    [session]
  );

  return { status, error, result, sendTip, reset };
}
