"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * "chat-attachments" is a private bucket (see migration 068) — image/file
 * message.file_url values are storage object paths, not usable URLs, and
 * must be resolved to a signed URL before rendering. Resolves once per path
 * and caches for the component's lifetime.
 */
export function useChatAttachmentUrls(supabase: SupabaseClient, paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const urlsRef = useRef(urls);
  useEffect(() => { urlsRef.current = urls; }, [urls]);

  const key = Array.from(new Set(paths.filter(Boolean))).sort().join("|");

  useEffect(() => {
    const unresolved = Array.from(new Set(paths.filter(Boolean))).filter((p) => !urlsRef.current[p]);
    if (unresolved.length === 0) return;
    let cancelled = false;
    supabase.storage.from("chat-attachments").createSignedUrls(unresolved, 3600).then(({ data }) => {
      if (cancelled || !data) return;
      setUrls((prev) => {
        const next = { ...prev };
        data.forEach((d) => { if (d.signedUrl && d.path) next[d.path] = d.signedUrl; });
        return next;
      });
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
