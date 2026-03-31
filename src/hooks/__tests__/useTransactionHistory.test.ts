// src/hooks/__tests__/useTransactionHistory.test.ts
// ============================================================
// TDD – Tests for the useTransactionHistory hook.
// Covers: adding tips, ordering, total calculation, and clear.
// ============================================================

import { renderHook, act } from "@testing-library/react";
import { useTransactionHistory } from "../useTransactionHistory";

describe("useTransactionHistory", () => {
  it("starts with empty history", () => {
    const { result } = renderHook(() => useTransactionHistory());

    expect(result.current.tips).toEqual([]);
    expect(result.current.totalTipped).toBe("0.00");
  });

  it("adds a tip with auto-generated id and timestamp", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTip({
        recipient: "0xABCDEF1234567890",
        amount: "5",
        tokenSymbol: "STRK",
        txHash: "0xDEAD",
        explorerUrl: "https://voyager.online/tx/0xDEAD",
      });
    });

    expect(result.current.tips).toHaveLength(1);

    const tip = result.current.tips[0];
    expect(tip.id).toMatch(/^tip-/);
    expect(tip.timestamp).toBeGreaterThan(0);
    expect(tip.recipient).toBe("0xABCDEF1234567890");
    expect(tip.recipientShort).toBe("0xABCD…7890");
    expect(tip.amount).toBe("5");
  });

  it("orders tips newest-first", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTip({
        recipient: "0xAAAA",
        amount: "1",
        tokenSymbol: "STRK",
        txHash: "0x1",
        explorerUrl: "",
      });
    });

    act(() => {
      result.current.addTip({
        recipient: "0xBBBB",
        amount: "2",
        tokenSymbol: "STRK",
        txHash: "0x2",
        explorerUrl: "",
      });
    });

    expect(result.current.tips[0].recipient).toBe("0xBBBB"); // newest
    expect(result.current.tips[1].recipient).toBe("0xAAAA");
  });

  it("calculates totalTipped correctly for STRK", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTip({
        recipient: "0x1",
        amount: "10.5",
        tokenSymbol: "STRK",
        txHash: "0x1",
        explorerUrl: "",
      });
    });

    act(() => {
      result.current.addTip({
        recipient: "0x2",
        amount: "4.5",
        tokenSymbol: "STRK",
        txHash: "0x2",
        explorerUrl: "",
      });
    });

    // Should not count non-STRK tips
    act(() => {
      result.current.addTip({
        recipient: "0x3",
        amount: "100",
        tokenSymbol: "USDC",
        txHash: "0x3",
        explorerUrl: "",
      });
    });

    expect(result.current.totalTipped).toBe("15.00");
  });

  it("clears all history", () => {
    const { result } = renderHook(() => useTransactionHistory());

    act(() => {
      result.current.addTip({
        recipient: "0x1",
        amount: "5",
        tokenSymbol: "STRK",
        txHash: "0x1",
        explorerUrl: "",
      });
    });

    expect(result.current.tips).toHaveLength(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.tips).toEqual([]);
    expect(result.current.totalTipped).toBe("0.00");
  });
});
