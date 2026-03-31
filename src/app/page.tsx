"use client";
// src/app/page.tsx
// ============================================================
// StarkSend – Marketing Landing Page
// ============================================================
// The homepage. "Launch App" links to /app (dashboard).
// "Create Your Tip Link" links to /app (auto-connects).
// ============================================================

import React, { useEffect, useState } from "react";
import Link from "next/link";

// ── Token data for carousel ──────────────────────────────────

const TOKENS = [
  { name: "STRK", color: "#f59e0b", symbol: "⚡" },
  { name: "ETH", color: "#60a5fa", symbol: "◆" },
  { name: "USDC", color: "#34d399", symbol: "$" },
  { name: "wBTC", color: "#f97316", symbol: "₿" },
  { name: "DAI", color: "#fbbf24", symbol: "D" },
  { name: "USDT", color: "#34d399", symbol: "₮" },
  { name: "lBTC", color: "#f97316", symbol: "₿" },
  { name: "tBTC", color: "#f97316", symbol: "₿" },
  { name: "LORDS", color: "#a78bfa", symbol: "L" },
  { name: "NSTR", color: "#60a5fa", symbol: "N" },
];

// ── FAQ data ─────────────────────────────────────────────────

const FAQS = [
  {
    q: "What tokens can I receive as tips?",
    a: "StarkSend currently supports STRK, ETH, and USDC on Starknet. More tokens will be added as the ecosystem grows. All tokens use Starkzap SDK presets for reliable, type-safe operations.",
  },
  {
    q: "Do I need a crypto wallet to get started?",
    a: "No! StarkSend creates a Starknet wallet for you automatically when you sign in with Google, Twitter, or a passkey through Cartridge Controller. No browser extensions or seed phrases needed.",
  },
  {
    q: "How are transactions gasless?",
    a: "StarkSend uses Cartridge Controller's built-in paymaster. When you connect, session policies are registered for token transfers. All matching transactions are automatically sponsored — neither you nor your supporters pay gas fees.",
  },
  {
    q: "Is StarkSend free to use?",
    a: "Yes, completely free. No platform fees, no commissions, no hidden charges. You receive 100% of every tip directly to your Starknet wallet.",
  },
  {
    q: "Can I embed a tip widget on my website?",
    a: 'Absolutely. StarkSend provides an embeddable iframe widget at /embed/YOUR_ADDRESS. Just paste one line of HTML on your site and supporters can tip you without leaving your page.',
  },
  {
    q: "What is batch tipping?",
    a: "Batch tipping lets you send tips to multiple creators in a single on-chain transaction. Add up to 10 recipients, pick amounts, and it all executes in one gasless call using Starkzap's batch transfer API.",
  },
];

// ── FAQ Item component ───────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="bg-[var(--bg3)] first:rounded-t-xl last:rounded-b-xl">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-[18px] text-left text-[15px] font-medium text-[var(--text)] hover:text-[var(--amber)] transition-colors cursor-pointer"
      >
        {q}
        <span
          className={`text-lg text-[var(--text3)] transition-transform duration-300 ${
            open ? "rotate-45 !text-[var(--amber)]" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-350 ease-in-out px-6 text-sm text-[var(--text2)] leading-relaxed ${
          open ? "max-h-[200px] pb-[18px]" : "max-h-0"
        }`}
      >
        {a}
      </div>
    </div>
  );
}

// ── Scroll animation hook ────────────────────────────────────

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".fade-up").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Nav scroll effect ────────────────────────────────────────

function useNavScroll() {
  useEffect(() => {
    const nav = document.getElementById("main-nav");
    const handler = () => {
      nav?.classList.toggle("scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
}

// ── Page component ───────────────────────────────────────────

export default function LandingPage() {
  useScrollReveal();
  useNavScroll();

  const [selectedAmount, setSelectedAmount] = useState(5);
  const [strkPrice, setStrkPrice] = useState<number | null>(null);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=starknet&vs_currencies=usd")
      .then((r) => r.json())
      .then((data) => setStrkPrice(data?.starknet?.usd ?? null))
      .catch(() => setStrkPrice(null));
  }, []);

  return (
    <>
      {/* ═══════ NAV ═══════ */}
      <nav
        id="main-nav"
        className="fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300"
      >
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between">
          <div className="text-[22px] font-bold tracking-tight">
            Stark<span className="text-[var(--amber)]">Send</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-[var(--text2)] hover:text-white transition-colors">Features</a>
            <a href="#how" className="text-sm font-medium text-[var(--text2)] hover:text-white transition-colors">How It Works</a>
            <a href="#why" className="text-sm font-medium text-[var(--text2)] hover:text-white transition-colors">Why StarkSend</a>
            <a href="#faq" className="text-sm font-medium text-[var(--text2)] hover:text-white transition-colors">FAQ</a>
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-semibold bg-[var(--amber)] text-black hover:bg-[#fbbf24] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(245,158,11,0.3)]"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="pt-[160px] pb-[120px] relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-15 pointer-events-none bg-[var(--amber)] -top-[100px] -right-[100px]" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-15 pointer-events-none bg-[var(--blue)] -bottom-[200px] -left-[100px]" />

        <div className="max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-[60px] items-center">
          {/* Left: copy */}
          <div className="relative z-10">
            <div className="fade-up inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-[var(--amber-glow)] text-[var(--amber)] border border-[rgba(245,158,11,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
              Built on Starknet
            </div>
            <h1 className="fade-up stagger-1 mt-5 mb-6 text-[clamp(40px,6vw,72px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Accept Crypto Tips
              <br />
              <span className="text-[var(--amber)]">Anywhere.</span> Gasless.
            </h1>
            <p className="fade-up stagger-2 text-[clamp(16px,1.8vw,20px)] text-[var(--text2)] leading-relaxed max-w-[600px] mb-9">
              Create your tipping link in seconds. Let supporters send STRK,
              ETH, or USDC — with zero gas fees, powered by Starknet&apos;s account
              abstraction.
            </p>
            <div className="fade-up stagger-3 flex flex-wrap gap-3.5">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-[var(--amber)] text-black hover:bg-[#fbbf24] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(245,158,11,0.3)]"
              >
                Create Your Tip Link →
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-transparent text-white border border-[rgba(255,255,255,0.15)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right: card mockup */}
          <div className="fade-up stagger-2 relative z-10 lg:order-last order-first">
            <div className="hero-card-3d bg-[var(--bg3)] border border-[rgba(255,255,255,0.08)] rounded-[var(--radius-xl)] p-7 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_40px_rgba(245,158,11,0.18)]">
              <div className="flex items-center justify-between mb-5">
                <div className="text-base font-bold">
                  Stark<span className="text-[var(--amber)]">Send</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-[7px] h-[7px] rounded-full bg-[var(--emerald)]" />
                  <span className="text-[11px] text-[var(--text2)] font-mono">
                    0x049d…dc7
                  </span>
                </div>
              </div>
              <div className="text-center py-6 border-t border-b border-[rgba(255,255,255,0.06)] mb-5">
                <div className="text-5xl font-bold tracking-tight">
                  {selectedAmount}{" "}
                  <span className="text-[28px] text-[var(--text2)]">STRK</span>
                </div>
                <div className="text-sm text-[var(--text2)] mt-1">
                  {strkPrice !== null
                    ? `≈ $${(selectedAmount * strkPrice).toFixed(2)}`
                    : "≈ $--"}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[1, 5, 10, 25].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedAmount(n)}
                    className={`py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer ${
                      n === selectedAmount
                        ? "bg-[var(--amber)] text-black border border-[var(--amber)]"
                        : "bg-[var(--bg4)] text-[var(--text2)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button className="w-full py-3.5 rounded-xl text-base font-semibold bg-[var(--amber)] text-black hover:bg-[#fbbf24] transition-all cursor-pointer">
                Tip {selectedAmount} STRK ⚡
              </button>
              <p className="text-center text-[11px] text-[var(--text3)] mt-3">
                Gasless · No wallet popups · Instant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="py-[100px] bg-[var(--bg2)]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center fade-up">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-[var(--amber-glow)] text-[var(--amber)] border border-[rgba(245,158,11,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
              Core Features
            </div>
            <h2 className="mt-5 text-[clamp(28px,4vw,44px)] font-bold tracking-tight">
              Everything You Need to Get Tipped
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(255,255,255,0.04)] rounded-[var(--radius-lg)] overflow-hidden border border-[rgba(255,255,255,0.06)] fade-up stagger-2">
            {[
              { icon: "⚡", title: "Zero Gas Fees", desc: "Cartridge session keys + paymaster sponsor every transaction automatically.", bg: "bg-[var(--amber-glow)]", color: "text-[var(--amber)]" },
              { icon: "🔐", title: "Google Login", desc: "No seed phrases. Sign in with Google, Twitter, or biometrics via Cartridge.", bg: "bg-[rgba(52,211,153,0.12)]", color: "text-[var(--emerald)]" },
              { icon: "🪙", title: "Multi-Token", desc: "Accept tips in STRK, ETH, or USDC. Your supporters choose.", bg: "bg-[rgba(96,165,250,0.12)]", color: "text-[var(--blue)]" },
              { icon: "📦", title: "Batch Tipping", desc: "Tip multiple creators in a single on-chain transaction.", bg: "bg-[rgba(249,115,22,0.12)]", color: "text-[var(--coral)]" },
            ].map((f) => (
              <div key={f.title} className="bg-[var(--bg)] p-8 text-center hover:bg-[var(--bg2)] transition-colors">
                <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-[22px] mx-auto mb-4 ${f.bg} ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-[var(--text2)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ TOKEN CAROUSEL ═══════ */}
      <section className="py-12">
        <p className="text-center text-sm text-[var(--text2)] font-medium mb-4 fade-up">
          Powered by Starkzap SDK · Supporting tokens across Starknet
        </p>
        <div className="flex gap-4 overflow-hidden" style={{ maskImage: "linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)" }}>
          <div className="flex gap-4 token-scroll-anim">
            {[...TOKENS, ...TOKENS].map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] text-sm font-medium whitespace-nowrap"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `${t.color}22`, color: t.color }}
                >
                  {t.symbol}
                </span>
                {t.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how" className="py-[100px] bg-[var(--bg2)]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center fade-up">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-[var(--amber-glow)] text-[var(--amber)] border border-[rgba(245,158,11,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
              3 Simple Steps
            </div>
            <h2 className="mt-5 text-[clamp(28px,4vw,44px)] font-bold tracking-tight">
              How To Create And Use Your Tip Link
            </h2>
          </div>

          <div className="flex flex-col gap-20 mt-16">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center fade-up">
              <div>
                <div className="text-[80px] font-extrabold text-[rgba(245,158,11,0.08)] leading-none mb-2">01</div>
                <h3 className="text-[clamp(18px,2.5vw,24px)] font-semibold mb-3">Connect with Google or Social</h3>
                <p className="text-[var(--text2)] leading-relaxed text-[15px]">
                  Click &quot;Connect&quot; and sign in with your Google account, Twitter, or passkey. No extensions, no seed phrases. Your Starknet wallet is created automatically with a gasless session.
                </p>
              </div>
              <div className="bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-xl)] p-8 flex items-center justify-center min-h-[280px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="px-7 py-3 rounded-xl text-sm font-semibold bg-[var(--amber)] text-black flex items-center gap-2">
                    ⚡ Connect with Google / Social
                  </div>
                  <p className="text-xs text-[var(--text3)] tracking-wide">
                    Google · Twitter · Passkey
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center fade-up">
              <div className="lg:order-2">
                <div className="text-[80px] font-extrabold text-[rgba(245,158,11,0.08)] leading-none mb-2">02</div>
                <h3 className="text-[clamp(18px,2.5vw,24px)] font-semibold mb-3">Share Your Tip Link Everywhere</h3>
                <p className="text-[var(--text2)] leading-relaxed text-[15px]">
                  Get a unique link and embeddable widget. Add it to your blog, social bio, YouTube description, or anywhere you create. Supporters can tip you without leaving the page.
                </p>
              </div>
              <div className="bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-xl)] p-8 flex items-center justify-center min-h-[280px] lg:order-1">
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-[var(--bg)] border border-[rgba(255,255,255,0.1)] rounded-xl px-5 py-4 font-mono text-xs text-[var(--amber)] text-center break-all">
                    starksend.app/creator/0x049d36…dc7
                  </div>
                  <div className="flex gap-2">
                    {["Link", "Embed", "QR Code", "Button"].map((f) => (
                      <span key={f} className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg4)] border border-[rgba(255,255,255,0.06)] text-[var(--text2)]">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center fade-up">
              <div>
                <div className="text-[80px] font-extrabold text-[rgba(245,158,11,0.08)] leading-none mb-2">03</div>
                <h3 className="text-[clamp(18px,2.5vw,24px)] font-semibold mb-3">Receive Tips Instantly</h3>
                <p className="text-[var(--text2)] leading-relaxed text-[15px]">
                  Crypto lands directly in your Starknet wallet. No intermediaries, no commissions. Track every tip in your session history with live balance updates.
                </p>
              </div>
              <div className="bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-xl)] p-8 flex items-center justify-center min-h-[280px]">
                <div className="flex flex-col gap-3 w-full max-w-[320px]">
                  {[
                    { amount: "+5 STRK received", from: "0x02e3…b91f", time: "just now" },
                    { amount: "+0.01 ETH received", from: "0x0741…ef02", time: "2m ago" },
                    { amount: "+25 USDC received", from: "0xA3f8…1c44", time: "8m ago" },
                  ].map((n) => (
                    <div key={n.from} className="bg-[var(--bg)] border border-[rgba(52,211,153,0.2)] rounded-xl px-5 py-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[rgba(52,211,153,0.12)] flex items-center justify-center text-base text-[var(--emerald)]">
                        ✓
                      </div>
                      <div>
                        <div className="text-[13px] text-white">{n.amount}</div>
                        <div className="text-[11px] text-[var(--text3)] mt-0.5">
                          from {n.from} · {n.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ WHY STARKSEND ═══════ */}
      <section id="why" className="py-[100px]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center fade-up">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-[var(--amber-glow)] text-[var(--amber)] border border-[rgba(245,158,11,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]" />
              Why StarkSend?
            </div>
            <h2 className="mt-5 text-[clamp(28px,4vw,44px)] font-bold tracking-tight">
              Built Different, Built on Starknet
            </h2>
            <p className="text-[clamp(16px,1.8vw,20px)] text-[var(--text2)] leading-relaxed max-w-[600px] mx-auto mt-4">
              Unlike traditional tip jars, StarkSend is commission-free, gasless, and self-custodial. Your keys, your crypto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-16">
            {[
              { icon: "💸", title: "Commission-Free", desc: "Zero platform fees. You keep 100% of every tip. No hidden charges, no revenue splits.", bg: "bg-[var(--amber-glow)]", color: "text-[var(--amber)]" },
              { icon: "🛡️", title: "Self-Custodial", desc: "Tips go straight to your Starknet wallet. No intermediary holds your funds. True ownership.", bg: "bg-[rgba(52,211,153,0.12)]", color: "text-[var(--emerald)]" },
              { icon: "🌐", title: "Embeddable Anywhere", desc: "Drop a widget on your blog, Notion page, or portfolio. One iframe tag is all it takes.", bg: "bg-[rgba(96,165,250,0.12)]", color: "text-[var(--blue)]" },
              { icon: "🔗", title: "On-Chain Transparent", desc: "Every tip is a verifiable Starknet transaction. Full transparency, full accountability.", bg: "bg-[rgba(249,115,22,0.12)]", color: "text-[var(--coral)]" },
              { icon: "🧩", title: "Multi-Token Support", desc: "Accept STRK, ETH, USDC — and more tokens as Starknet grows. Your supporters choose.", bg: "bg-[rgba(167,139,250,0.12)]", color: "text-[#a78bfa]" },
              { icon: "⚡", title: "Instant Setup", desc: "No KYC, no approval. Connect with Google, get your link, start receiving in under 60 seconds.", bg: "bg-[rgba(251,191,36,0.12)]", color: "text-[#fbbf24]" },
            ].map((c, i) => (
              <div
                key={c.title}
                className={`fade-up ${i > 0 ? `stagger-${Math.min(i, 4)}` : ""} why-card-hover bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-lg)] p-8`}
              >
                <div className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-2xl mb-5 ${c.bg} ${c.color}`}>
                  {c.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{c.title}</h3>
                <p className="text-sm text-[var(--text2)] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="py-[100px]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="fade-up bg-[var(--bg3)] border border-[rgba(255,255,255,0.06)] rounded-[var(--radius-xl)] py-20 px-16 text-center relative overflow-hidden">
            <div className="absolute w-[400px] h-[400px] rounded-full bg-[var(--amber)] blur-[180px] opacity-[0.06] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight mb-4 relative z-10">
              Start Receiving Crypto Tips
              <br />
              in Under 60 Seconds
            </h2>
            <p className="text-[clamp(16px,1.8vw,20px)] text-[var(--text2)] leading-relaxed max-w-[600px] mx-auto mb-9 relative z-10">
              No gas fees. No commissions. No seed phrases. Just connect and share your link.
            </p>
            <div className="flex gap-3.5 justify-center flex-wrap relative z-10">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-[var(--amber)] text-black hover:bg-[#fbbf24] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(245,158,11,0.3)]"
              >
                Create Your Tip Link →
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-transparent text-white border border-[rgba(255,255,255,0.15)] hover:border-[var(--amber)] hover:text-[var(--amber)] transition-all"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" className="py-[100px] bg-[var(--bg2)]">
        <div className="max-w-[1140px] mx-auto px-6">
          <div className="text-center fade-up">
            <h2 className="text-[clamp(28px,4vw,44px)] font-bold tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="max-w-[700px] mx-auto mt-12 flex flex-col gap-0.5 fade-up stagger-1">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="py-12 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-[1140px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg font-bold">
            Stark<span className="text-[var(--amber)]">Send</span>
          </div>
          <div className="flex gap-6">
            <a href="https://docs.starknet.io/build/starkzap/overview" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--text3)] hover:text-white transition-colors">Docs</a>
<a href="https://github.com/Datwebguy/starksend" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--text3)] hover:text-white transition-colors">GitHub</a>
<a href="https://x.com/Datwebguy" target="_blank" rel="noopener noreferrer" className="text-[13px] text-[var(--text3)] hover:text-white transition-colors">Twitter</a>
          </div>
          <div className="text-xs text-[var(--text3)]">
            Built on Starknet by Datwebguy
          </div>
        </div>
      </footer>
    </>
  );
}
