"use client";
// src/components/StarkSendSessionProvider.tsx
// ============================================================
// StarkSend – Session Provider (Cartridge Controller)
// ============================================================
// Single connection method: Cartridge Controller popup.
// Users sign in with Google, Twitter, Discord, or a passkey.
// Gasless session policies cover STRK, ETH, and USDC transfers.
//
// Security notes:
//   • No private keys exist client-side — Cartridge manages keys.
//   • Server-only secrets are never imported here.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Controller, { toSessionPolicies } from "@cartridge/controller";
import type {
  SessionState,
  SessionStatus,
  StarkSendSession,
} from "@/lib/starkSendTypes";

// ── Module-level Controller instance ─────────────────────────
// Created once at module load — never re-created across renders.
// The controller manages its own iframe lifecycle internally.

const controller = new Controller({
  chains: [{ rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet" }],
  policies: toSessionPolicies([
    {
      target: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
      method: "transfer",
      description: "Tip STRK tokens",
    },
    {
      target: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
      method: "transfer",
      description: "Tip ETH tokens",
    },
    {
      target: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8",
      method: "transfer",
      description: "Tip USDC tokens",
    },
  ]),
});

// ── Logging helper (Beaver Method) ───────────────────────────

const LOG_PREFIX = "[StarkSend]";

function log(stage: string, payload?: unknown) {
  if (payload !== undefined) {
    console.log(`${LOG_PREFIX} ${stage}`, payload);
  } else {
    console.log(`${LOG_PREFIX} ${stage}`);
  }
}

// ── Utility ──────────────────────────────────────────────────

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// ── Context shape ────────────────────────────────────────────

interface StarkSendContextValue extends SessionState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const StarkSendContext = createContext<StarkSendContextValue | null>(null);

// ── Public hook ──────────────────────────────────────────────

export function useStarkSendSession(): StarkSendContextValue {
  const ctx = useContext(StarkSendContext);
  if (!ctx) {
    throw new Error(
      "useStarkSendSession must be used inside <StarkSendSessionProvider>"
    );
  }
  return ctx;
}

// ── Provider component ───────────────────────────────────────

interface ProviderProps {
  children: React.ReactNode;
}

export function StarkSendSessionProvider({ children }: ProviderProps) {
  // ── State ────────────────────────────────────────────────
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [session, setSession] = useState<StarkSendSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Auto-restore existing session on mount ────────────────

  useEffect(() => {
    (async () => {
      try {
        log("🔍 Probing for existing Cartridge session…");
        const account = await controller.probe();
        if (account) {
          const address = account.address;
          log("✅ Existing session found", { address });
          setSession({
            address,
            shortAddress: truncateAddress(address),
            wallet: account,
          });
          setStatus("active");
        } else {
          log("📭 No existing session — user must connect");
        }
      } catch (err) {
        log("📭 No existing session — probe failed, user must connect");
        setStatus("idle");
      }
    })();
  }, []);

  // ── Connect ──────────────────────────────────────────────

  const connect = useCallback(async () => {
    // Guard against double-clicks while already connecting.
    if (status === "connecting" || status === "deploying") {
      log("connect() skipped — already in progress");
      return;
    }

    try {
      // ▸ BEAVER LOG 1: Auth start
      log("🔐 Cartridge auth starting (Google / Twitter / passkey)…");
      setStatus("connecting");
      setError(null);

      // ▸ BEAVER LOG 2: Opening popup
      log("⚡ Opening Cartridge popup — waiting for user to sign in…");
      setStatus("deploying"); // deploying = popup open / account may be deployed

      // controller.connect() opens the Cartridge iframe popup.
      // Returns WalletAccount (starknet.js) or undefined if user cancelled.
      const account = await controller.connect();

      if (!account) {
        log("ℹ️ Cartridge popup closed without connecting");
        setStatus("idle");
        return;
      }

      // ▸ BEAVER LOG 3: Account returned
      const address = account.address;
      const usernameResult = controller.username();
      const username = usernameResult ? await usernameResult : undefined;

      log("✅ Cartridge account connected", { address, username });

      const newSession: StarkSendSession = {
        address,
        shortAddress: truncateAddress(address),
        wallet: account, // WalletAccount — passed to TipWidget for transfers
      };

      setSession(newSession);
      setStatus("active");

      // ▸ BEAVER LOG 4: Final success
      log("🎉 Session active", { address: newSession.shortAddress, username });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown connection error";

      // ▸ BEAVER LOG 4 (error path)
      log("❌ Cartridge connection error", { message });

      setError(message);
      setStatus("error");
      setSession(null);
    }
  }, [status]);

  // ── Disconnect ───────────────────────────────────────────

  const disconnect = useCallback(() => {
    log("🔌 Disconnecting Cartridge session");

    controller.disconnect().catch((err: unknown) => {
      log("⚠️ Disconnect error (ignored)", {
        reason: err instanceof Error ? err.message : String(err),
      });
    });

    setSession(null);
    setStatus("idle");
    setError(null);
  }, []);

  // ── Context value (stable ref) ───────────────────────────

  const value = useMemo<StarkSendContextValue>(
    () => ({ status, session, error, connect, disconnect }),
    [status, session, error, connect, disconnect]
  );

  return (
    <StarkSendContext.Provider value={value}>
      {children}
    </StarkSendContext.Provider>
  );
}
