"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface DemoUser {
  id: string;
  name: string;
  email: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          router.replace("/documents");
          return;
        }
        setUsers(data.users ?? []);
      })
      .catch(() => setError("Failed to load demo users."))
      .finally(() => setLoading(false));
  }, [router]);

  async function signIn(userId: string) {
    setBusyId(userId);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Sign-in failed.");
      }
      router.push("/documents");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed.");
      setBusyId(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Ajaia Docs</h1>
          <p className="mt-1 text-sm text-gray-500">
            A lightweight collaborative document editor.
          </p>
        </div>

        <p className="mb-3 text-sm font-medium text-gray-700">
          Choose a demo user to sign in
        </p>

        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => signIn(u.id)}
              disabled={busyId !== null}
              className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-gray-900 hover:bg-gray-50 disabled:opacity-50"
            >
              <span>
                <span className="block font-medium text-gray-900">{u.name}</span>
                <span className="block text-xs text-gray-500">{u.email}</span>
              </span>
              <span className="text-sm text-gray-400">
                {busyId === u.id ? "Signing in…" : "Sign in →"}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Mock authentication — no passwords. Sign in as different users in
          separate browser windows to test sharing.
        </p>
      </div>
    </main>
  );
}
