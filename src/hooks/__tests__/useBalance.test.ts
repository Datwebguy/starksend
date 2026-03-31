// src/hooks/__tests__/useBalance.test.ts
// ============================================================
// TDD – Tests for the useBalance hook.
// Covers: initial fetch, polling lifecycle, error handling,
//         manual refresh, and empty state when disconnected.
// ============================================================

import { renderHook, act, waitFor } from "@testing-library/react";

// ── Mocks ────────────────────────────────────────────────────

const mockBalanceOf = jest.fn();

const MOCK_STRK = { symbol: "STRK", decimals: 18, name: "Starknet Token" };
const MOCK_ETH = { symbol: "ETH", decimals: 18, name: "Ether" };
const MOCK_USDC = { symbol: "USDC", decimals: 6, name: "USD Coin" };

jest.mock("starkzap", () => ({
  getPresets: jest.fn(() => ({
    STRK: MOCK_STRK,
    ETH: MOCK_ETH,
    USDC: MOCK_USDC,
  })),
}));

// Track whether session is active so we can toggle it mid-test
let mockSessionActive = true;

const mockWallet = {
  getChainId: jest.fn(() => "SN_SEPOLIA"),
  balanceOf: mockBalanceOf,
};

jest.mock("@/components/StarkSendSessionProvider", () => ({
  useStarkSendSession: jest.fn(() => ({
    session: mockSessionActive
      ? { address: "0xABC", shortAddress: "0xABC…", wallet: mockWallet }
      : null,
    status: mockSessionActive ? "active" : "idle",
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

import { useBalance } from "../useBalance";

// ── Helpers ──────────────────────────────────────────────────

function makeAmount(unit: string, symbol: string, zero = false) {
  return {
    toUnit: () => unit,
    toFormatted: (compressed?: boolean) => `${symbol} ${unit}`,
    isZero: () => zero,
    toBase: () => BigInt(Math.floor(parseFloat(unit) * 1e18)),
  };
}

// ── Tests ────────────────────────────────────────────────────

describe("useBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSessionActive = true;

    // Default: return plausible balances
    mockBalanceOf.mockImplementation((token: { symbol: string }) => {
      switch (token.symbol) {
        case "STRK":
          return Promise.resolve(makeAmount("100.5", "STRK"));
        case "ETH":
          return Promise.resolve(makeAmount("0.25", "ETH"));
        case "USDC":
          return Promise.resolve(makeAmount("0", "USDC", true));
        default:
          return Promise.resolve(makeAmount("0", "?", true));
      }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("fetches balances on mount when session is active", async () => {
    const { result } = renderHook(() => useBalance(0)); // polling off

    await waitFor(() => {
      expect(result.current.balances.length).toBe(3);
    });

    expect(result.current.balances[0].symbol).toBe("STRK");
    expect(result.current.balances[0].formatted).toBe("100.5");
    expect(result.current.balances[0].isZero).toBe(false);

    expect(result.current.balances[2].symbol).toBe("USDC");
    expect(result.current.balances[2].isZero).toBe(true);
  });

  it("returns empty balances when no session", async () => {
    mockSessionActive = false;

    const { result } = renderHook(() => useBalance(0));

    // Should stay empty — no fetch attempted
    expect(result.current.balances).toEqual([]);
    expect(mockBalanceOf).not.toHaveBeenCalled();
  });

  it("sets error state when balanceOf throws", async () => {
    mockBalanceOf.mockRejectedValue(new Error("RPC_DOWN"));

    const { result } = renderHook(() => useBalance(0));

    await waitFor(() => {
      expect(result.current.error).toBe("RPC_DOWN");
    });
  });

  it("manual refresh() re-fetches balances", async () => {
    const { result } = renderHook(() => useBalance(0));

    await waitFor(() => {
      expect(result.current.balances.length).toBe(3);
    });

    expect(mockBalanceOf).toHaveBeenCalledTimes(3); // STRK, ETH, USDC

    // Trigger manual refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(mockBalanceOf).toHaveBeenCalledTimes(6); // 3 more
  });

  it("polls on the given interval", async () => {
    const { result } = renderHook(() => useBalance(5000));

    // Initial fetch
    await waitFor(() => {
      expect(result.current.balances.length).toBe(3);
    });

    const initialCalls = mockBalanceOf.mock.calls.length;

    // Advance timer by one interval
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(mockBalanceOf.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
