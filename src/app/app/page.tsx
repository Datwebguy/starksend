"use client";
// src/app/page.tsx
// ============================================================
// StarkSend – Dashboard (Phase 4)
// ============================================================
// Tabbed experience: Single Tip | Batch Tip
// Plus live balances, transaction history, and share link.
// ============================================================

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  StarkSendSessionProvider,
  useStarkSendSession,
} from "@/components/StarkSendSessionProvider";
import { TipWidget } from "@/components/TipWidget";
import { BatchTipWidget } from "@/components/BatchTipWidget";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { TransactionHistory } from "@/components/TransactionHistory";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";

type Tab = "single" | "batch";

function SessionDisplay() {
  const { status, session, error, connect, disconnect } = useStarkSendSession();
  const { tips, addTip, clearHistory, totalTipped } = useTransactionHistory();
  const [tab, setTab] = useState<Tab>("single");
  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(() => {
    if (!session) return;
    navigator.clipboard.writeText(session.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [session]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-800/60">
          <div className="flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold tracking-tight">
                Stark<span className="text-amber-400">Send</span>
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                1-Click Crypto Tipping
              </p>
            </Link>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  status === "active"
                    ? "bg-emerald-400 animate-pulse"
                    : status === "error"
                    ? "bg-red-400"
                    : status === "connecting" || status === "deploying"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-neutral-600"
                }`}
              />
              <span className="text-[11px] font-medium text-neutral-500">
                {status === "active"
                  ? session?.shortAddress
                  : status === "error"
                  ? "Error"
                  : status === "connecting" || status === "deploying"
                  ? "Connecting…"
                  : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="p-6 space-y-5">
          {/* ── Connected ─────────────────────────────────── */}
          {status === "active" && session && (
            <>
              {/* Wallet card + balances */}
              <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                      Your wallet
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-xs font-mono text-neutral-300">
                        {session.shortAddress}
                      </p>
                      <button
                        onClick={copyAddress}
                        className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={disconnect}
                    className="text-[10px] text-neutral-500 hover:text-neutral-300 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
                <BalanceDisplay />
              </div>

              {/* Fund Wallet card */}
              <div className="p-3 rounded-lg bg-neutral-800/30 border border-amber-500/20 space-y-1.5">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium">
                  Fund your wallet
                </p>
                <p className="text-xs text-neutral-300">
                  Send STRK, ETH, or USDC to your wallet address above from any exchange or wallet (Binance, Coinbase, Argent, etc.)
                </p>
                <p className="text-[10px] text-neutral-500 flex items-start gap-1">
                  <span className="text-amber-500 shrink-0">⚠</span>
                  Make sure to send tokens on the Starknet network, not Ethereum or other chains.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex rounded-lg bg-neutral-800/40 border border-neutral-700/40 p-0.5">
                <button
                  onClick={() => setTab("single")}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    tab === "single"
                      ? "bg-neutral-700 text-neutral-100 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Single Tip
                </button>
                <button
                  onClick={() => setTab("batch")}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    tab === "batch"
                      ? "bg-neutral-700 text-neutral-100 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  Batch Tip
                </button>
              </div>

              {/* Active tab */}
              {tab === "single" ? (
                <TipWidget
                  onTipSuccess={(data) =>
                    addTip({
                      recipient: data.recipient,
                      amount: data.amount,
                      tokenSymbol: data.tokenSymbol,
                      txHash: data.txHash,
                      explorerUrl: data.explorerUrl,
                    })
                  }
                />
              ) : (
                <BatchTipWidget />
              )}

              {/* Transaction history */}
              <TransactionHistory
                tips={tips}
                totalTipped={totalTipped}
                onClear={clearHistory}
              />

              {/* Share link */}
              <div className="p-3 rounded-lg bg-neutral-800/30 border border-neutral-700/30 space-y-1.5">
                <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-medium">
                  Your tip link
                </p>
                <p className="text-[11px] font-mono text-amber-400/80 break-all select-all">
                  /creator/{session.address}
                </p>
                <p className="text-[10px] text-neutral-600">
                  Share so anyone can tip you · also works as an{" "}
                  <span className="text-neutral-500">
                    {"<iframe>"} embed at /embed/{session.shortAddress}
                  </span>
                </p>
              </div>
            </>
          )}

          {/* ── Disconnected ──────────────────────────────── */}
          {(status === "idle" || status === "error") && (
            <div className="space-y-4">
              <div className="text-center py-8">
                <div className="text-4xl mb-3">⚡</div>
                <p className="text-sm text-neutral-400 max-w-[260px] mx-auto">
                  Sign in with Google, Twitter, or a passkey to start tipping
                  on Starknet — gasless and instant.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/60">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={connect}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer"
              >
                Connect with Google / Social
              </button>

              <p className="text-center text-[10px] text-neutral-600">
                Powered by Cartridge Controller · No seed phrases needed
              </p>
            </div>
          )}

          {/* ── Connecting ────────────────────────────────── */}
          {(status === "connecting" || status === "deploying") && (
            <div className="text-center py-10 space-y-3">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="inline-block h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <p className="text-sm text-neutral-400">
                {status === "deploying"
                  ? "Waiting for Cartridge popup…"
                  : "Opening Cartridge…"}
              </p>
              <p className="text-[11px] text-neutral-600">
                Sign in with Google, Twitter, or a passkey in the popup.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-neutral-800/40">
          <p className="text-center text-[10px] text-neutral-600">
            Powered by get-starknet · Cartridge Controller · Starknet
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <StarkSendSessionProvider>
      <SessionDisplay />
    </StarkSendSessionProvider>
  );
}
