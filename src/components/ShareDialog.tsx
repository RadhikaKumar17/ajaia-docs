"use client";

import { useEffect, useState } from "react";

interface Collaborator {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export default function ShareDialog({
  documentId,
  ownerName,
  onClose,
}: {
  documentId: string;
  ownerName: string;
  onClose: () => void;
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"edit" | "view">("edit");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch(`/api/documents/${documentId}/share`);
    if (res.ok) {
      const data = await res.json();
      setCollaborators(data.collaborators ?? []);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function addCollaborator(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to share.");
      setEmail("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userId: string) {
    setError(null);
    const res = await fetch(`/api/documents/${documentId}/share?userId=${userId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to remove access.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Share document</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={addCollaborator} className="mb-4 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@ajaia.dev"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "edit" | "view")}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-gray-900 focus:outline-none"
          >
            <option value="edit">Can edit</option>
            <option value="view">Can view</option>
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
          >
            Share
          </button>
        </form>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          People with access
        </p>
        <ul className="space-y-2">
          <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm text-gray-700">
              {ownerName} <span className="text-gray-400">(owner)</span>
            </span>
          </li>
          {collaborators.map((c) => (
            <li
              key={c.userId}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
            >
              <span className="text-sm">
                <span className="font-medium text-gray-800">{c.name}</span>{" "}
                <span className="text-gray-400">· {c.email}</span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {c.role === "view" ? "Can view" : "Can edit"}
                </span>
              </span>
              <button
                onClick={() => revoke(c.userId)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
          {collaborators.length === 0 && (
            <li className="text-sm text-gray-400">Not shared with anyone yet.</li>
          )}
        </ul>

        <p className="mt-4 text-xs text-gray-400">
          Demo users: alice@ajaia.dev, bob@ajaia.dev, carol@ajaia.dev
        </p>
      </div>
    </div>
  );
}
