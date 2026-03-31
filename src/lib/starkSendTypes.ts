// src/lib/starkSendTypes.ts
// ============================================================
// Shared types for the StarkSend session layer.
// ============================================================

/** The subset of wallet data we surface to the UI. */
export interface StarkSendSession {
  /** Hex-encoded Starknet address */
  address: string;
  /** Human-readable, truncated address: 0x0123…abcd */
  shortAddress: string;
  /** The Starkzap WalletInterface (opaque to consumers). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wallet: any;
}

export type SessionStatus =
  | "idle"        // nothing has happened yet
  | "connecting"  // Cartridge popup / auth in progress
  | "deploying"   // on-chain account deploy if needed
  | "active"      // fully ready to transact
  | "error";      // something broke

export interface SessionState {
  status: SessionStatus;
  session: StarkSendSession | null;
  error: string | null;
}
