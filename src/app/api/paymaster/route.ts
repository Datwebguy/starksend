// src/app/api/paymaster/route.ts
// ============================================================
// StarkSend – Server-side Paymaster Proxy
// ============================================================
// Proxies paymaster requests to AVNU so the API key never
// touches the client bundle.  This is only needed if you
// enable AVNU paymaster alongside Cartridge (e.g. for
// non-Cartridge users in a future multi-auth setup).
//
// Follows the pattern from the Starkzap paymaster docs:
//   https://docs.starknet.io/build/starkzap/paymasters
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const AVNU_PAYMASTER_URL = "https://starknet.paymaster.avnu.fi";
const AVNU_API_KEY = process.env.AVNU_PAYMASTER_API_KEY ?? "";

export async function POST(request: NextRequest) {
  console.log("[StarkSend:Paymaster] Proxying request to AVNU");

  try {
    const body = await request.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (AVNU_API_KEY) {
      headers["x-paymaster-api-key"] = AVNU_API_KEY;
    } else {
      console.warn(
        "[StarkSend:Paymaster] AVNU_PAYMASTER_API_KEY not set — " +
          "gasless mode only (user pays in tokens)."
      );
    }

    const upstream = await fetch(AVNU_PAYMASTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await upstream.json();

    console.log("[StarkSend:Paymaster] AVNU responded", {
      status: upstream.status,
    });

    return NextResponse.json(data, { status: upstream.status });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown paymaster proxy error";

    console.error("[StarkSend:Paymaster] ❌ Proxy error:", message);

    return NextResponse.json(
      { error: "Paymaster proxy error", detail: message },
      { status: 502 }
    );
  }
}
