"use client";
// src/app/embed/[address]/page.tsx
// ============================================================
// StarkSend – Embeddable Widget (iframe-friendly)
// ============================================================
// URL:  /embed/0x049d3657…
//
// Designed to be loaded inside an <iframe> on 3rd party sites.
// Minimal chrome, no navigation, transparent-friendly.
//
// Usage on external site:
//   <iframe
//     src="https://your-starksend.vercel.app/embed/0xCREATOR"
//     width="380" height="480"
//     style="border:none;border-radius:16px"
//   ></iframe>
// ============================================================

import React from "react";
import { useParams } from "next/navigation";
import {
  StarkSendSessionProvider,
  useStarkSendSession,
} from "@/components/StarkSendSessionProvider";
import { TipWidget } from "@/components/TipWidget";

function truncate(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function EmbedInner({ creatorAddress }: { creatorAddress: string }) {
  const { status, session, error, connect } = useStarkSendSession();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 p-4">
      <div className="flex-1 flex flex-col rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        {/* Compact header */}
        <div className="px-4 py-3 border-b border-neutral-800/60 flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight">
            Stark<span className="text-amber-400">Send</span>
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
            {truncate(creatorAddress)}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {status === "active" && session ? (
            <TipWidget defaultRecipient={creatorAddress} lockRecipient />
          ) : status === "connecting" || status === "deploying" ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <p className="text-xs text-neutral-400">
                Tip this creator with STRK — gasless.
              </p>
              {error && (
                <p className="text-[10px] text-red-400">{error}</p>
              )}
              <button
                onClick={connect}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors cursor-pointer"
              >
                Connect Wallet
              </button>
            </div>
          )}
        </div>

        {/* Tiny footer */}
        <div className="px-4 py-2 border-t border-neutral-800/40 text-center">
          <p className="text-[9px] text-neutral-700">
            Powered by StarkSend · Starknet
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  const params = useParams();
  const creatorAddress = decodeURIComponent(
    (params.address as string) ?? ""
  );

  if (!creatorAddress || !/^0x[0-9a-fA-F]{1,64}$/.test(creatorAddress)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-500 text-xs">
        Invalid address
      </div>
    );
  }

  return (
    <StarkSendSessionProvider>
      <EmbedInner creatorAddress={creatorAddress} />
    </StarkSendSessionProvider>
  );
}
