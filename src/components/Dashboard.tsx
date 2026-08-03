"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";

interface OwnedDoc {
  id: string;
  title: string;
  updatedAt: string;
}
interface SharedDoc {
  id: string;
  title: string;
  updatedAt: string;
  role: string;
  ownerName: string;
  ownerEmail: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Dashboard({
  user,
}: {
  user: { id: string; name: string; email: string };
}) {
  const router = useRouter();
  const [owned, setOwned] = useState<OwnedDoc[]>([]);
  const [shared, setShared] = useState<SharedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents.");
      const data = await res.json();
      setOwned(data.owned ?? []);
      setShared(data.shared ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createDocument() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled document" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create document.");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create document.");
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setBusy(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteDocument(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed.");
      }
      setOwned((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    }
  }

  return (
    <div>
      <TopBar user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Your documents</h1>
          <div className="flex gap-2">
            <button
              onClick={createDocument}
              disabled={busy}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
            >
              + New document
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Upload file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.docx"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        <p className="mb-6 text-xs text-gray-500">
          Upload supports <strong>.txt</strong>, <strong>.md</strong>, and{" "}
          <strong>.docx</strong> — the file becomes a new editable document.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Owned by me
              </h2>
              {owned.length === 0 ? (
                <p className="text-sm text-gray-400">
                  No documents yet. Create one or upload a file to get started.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {owned.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <button
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="flex-1 text-left"
                      >
                        <span className="block font-medium text-gray-900">{doc.title}</span>
                        <span className="block text-xs text-gray-400">
                          Edited {formatDate(doc.updatedAt)}
                        </span>
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id, doc.title)}
                        className="ml-3 rounded-md px-2 py-1 text-xs text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Shared with me
              </h2>
              {shared.length === 0 ? (
                <p className="text-sm text-gray-400">No documents shared with you yet.</p>
              ) : (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  {shared.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <button
                        onClick={() => router.push(`/documents/${doc.id}`)}
                        className="flex-1 text-left"
                      >
                        <span className="block font-medium text-gray-900">{doc.title}</span>
                        <span className="block text-xs text-gray-400">
                          Shared by {doc.ownerName} · Edited {formatDate(doc.updatedAt)}
                        </span>
                      </button>
                      <span className="ml-3 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {doc.role === "view" ? "Can view" : "Can edit"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
