"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "si-lamin-cookie-consent";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user already accepted cookies
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay to not block initial render
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-100 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 shrink-0">
            <Cookie className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Cookies & Penyimpanan Lokal
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              SI-LAMIN menggunakan cookies dan penyimpanan lokal untuk menyimpan sesi login, preferensi, 
              dan token notifikasi push. Data ini hanya disimpan di perangkat Anda.
            </p>
          </div>
          <button onClick={decline} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 ml-13">
          <Button size="sm" onClick={accept} className="text-xs h-8">
            Terima Semua
          </Button>
          <Button size="sm" variant="outline" onClick={decline} className="text-xs h-8">
            Tolak
          </Button>
        </div>
      </div>
    </div>
  );
}

export function hasCookieConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}
