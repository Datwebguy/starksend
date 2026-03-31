"use client";
// src/components/BatchTipWidget.tsx
// ============================================================
// StarkSend – Batch Tipping (Multi-Recipient, Single TX)
// ============================================================
// Uses Starkzap's batch transfer API:
//   wallet.transfer(token, [ {to, amount}, {to, amount}, ... ])
// All recipients are paid in a single on-chain transaction.
//
// Beaver logging: [StarkSend:Batch]
// ============================================================

import React, { useState } from "react";
import { Amount, fromAddress, getPresets } from "starkzap";
import { useStarkSendSession } from "@/components/StarkSendSessionProvider";
import { getTokenMeta, SUPPORTED_TOKENS } from "@/lib/tokens";

// ── Types ────────────────────────────────────────────────────

interface Recipient {
  id: string;
  address: string;
  amount: string;
}

type BatchStatus = "idle" | "sending" | "confirming" | "success" | "error";

// ── Logging ──────────────────────────────────────────────────

const LOG = "[StarkSend:Batch]";
function log(stage: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`${LOG} ${stage}`, payload);
  } else {
    console.log(`${LOG} ${stage}`);
  }
}

// ── Address validation ───────────────────────────────────────

const ADDR_RE = /^0x[0-9a-fA-F]{1,64}$/;

// ── Component ────────────────────────────────────────────────

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `r-${idCounter}`;
}

export function BatchTipWidget() {
  const { session } = useStarkSendSession();

  const [selectedToken, setSelectedToken] = useState("STRK");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: nextId(), address: "", amount: "" },
  ]);
  const [status, setStatus] = useState<BatchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const tokenMeta = getTokenMeta(selectedToken);

  // ── Recipient list management ─────────────────────────────

  function addRecipient() {
    setRecipients((prev) => [...prev, { id: nextId(), address: "", amount: "" }]);
  }

  function removeRecipient(id: string) {
    setRecipients((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }

  function updateRecipient(id: string, field: "address" | "amount", value: string) {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  // ── Send batch ────────────────────────────────────────────

  async function handleSend() {
    if (!session) return;

    try {
      setStatus("sending");
      setError(null);
      setExplorerUrl(null);

      // Validate all rows
      const valid = recipients.filter((r) => r.address && r.amount);
      if (valid.length === 0) {
        throw new Error("Add at least one recipient with an address and amount.");
      }

      for (const r of valid) {
        if (!ADDR_RE.test(r.address)) {
          throw new Error(`Invalid address: ${r.address}`);
        }
        if (isNaN(parseFloat(r.amount)) || parseFloat(r.amount) <= 0) {
          throw new Error(`Invalid amount for ${r.address}`);
        }
      }

      const wallet = session.wallet;
      const presets = getPresets(wallet.getChainId());
      const token = presets[selectedToken];
      if (!token) throw new Error(`Token ${selectedToken} not found.`);

      const transfers = valid.map((r) => ({
        to: fromAddress(r.address),
        amount: Amount.parse(r.amount, token),
      }));

      log("🚀 Batch send", { recipients: valid.length, token: selectedToken });

      const tx = await wallet.transfer(token, transfers);

      log("⏳ Batch submitted", { explorerUrl: tx.explorerUrl });
      setStatus("confirming");

      await tx.wait();

      log("🎉 Batch confirmed!", { explorerUrl: tx.explorerUrl });
      setExplorerUrl(tx.explorerUrl ?? null);
      setStatus("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Batch send failed";
      log("❌ Batch error", { message });
      setError(message);
      setStatus("error");
    }
  }

  function handleReset() {
    setStatus("idle");
    setError(null);
    setExplorerUrl(null);
    setRecipients([{ id: nextId(), address: "", amount: "" }]);
  }

  // ── Success screen ────────────────────────────────────────

  if (status === "success") {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-center space-y-3">
          <div className="text-3xl">🎉</div>
          <p className="text-sm font-semibold text-emerald-300">
            Batch tip sent!
          </p>
          {explorerUrl && (
            <a
              href={explorerUrl}
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
          Send Another Batch
        </button>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────

  const isBusy = status === "sending" || status === "confirming";
  const totalAmount = recipients
    .reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
    .toFixed(selectedToken === "ETH" ? 4 : 2);

  return (
    <div className="space-y-4">
      {/* Token selector */}
      <div className="flex gap-1.5">
        {SUPPORTED_TOKENS.map((t) => (
          <button
            key={t.symbol}
            onClick={() => setSelectedToken(t.symbol)}
            disabled={isBusy}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              selectedToken === t.symbol
                ? `${t.bgColor} text-neutral-950`
                : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700"
            } disabled:opacity-50`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Recipient rows */}
      <div className="space-y-2">
        {recipients.map((r, i) => (
          <div key={r.id} className="flex gap-1.5 items-center">
            <input
              type="text"
              value={r.address}
              onChange={(e) => updateRecipient(r.id, "address", e.target.value)}
              disabled={isBusy}
              placeholder={`Recipient ${i + 1} (0x…)`}
              className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-neutral-800/80 border border-neutral-700 text-xs font-mono text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50 transition-colors"
            />
            <input
              type="number"
              value={r.amount}
              onChange={(e) => updateRecipient(r.id, "amount", e.target.value)}
              disabled={isBusy}
              placeholder="Amt"
              min="0"
              step="any"
              className="w-20 px-2.5 py-2 rounded-lg bg-neutral-800/80 border border-neutral-700 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50 disabled:opacity-50 transition-colors"
            />
            <button
              onClick={() => removeRecipient(r.id)}
              disabled={isBusy || recipients.length <= 1}
              className="text-neutral-600 hover:text-red-400 text-sm px-1 transition-colors cursor-pointer disabled:opacity-30"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add recipient button */}
      <button
        onClick={addRecipient}
        disabled={isBusy}
        className="w-full py-2 rounded-lg text-xs font-medium text-neutral-400 bg-neutral-800/40 border border-dashed border-neutral-700 hover:border-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer disabled:opacity-40"
      >
        + Add Recipient
      </button>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Status */}
      {isBusy && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <p className="text-xs text-amber-300">
            {status === "sending" ? "Submitting batch…" : "Confirming on-chain…"}
          </p>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={isBusy || recipients.every((r) => !r.address || !r.amount)}
        className={`w-full py-3 rounded-xl font-semibold text-sm ${tokenMeta.bgColor} hover:opacity-90 text-neutral-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        {isBusy
          ? "Sending…"
          : `Batch Tip ${totalAmount} ${selectedToken} → ${recipients.filter((r) => r.address).length} recipients`}
      </button>

      <p className="text-center text-[10px] text-neutral-600">
        All recipients paid in a single transaction · Gasless
      </p>
    </div>
  );
}
