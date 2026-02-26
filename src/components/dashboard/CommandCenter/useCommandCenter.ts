"use client";

import { useState, useEffect, useCallback } from "react";
import type { CommandCenterData } from "./types";

export function useCommandCenter(isPremium: boolean) {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isPremium) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tracker/command-center");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to load data");
        return;
      }
      const json: CommandCenterData = await res.json();
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  useEffect(() => {
    if (isPremium) refresh();
  }, [isPremium, refresh]);

  return { data, loading, error, refresh };
}
