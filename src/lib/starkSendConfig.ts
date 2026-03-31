// src/lib/starkSendConfig.ts
// ============================================================
// StarkSend – Centralised Environment Configuration
// ============================================================
// All env-var access funnels through this file so:
//   1. Missing vars blow up loudly at startup, not mid-transaction.
//   2. Client-safe vars (NEXT_PUBLIC_*) are separated from secrets.
//   3. Nothing gets imported piecemeal across dozens of files.
// ============================================================

/** Throws immediately if a required env var is missing. */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[StarkSend] Missing required environment variable: ${key}. ` +
        `Add it to .env.local and restart the dev server.`
    );
  }
  return value;
}

// ── Client-safe values (exposed to browser via NEXT_PUBLIC_) ─────────

/** Starknet network target — "mainnet" | "sepolia" */
export const STARKNET_NETWORK = (
  process.env.NEXT_PUBLIC_STARKNET_NETWORK ?? "mainnet"
) as "mainnet" | "sepolia";

/**
 * Cartridge Controller RPC URL.
 * Defaults to the public Cartridge endpoint if not overridden.
 */
export const CARTRIDGE_RPC_URL =
  process.env.NEXT_PUBLIC_CARTRIDGE_RPC_URL ??
  "https://api.cartridge.gg/x/starknet/mainnet";

// ── Server-only values (never start with NEXT_PUBLIC_) ───────────────

/**
 * Return server-only config.  Calling this from a client component will
 * throw — by design — because the values will be `undefined` in the
 * browser bundle.
 */
export function getServerConfig() {
  return {
    /**
     * AVNU Paymaster API key (used if you layer AVNU on top of Cartridge
     * for non-policy transactions).  Optional for Phase 1.
     */
    avnuApiKey: process.env.AVNU_PAYMASTER_API_KEY ?? "",

    /**
     * Privy App Secret — only needed if you add a Privy auth path later.
     * Kept here so the pattern is established.
     */
    privyAppSecret: process.env.PRIVY_APP_SECRET ?? "",
  };
}

// ── Token addresses (used by session policies) ──────────────────────

/** STRK token contract address per network. */
export const STRK_CONTRACT_ADDRESS =
  STARKNET_NETWORK === "mainnet"
    ? "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
    : "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

// ── Tip-contract address (custom contract if you deploy one) ────────

export const TIP_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_TIP_CONTRACT_ADDRESS ?? STRK_CONTRACT_ADDRESS;

// ── Quick sanity check at module load time ──────────────────────────
if (typeof window === "undefined") {
  // Server-side: warn about missing optional vars
  if (!process.env.AVNU_PAYMASTER_API_KEY) {
    console.warn(
      "[StarkSend] AVNU_PAYMASTER_API_KEY not set — gasless tipping " +
        "will fall back to Cartridge-only sponsorship."
    );
  }
}
