"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EcoCashCheckout {
  ecocashNumber: string;
  ecocashName: string;
  /** Unique exact amount to send for this specific payment request, so an
   *  incoming EcoCash SMS can be matched by amount alone and a proof
   *  screenshot can't be reused across two different people's payments. */
  amount: number;
  /** `tel:` deep link that pre-fills EcoCash's send-money USSD session.
   *  NOTE: EcoCash's USSD menu path can change over time — confirm this
   *  still lands on the right step before relying on it; the manual
   *  "*151#" instructions are always shown alongside it as a fallback. */
  ussdLink: string;
  loading: boolean;
}

export function useEcoCashCheckout(basePrice: number): EcoCashCheckout {
  const [ecocashNumber, setEcocashNumber] = useState("");
  const [ecocashName, setEcocashName] = useState("");
  const [amount, setAmount] = useState(basePrice);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const [{ data: settings }, { data: fingerprint }] = await Promise.all([
        (supabase.from("platform_settings") as any).select("key,value").in("key", ["ecocash_number", "ecocash_name"]),
        (supabase.rpc as any)("generate_payment_fingerprint_amount", { p_base_price: basePrice }),
      ]);
      if (cancelled) return;

      const byKey = new Map((settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value]));
      setEcocashNumber(String(byKey.get("ecocash_number") ?? "").replace(/^"|"$/g, ""));
      setEcocashName(String(byKey.get("ecocash_name") ?? "").replace(/^"|"$/g, ""));
      setAmount(typeof fingerprint === "number" ? fingerprint : basePrice);
      setLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePrice]);

  // `.` is not a valid MMI/dial character — phone dialers silently strip it
  // when normalizing a `tel:` link for dialing (the same behavior that lets
  // you save a number as "555.123.4567"), which turned "4.98" into "498" and
  // sent the wrong amount. EcoCash's own USSD amount field expects "*" in
  // place of the decimal point (e.g. "4*98" for $4.98) — that's the only
  // character besides digits/# that survives MMI dialing.
  const dialAmount = amount.toFixed(2).replace(".", "*");
  const ussdLink = `tel:*151*1*1*${ecocashNumber}*${dialAmount}%23`;

  return { ecocashNumber, ecocashName, amount, ussdLink, loading };
}
