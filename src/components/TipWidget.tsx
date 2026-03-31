"use client";
// src/components/TipWidget.tsx
// ============================================================
// StarkSend – 1-Click Tipping Widget (Multi-Token)
// ============================================================
// Phase 4: Token selector (STRK / ETH / USDC), preset amounts,
// custom input, onTipSuccess callback.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { useTip } from "@/hooks/useTip";
import { SUPPORTED_TOKENS, getTokenMeta } from "@/lib/tokens";

// ── Preset tip amounts per token ─────────────────────────────

const PRESETS: Record<string, string[]> = {
  STRK: ["1", "5", "10", "25"],
  ETH: ["0.001", "0.005", "0.01", "0.05"],
  USDC: ["1", "5", "10", "25"],
};

function getPresets(symbol: string): string[] {
  return PRESETS[symbol] ?? ["1", "5", "10", "25"];
}

// ── Component ────────────────────────────────────────────────

interface TipWidgetProps {
  defaultRecipient?: string;
  lockRecipient?: boolean;
  onTipSuccess?: (data: {
    recipient: string;
    amount: string;
    tokenSymbol: string;
    txHash: string;
    explorerUrl: string;
  }) => void;
}

export function TipWidget({
  defaultRecipient = "",
  lockRecipient = false,
  onTipSuccess,
}: TipWidgetProps) {
  const { status, error, result, sendTip, reset } = useTip();

  const [recipient, setRecipient] = useState(defaultRecipient);
  const [selectedToken, setSelectedToken] = useState("STRK");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState(false);

  const pendingRef = useRef<{ recipient: string; amount: string; token: string } | null>(null);
  const firedRef = useRef(false);

  const tokenMeta = getTokenMeta(selectedToken);
  const presets = getPresets(selectedToken);

  // ── Handlers ─────────────────────────────────────────────

  function handleTokenChange(symbol: string) {
    setSelectedToken(symbol);
    setAmount("");
    setCustomAmount(false);
  }

  function handlePresetClick(preset: string) {
    setAmount(preset);
    setCustomAmount(false);
  }

  function handleCustomToggle() {
    setCustomAmount(true);
    setAmount("");
  }

  async function handleSend() {
    if (!recipient || !amount) return;
    pendingRef.current = { recipient, amount, token: selectedToken };
    firedRef.current = false;
    await sendTip(recipient, amount, selectedToken);
  }

  function handleReset() {
    reset();
    setAmount("");
    setCustomAmount(false);
    pendingRef.current = null;
    firedRef.current = false;
  }

  // ── Fire callback exactly once on success ──────────────────

  useEffect(() => {
    if (
      status === "success" &&
      result &&
      pendingRef.current &&
      onTipSuccess &&
      !firedRef.current
    ) {
      firedRef.current = true;
      onTipSuccess({
        recipient: pendingRef.current.recipient,
        amount: pendingRef.current.amount,
        tokenSymbol: pendingRef.current.token,
        txHash: result.txHash,
        explorerUrl: result.explorerUrl,
      });
    }
  }, [status, result, onTipSuccess]);

  // ── Success screen ───────────────────────────────────────

  if (status === "success" && result) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-center space-y-3">
          <div className="text-3xl">🎉</div>
          <p className="text-sm font-semibold text-emerald-300">
            Tip sent successfully!
          </p>
          {result.explorerUrl && (
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors"
            >
              View on Explorer ↗
            </a>
          )}
        </div>
        <button
          onClick={handleReset}
          className="w-full py-2.5 rounded-xl text-sm font-medium bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 transition-colors cursor-pointer"
        >
          Send Another Tip
        </button>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────

  const isBusy =
    status === "validating" ||
    status === "sending" ||
    status === "confirming";

  return (
    <div className="space-y-4">
      {/* Recipient input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Recipient
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          disabled={lockRecipient || isBusy}
          placeholder="0x…"
          className="w-full px-3 py-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-sm font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* Token selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Token
        </label>
        <div className="flex gap-1.5">
          {SUPPORTED_TOKENS.map((t) => (
            <button
              key={t.symbol}
              onClick={() => handleTokenChange(t.symbol)}
              disabled={isBusy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedToken === t.symbol
                  ? `${t.bgColor} text-neutral-950 shadow-md`
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Amount ({selectedToken})
        </label>

        <div className="grid grid-cols-5 gap-1.5">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => handlePresetClick(p)}
              disabled={isBusy}
              className={`py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                amount === p && !customAmount
                  ? `${tokenMeta.bgColor} text-neutral-950 shadow-md`
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={handleCustomToggle}
            disabled={isBusy}
            className={`py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              customAmount
                ? `${tokenMeta.bgColor} text-neutral-950 shadow-md`
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Other
          </button>
        </div>

        {customAmount && (
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isBusy}
            placeholder="Enter amount"
            min="0"
            step="any"
            className="w-full mt-1.5 px-3 py-2.5 rounded-lg bg-neutral-800/80 border border-neutral-700 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:opacity-50 transition-colors"
          />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Status indicator */}
      {isBusy && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs text-amber-300">
            {status === "validating"
              ? "Validating…"
              : status === "sending"
              ? "Submitting transaction…"
              : "Confirming on-chain…"}
          </p>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!recipient || !amount || isBusy}
        className={`w-full py-3 rounded-xl font-semibold text-sm ${tokenMeta.bgColor} hover:opacity-90 text-neutral-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        {isBusy ? "Sending…" : `Tip ${amount || "—"} ${selectedToken}`}
      </button>

      <p className="text-center text-[10px] text-neutral-600">
        Gasless via Cartridge session · No gas fees for you
      </p>
    </div>
  );
}
