"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Wallet, Ratio, Archive, Box } from "lucide-react";
import { setupGSAP, gsap } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";

export default function HomeIntro() {
  const scope = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      setupGSAP();
      const tl = gsap.timeline();

      tl.set(".hero-logo", { scale: 0.6, opacity: 0, rotate: -10 })
        .to(".hero-logo", {
          scale: 1,
          opacity: 1,
          rotate: 0,
          duration: 0.9,
          ease: "back.out(1.6)",
        })
        .from(".hero-title", { opacity: 0, y: 8, duration: 0.2 }, "<0.25")
        .to(
          ".hero-title",
          { text: "Qubito POS", duration: 0.9, ease: "none" },
          "<"
        )
        .from(
          ".hero-sub",
          { opacity: 0, y: 10, duration: 0.5, stagger: 0.1, ease: "power2.out" },
          "-=0.2"
        )
        .from(
          ".hero-cta",
          { opacity: 0, y: 14, duration: 0.45, stagger: 0.08, ease: "power2.out" },
          "-=0.2"
        )
        .from(
          ".feature-card",
          { opacity: 0, y: 18, duration: 0.6, stagger: 0.12, ease: "power2.out" },
          "-=0.2"
        );
    },
    { scope }
  );

  return (
    <div ref={scope} className="h-full w-full flex flex-col">
      <section className="relative flex flex-col items-center justify-center text-center py-6 sm:py-10 rounded-xl bg-gradient-to-br from-slate-50 to-white border">
        <div className="hero-logo relative w-36 h-36 sm:w-40 sm:h-40 mb-4 sm:mb-6">
          <div className="absolute inset-0 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="relative mx-auto w-36 h-36 sm:w-40 sm:h-40 rounded-full ring-8 ring-white shadow-[0_12px_40px_-12px_rgba(2,132,199,0.45)] grid place-items-center overflow-hidden bg-white">
            <Box className="h-8 w-8 text-sky-400" />
          </div>
        </div>

        <h1 className="hero-title text-3xl sm:text-4xl font-black tracking-tight text-slate-800 min-h-[1.2em]"></h1>
        <p className="hero-sub mt-2 text-slate-500">Punto de venta para restaurantes</p>
        <p className="hero-sub text-slate-500">Gestiona ventas, mesas e inventario</p>

        <div className="mt-5 sm:mt-6 flex items-center gap-3">
          <Link
            href="/sale"
            className="hero-cta inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg shadow hover:bg-sky-700"
          >
            <Wallet size={18} />
            Ir al POS
          </Link>
          <Link
            href="/inventory"
            className="hero-cta inline-flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50"
          >
            <Archive size={18} />
            Inventario
          </Link>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/sale" className="feature-card group rounded-xl border p-4 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-sky-50 text-sky-600">
              <Wallet />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Venta Rápida</p>
              <p className="text-sm text-slate-500">Cobros ágiles, tickets y propinas</p>
            </div>
          </div>
        </Link>

        <Link href="/tables" className="feature-card group rounded-xl border p-4 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Ratio />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Mesas</p>
              <p className="text-sm text-slate-500">Control de mesas y cuentas</p>
            </div>
          </div>
        </Link>

        <Link href="/inventory" className="feature-card group rounded-xl border p-4 bg-white hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-amber-50 text-amber-600">
              <Archive />
            </div>
            <div>
              <p className="font-semibold text-slate-800">Inventario</p>
              <p className="text-sm text-slate-500">Stock, mínimos y alertas</p>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}

