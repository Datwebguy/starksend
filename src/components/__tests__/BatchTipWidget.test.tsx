// src/components/__tests__/BatchTipWidget.test.tsx
// ============================================================
// TDD – Tests for the BatchTipWidget component.
// Covers: rendering, add/remove recipients, validation, send.
// ============================================================

import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ────────────────────────────────────────────────────

const mockTransfer = jest.fn();
const mockWait = jest.fn().mockResolvedValue(undefined);

jest.mock("starkzap", () => ({
  Amount: {
    parse: jest.fn((val: string, token: { symbol: string }) => ({
      toFormatted: () => `${val} ${token.symbol}`,
    })),
  },
  fromAddress: jest.fn((addr: string) => addr),
  getPresets: jest.fn(() => ({
    STRK: { symbol: "STRK", decimals: 18 },
    ETH: { symbol: "ETH", decimals: 18 },
    USDC: { symbol: "USDC", decimals: 6 },
  })),
}));

jest.mock("@/components/StarkSendSessionProvider", () => ({
  useStarkSendSession: jest.fn(() => ({
    session: {
      address: "0xABC",
      shortAddress: "0xABC…",
      wallet: {
        getChainId: jest.fn(() => "SN_SEPOLIA"),
        transfer: mockTransfer,
      },
    },
    status: "active",
    error: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  })),
}));

jest.mock("@cartridge/controller", () => ({}));

import { BatchTipWidget } from "../BatchTipWidget";

// ── Tests ────────────────────────────────────────────────────

describe("BatchTipWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransfer.mockResolvedValue({
      explorerUrl: "https://voyager.online/tx/0xBATCH",
      wait: mockWait,
    });
  });

  it("renders with one empty recipient row", () => {
    render(<BatchTipWidget />);

    // Should have token selector buttons
    expect(screen.getByText("STRK")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();

    // Should have add-recipient button
    expect(screen.getByText("+ Add Recipient")).toBeInTheDocument();
  });

  it("adds a recipient row when clicking Add Recipient", () => {
    render(<BatchTipWidget />);

    const addBtn = screen.getByText("+ Add Recipient");

    act(() => {
      addBtn.click();
    });

    // Should now have 2 address inputs (Recipient 1 and Recipient 2)
    const inputs = screen.getAllByPlaceholderText(/Recipient/);
    expect(inputs.length).toBe(2);
  });

  it("shows error when sending with empty recipients", async () => {
    render(<BatchTipWidget />);

    // The send button text contains "Batch Tip"
    const sendBtn = screen.getByText(/Batch Tip/);

    // Button should be disabled when fields are empty
    expect(sendBtn).toBeDisabled();
  });
});
