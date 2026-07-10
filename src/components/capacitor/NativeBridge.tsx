"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initNativeBridge } from "@/lib/capacitor/native";

/** Mounted once at the root layout. No-op on web. */
export function NativeBridge() {
  const router = useRouter();

  useEffect(() => {
    initNativeBridge(router);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
