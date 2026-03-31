"use client";
// src/hooks/useTip.ts
// ============================================================
// StarkSend – Tipping Transaction Hook
// ============================================================
// Encapsulates the full tip lifecycle:
//   1. Validate recipient address + amount
//   2. Execute gasless ERC20 transfer via starknet.js
//   3. Wait for on-chain confirmation
//
// Uses starknet.js Contract directly with the Cartridge
// WalletAccount — no Starkzap SDK wrapper needed.
// ============================================================

import { useCallback, useState } from "react";
import { Contract, cairo } from "starknet";
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

// ── Token config ──────────────────────────────────────────────

const TOKEN_CONFIG: Record<string, { address: string; decimals: number }> = {
  STRK: {
    address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
  },
  ETH: {
    address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
  },
  USDC: {
    address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
    decimals: 6,
  },
};

// Minimal ERC20 ABI — only the transfer function we need.
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      {
        name: "recipient",
        type: "core::starknet::contract_address::ContractAddress",
      },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [],
    state_mutability: "external",
  },
];

// ── Address validation ───────────────────────────────────────

const STARK_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

function isValidStarknetAddress(addr: string): boolean {
  return STARK_ADDRESS_RE.test(addr);
}

// ── Amount conversion ────────────────────────────────────────

function toWei(humanAmount: string, decimals: number): bigint {
  // Parse as a float then convert to integer wei using BigInt.
  // E.g. "5" with 18 decimals → 5000000000000000000n
  const [intPart, fracPart = ""] = humanAmount.split(".");
  const paddedFrac = fracPart.slice(0, decimals).padEnd(decimals, "0");
  return BigInt(intPart) * BigInt(10 ** decimals) + BigInt(paddedFrac);
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

        // ── Step 2: Resolve token ──────────────────────────
        const tokenConfig = TOKEN_CONFIG[tokenSymbol.toUpperCase()];
        if (!tokenConfig) {
          throw new Error(
            `Token "${tokenSymbol}" is not supported. Use STRK, ETH, or USDC.`
          );
        }

        log("🪙 Token resolved", {
          symbol: tokenSymbol,
          address: tokenConfig.address,
          decimals: tokenConfig.decimals,
        });

        // ── Step 3: Convert amount to wei ──────────────────
        const amountWei = toWei(amount, tokenConfig.decimals);

        log("🔢 Amount converted to wei", {
          human: amount,
          wei: amountWei.toString(),
        });

        // ── Step 4: Execute ERC20 transfer ─────────────────
        log("🚀 Sending tip transaction…");
        setStatus("sending");

        const account = session.wallet; // Cartridge WalletAccount
        const contract = new Contract(ERC20_ABI, tokenConfig.address, account);

        const tx = await contract.transfer(
          recipientAddress,
          cairo.uint256(amountWei)
        );

        const txHash: string = tx.transaction_hash;

        log("⏳ Tx submitted, waiting for confirmation", { txHash });
        setStatus("confirming");

        await account.waitForTransaction(txHash);

        // ── Step 5: Done ───────────────────────────────────
        const explorerUrl = `https://starkscan.co/tx/${txHash}`;

        const tipResult: TipResult = { txHash, explorerUrl };

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
