// src/hooks/__tests__/useTip.test.ts
// ============================================================
// TDD – Tests for the useTip hook.
// Covers: validation, balance check, transfer, and error flows.
// ============================================================

import { renderHook, act } from "@testing-library/react";
import React from "react";

// ── Mocks ────────────────────────────────────────────────────

const mockBalanceOf = jest.fn();
const mockTransfer = jest.fn();
const mockWait = jest.fn();

const MOCK_TOKEN = {
  name: "Starknet Token",
  address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
  decimals: 18,
  symbol: "STRK",
};

// Mock starkzap
jest.mock("starkzap", () => ({
  Amount: {
    parse: jest.fn((val: string, token: any) => ({
      toFormatted: (compressed?: boolean) => `${val} ${token.symbol}`,
      toBase: () => BigInt(parseFloat(val) * 1e18),
    })),
  },
  fromAddress: jest.fn((addr: string) => addr),
  getPresets: jest.fn(() => ({
    STRK: MOCK_TOKEN,
  })),
}));

// Mock the session context
const mockSession = {
  address: "0xABC123",
  shortAddress: "0xABC…123",
  wallet: {
    getChainId: jest.fn(() => "SN_SEPOLIA"),
    balanceOf: mockBalanceOf,
    transfer: mockTransfer,
  },
};

jest.mock("@/components/StarkSendSessionProvider", () => ({
  useStarkSendSession: jest.fn(() => ({
    session: mockSession,
    status: "active",
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

import { useTip } from "../useTip";

// ── Tests ────────────────────────────────────────────────────

describe("useTip", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: balance is sufficient
    mockBalanceOf.mockResolvedValue({
      lt: jest.fn(() => false),
      toFormatted: (c?: boolean) => "100 STRK",
    });

    // Default: transfer succeeds
    mockTransfer.mockResolvedValue({
      explorerUrl: "https://sepolia.voyager.online/tx/0xDEAD",
      wait: mockWait.mockResolvedValue(undefined),
    });
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useTip());
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it("rejects invalid Starknet addresses", async () => {
    const { result } = renderHook(() => useTip());

    await act(async () => {
      await result.current.sendTip("not-an-address", "5");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("Invalid Starknet address");
  });

  it("rejects non-positive amounts", async () => {
    const { result } = renderHook(() => useTip());

    await act(async () => {
      await result.current.sendTip("0xABCDEF1234567890", "0");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("positive number");
  });

  it("rejects when balance is insufficient", async () => {
    mockBalanceOf.mockResolvedValue({
      lt: jest.fn(() => true),
      toFormatted: (c?: boolean) => "2 STRK",
    });

    const { result } = renderHook(() => useTip());

    await act(async () => {
      await result.current.sendTip("0xABCDEF1234567890", "5");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("Insufficient balance");
  });

  it("completes a successful tip", async () => {
    const { result } = renderHook(() => useTip());

    await act(async () => {
      await result.current.sendTip("0xABCDEF1234567890", "5");
    });

    expect(result.current.status).toBe("success");
    expect(result.current.result).toEqual({
      txHash: "0xDEAD",
      explorerUrl: "https://sepolia.voyager.online/tx/0xDEAD",
    });

    // Verify Starkzap transfer was called
    expect(mockTransfer).toHaveBeenCalledTimes(1);
    expect(mockWait).toHaveBeenCalledTimes(1);
  });

  it("handles transfer errors gracefully", async () => {
    mockTransfer.mockRejectedValue(new Error("RPC_TIMEOUT"));

    const { result } = renderHook(() => useTip());

    await act(async () => {
      await result.current.sendTip("0xABCDEF1234567890", "5");
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("RPC_TIMEOUT");
  });

  it("reset() returns to idle", async () => {
    const { result } = renderHook(() => useTip());

    // Trigger an error first
    await act(async () => {
      await result.current.sendTip("bad", "5");
    });
    expect(result.current.status).toBe("error");

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });
});
