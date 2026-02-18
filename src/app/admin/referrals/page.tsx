"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import Link from "next/link";

interface Referral {
  id: string;
  name: string;
  email: string;
  phone: string;
  bestTimeToCall: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.1)", text: "#d97706" },
  contacted: { bg: "rgba(67,97,238,0.1)", text: "#4361ee" },
  converted: { bg: "rgba(16,185,129,0.1)", text: "#10b981" },
  declined: { bg: "rgba(107,114,128,0.1)", text: "#6b7280" },
};

const STATUSES = ["pending", "contacted", "converted", "declined"];

export default function AdminReferralsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/signup");
      return;
    }
    // Fetch referrals
    fetch("/api/admin/referrals")
      .then((r) => {
        if (r.status === 403) throw new Error("Not authorized");
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((json) => {
        setReferrals(json.referrals || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, status, router]);

  const handleStatusChange = useCallback(async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/credit-referral/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setReferrals((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    } catch {
      // silently fail
    }
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-[#4361ee] to-[#6366f1] rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">Admin</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#1b2434" }} className="sm:!text-[22px]">Credit Referrals</h1>
          <p style={{ fontSize: 13, color: "#8d95a3", marginTop: 4 }}>{referrals.length} total referrals</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e6e9ef", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#fafbfd", borderBottom: "1px solid #e6e9ef" }}>
                {["Date", "Name", "Email", "Phone", "Best Time", "Notes", "Status"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8d95a3", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => {
                const sc = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                return (
                  <tr key={r.id} style={{ borderBottom: "1px solid #f0f2f6" }}>
                    <td style={{ padding: "12px 16px", color: "#5a6578", whiteSpace: "nowrap" }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1b2434" }}>{r.name}</td>
                    <td style={{ padding: "12px 16px", color: "#5a6578" }}>{r.email}</td>
                    <td style={{ padding: "12px 16px", color: "#5a6578" }}>{r.phone}</td>
                    <td style={{ padding: "12px 16px", color: "#8d95a3" }}>{r.bestTimeToCall || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#8d95a3", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.notes || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <select
                        value={r.status}
                        onChange={(e) => handleStatusChange(r.id, e.target.value)}
                        style={{
                          padding: "4px 8px", borderRadius: 6, border: "1px solid #e6e9ef",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          background: sc.bg, color: sc.text,
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", color: "#8d95a3" }}>
                    No referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
