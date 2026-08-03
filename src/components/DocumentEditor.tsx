"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "./Editor";
import ShareDialog from "./ShareDialog";

interface DocData {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  owner: { id: string; name: string; email: string };
  role: "owner" | "edit" | "view";
  canEdit: boolean;
  canManage: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 800;

export default function DocumentEditor({ id }: { id: string }) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocData | null>(null);
  const [title, setTitle] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [showShare, setShowShare] = useState(false);

  // Latest unsaved values, flushed by the debounced saver.
  const pending = useRef<{ title?: string; content?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // TipTap emits one update when it first renders the loaded content; ignore it
  // so opening a document doesn't trigger a needless save.
  const hydrated = useRef(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/documents/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load document.");
        if (!active) return;
        setDoc(data.document);
        setTitle(data.document.title);
      })
      .catch((e) => active && setLoadError(e instanceof Error ? e.message : "Failed to load."));
    return () => {
      active = false;
    };
  }, [id]);

  const flush = useCallback(async () => {
    const payload = pending.current;
    pending.current = {};
    if (Object.keys(payload).length === 0) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Save failed.");
      }
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [id]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, AUTOSAVE_MS);
  }, [flush]);

  // Flush any pending edits when leaving the page.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function onContentChange(html: string) {
    if (!hydrated.current) {
      hydrated.current = true;
      return;
    }
    pending.current.content = html;
    setStatus("saving");
    scheduleSave();
  }

  function onTitleChange(value: string) {
    setTitle(value);
    pending.current.title = value;
    setStatus("saving");
    scheduleSave();
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-700">{loadError}</p>
        <button
          onClick={() => router.push("/documents")}
          className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
        >
          ← Back to documents
        </button>
      </div>
    );
  }

  if (!doc) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-gray-500">Loading…</div>;
  }

  const statusLabel: Record<SaveStatus, string> = {
    idle: "",
    saving: "Saving…",
    saved: "All changes saved",
    error: "Save failed — retrying on next edit",
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/documents")}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            title="Back to documents"
          >
            ←
          </button>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            disabled={!doc.canEdit}
            className="flex-1 rounded-lg border border-transparent px-2 py-1 text-lg font-semibold text-gray-900 hover:border-gray-200 focus:border-gray-900 focus:outline-none disabled:bg-transparent"
            placeholder="Untitled document"
          />
          <span
            className={`hidden text-xs sm:inline ${
              status === "error" ? "text-red-600" : "text-gray-400"
            }`}
          >
            {statusLabel[status]}
          </span>
          {!doc.canEdit && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              View only
            </span>
          )}
          {doc.canManage && (
            <button
              onClick={() => setShowShare(true)}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              Share
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <p className="mb-3 text-xs text-gray-400">
          Owner: {doc.owner.name}
          {doc.role !== "owner" && ` · Your access: ${doc.role === "view" ? "view only" : "can edit"}`}
        </p>
        <Editor
          initialContent={doc.content}
          editable={doc.canEdit}
          onChange={onContentChange}
        />
      </main>

      {showShare && (
        <ShareDialog
          documentId={doc.id}
          ownerName={doc.owner.name}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
