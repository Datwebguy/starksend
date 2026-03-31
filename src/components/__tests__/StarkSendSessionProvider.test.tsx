// src/components/__tests__/StarkSendSessionProvider.test.tsx
// ============================================================
// TDD – Tests written BEFORE the component implementation.
// Covers: success flow, error flow, disconnect, and context shape.
// ============================================================

import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ────────────────────────────────────────────────────

// Mock the Starkzap SDK
const mockWallet = {
  address: { toString: () => "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" },
};
const mockOnboard = jest.fn();

jest.mock("starkzap", () => ({
  StarkZap: jest.fn().mockImplementation(() => ({
    onboard: mockOnboard,
  })),
  OnboardStrategy: { Cartridge: "Cartridge" },
}));

// Mock @cartridge/controller (it's a peer dep; just needs to exist)
jest.mock("@cartridge/controller", () => ({}));

// ── Import AFTER mocks are in place ──────────────────────────

import {
  StarkSendSessionProvider,
  useStarkSendSession,
} from "../../components/StarkSendSessionProvider";

// Helper consumer that exposes context values to assertions.
function SessionConsumer() {
  const { status, session, error, connect, disconnect } = useStarkSendSession();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="address">{session?.address ?? "none"}</span>
      <span data-testid="error">{error ?? "none"}</span>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

// ── Tests ────────────────────────────────────────────────────

describe("StarkSendSessionProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children and starts in idle state", () => {
    render(
      <StarkSendSessionProvider>
        <SessionConsumer />
      </StarkSendSessionProvider>
    );

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("address")).toHaveTextContent("none");
    expect(screen.getByTestId("error")).toHaveTextContent("none");
  });

  it("transitions to active state on successful Cartridge onboard", async () => {
    mockOnboard.mockResolvedValueOnce({ wallet: mockWallet });

    render(
      <StarkSendSessionProvider>
        <SessionConsumer />
      </StarkSendSessionProvider>
    );

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("active");
    });

    expect(screen.getByTestId("address")).toHaveTextContent(
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
    );
  });

  it("transitions to error state when onboard rejects", async () => {
    mockOnboard.mockRejectedValueOnce(new Error("popup_blocked"));

    render(
      <StarkSendSessionProvider>
        <SessionConsumer />
      </StarkSendSessionProvider>
    );

    await act(async () => {
      screen.getByText("Connect").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("popup_blocked");
  });

  it("resets to idle state on disconnect", async () => {
    mockOnboard.mockResolvedValueOnce({ wallet: mockWallet });

    render(
      <StarkSendSessionProvider>
        <SessionConsumer />
      </StarkSendSessionProvider>
    );

    // Connect first
    await act(async () => {
      screen.getByText("Connect").click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("active");
    });

    // Now disconnect
    await act(async () => {
      screen.getByText("Disconnect").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("address")).toHaveTextContent("none");
  });
});
