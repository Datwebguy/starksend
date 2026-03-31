"use client";
import { useCallback, useState } from "react";
import { Contract, cairo, CallData } from "starknet";
import { useStarkSendSession } from "@/components/StarkSendSessionProvider";

export type TipStatus = "idle" | "validating" | "sending" | "confirming" | "success" | "error";

export interface TipResult {
  txHash: string;
  explorerUrl: string;
}

export interface UseTipReturn {
  status: TipStatus;
  error: string | null;
  result: TipResult | null;
  sendTip: (recipientAddress: string, amount: string, tokenSymbol?: string) => Promise<void>;
  reset: () => void;
}

const LOG = "[StarkSend:Tip]";
function log(stage: string, payload?: unknown) {
  if (payload !== undefined) console.log(`${LOG} ${stage}`, payload);
  else console.log(`${LOG} ${stage}`);
}

const TOKEN_CONFIG: Record<string, { address: string; decimals: number }> = {
  STRK: { address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", decimals: 18 },
  ETH: { address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", decimals: 18 },
  USDC: { address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8", decimals: 6 },
};

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "recipient", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount", type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
  {
    name: "balanceOf",
    type: "function",
    inputs: [{ name: "account", type: "core::starknet::contract_address::ContractAddress" }],
    outputs: [{ type: "core::integer::u256" }],
    state_mutability: "view",
  },
];

const STARK_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/;

function parseAmount(amount: string, decimals: number): bigint {
  const parts = amount.split(".");
  const whole = parts[0] || "0";
  const fraction = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + fraction);
}

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
        log("📝 Validating inputs", { recipientAddress, amount, tokenSymbol });
        setStatus("validating");
        setError(null);
        setResult(null);

        if (!STARK_ADDRESS_RE.test(recipientAddress)) {
          throw new Error("Invalid Starknet address.");
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
          throw new Error("Tip amount must be a positive number.");
        }

        const tokenConfig = TOKEN_CONFIG[tokenSymbol];
        if (!tokenConfig) {
          throw new Error(`Token "${tokenSymbol}" not supported.`);
        }

        log("🚀 Sending tip transaction…");
        setStatus("sending");

        const account = session.wallet;
        const amountWei = parseAmount(amount, tokenConfig.decimals);
        const u256Amount = cairo.uint256(amountWei);

        const result = await account.execute([
          {
            contractAddress: tokenConfig.address,
            entrypoint: "transfer",
            calldata: CallData.compile({
              recipient: recipientAddress,
              amount: u256Amount,
            }),
          },
        ]);

        log("⏳ Tx submitted", { txHash: result.transaction_hash });
        setStatus("confirming");

        await account.waitForTransaction(result.transaction_hash);

        const explorerUrl = `https://starkscan.co/tx/${result.transaction_hash}`;
        log("🎉 Tip confirmed!", { explorerUrl });

        setResult({ txHash: result.transaction_hash, explorerUrl });
        setStatus("success");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error sending tip";
        log("❌ Tip failed", { message });
        setError(message);
        setStatus("error");
      }
    },
    [session]
  );

  return { status, error, result, sendTip, reset };
}
