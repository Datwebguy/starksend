// src/lib/tokens.ts
// ============================================================
// StarkSend – Token Registry
// ============================================================
// Centralised list of supported tipping tokens with display
// metadata.  Uses Starkzap getPresets() at runtime but we keep
// a static list here for UI (icons, display order, labels).
// ============================================================

export interface SupportedToken {
  symbol: string;
  label: string;
  icon: string;       // emoji fallback — swap for real SVGs
  color: string;      // tailwind text colour class
  bgColor: string;    // tailwind bg colour class for selected state
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "STRK",
    label: "STRK",
    icon: "⚡",
    color: "text-amber-400",
    bgColor: "bg-amber-500",
  },
  {
    symbol: "ETH",
    label: "ETH",
    icon: "◆",
    color: "text-blue-400",
    bgColor: "bg-blue-500",
  },
  {
    symbol: "USDC",
    label: "USDC",
    icon: "$",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500",
  },
];

export function getTokenMeta(symbol: string): SupportedToken {
  return (
    SUPPORTED_TOKENS.find((t) => t.symbol === symbol) ?? {
      symbol,
      label: symbol,
      icon: "●",
      color: "text-neutral-400",
      bgColor: "bg-neutral-600",
    }
  );
}
