"use client";
// src/app/creator/[address]/page.tsx
// ============================================================
// StarkSend – Creator Profile / Embeddable Tip Page
// ============================================================
// URL:  /creator/0x049d3657…
//
// Anyone can share this link.  Visitors connect via Cartridge
// and tip the creator in one click.  The recipient address is
// locked to the URL param so it can't be changed.
//
// This page also works inside an <iframe> for 3rd-party embeds.
// ============================================================

import React from "react";
import { useParams } from "next/navigation";
import {
  StarkSendSessionProvider,
  useStarkSendSession,
} from "@/components/StarkSendSessionProvider";
import { TipWidget } from "@/components/TipWidget";

// ── Utility ──────────────────────────────────────────────────

function truncate(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function isPlausibleAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{1,64}$/.test(addr);
}

// ── Inner component (needs session context) ──────────────────

function CreatorInner({ creatorAddress }: { creatorAddress: string }) {
  const { status, session, error, connect, disconnect } = useStarkSendSession();

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-4">
      <div className="w-full max-w-sm mx-auto rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
        {/* ── Creator header ──────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-800/60 text-center space-y-2">
          {/* Avatar placeholder */}
          <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>

          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Tip this creator
            </p>
            <p className="text-xs font-mono text-neutral-400 mt-0.5">
              {truncate(creatorAddress)}
            </p>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="p-6">
          {/* Connected → show tipping widget */}
          {status === "active" && session && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] text-neutral-500">
                <span>Connected as {session.shortAddress}</span>
                <button
                  onClick={disconnect}
                  className="underline underline-offset-2 hover:text-neutral-300 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>

              <TipWidget
                defaultRecipient={creatorAddress}
                lockRecipient
              />
            </div>
          )}

          {/* Disconnected → connect button */}
          {(status === "idle" || status === "error") && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral-400">
                Connect your wallet to send a gasless tip.
              </p>

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
            </div>
          )}

          {/* Connecting */}
          {(status === "connecting" || status === "deploying") && (
            <div className="text-center py-8 space-y-3">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm text-neutral-400">
                {status === "connecting"
                  ? "Authenticating…"
                  : "Setting up account…"}
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-neutral-800/40">
          <p className="text-center text-[10px] text-neutral-600">
            Powered by Stark<span className="text-amber-400/60">Send</span> ·
            Starknet
          </p>
        </div>
      </div>
    </main>
  );
}

// ── Page component (reads URL param) ─────────────────────────

export default function CreatorPage() {
  const params = useParams();
  const rawAddress = params.address as string;

  // Decode in case the address was URL-encoded.
  const creatorAddress = decodeURIComponent(rawAddress ?? "");

  if (!creatorAddress || !isPlausibleAddress(creatorAddress)) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">Invalid Creator Address</p>
          <p className="text-sm text-neutral-500">
            The URL should be{" "}
            <code className="text-xs bg-neutral-800 px-1.5 py-0.5 rounded">
              /creator/0x…
            </code>
          </p>
        </div>
      </main>
    );
  }

  return (
    <StarkSendSessionProvider>
      <CreatorInner creatorAddress={creatorAddress} />
    </StarkSendSessionProvider>
  );
}
