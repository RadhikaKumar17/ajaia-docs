"use client";

import { useRouter } from "next/navigation";

export default function TopBar({
  user,
}: {
  user: { name: string; email: string };
}) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/documents")}
          className="text-lg font-bold text-gray-900"
        >
          Ajaia Docs
        </button>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-gray-600 sm:inline">
            {user.name} · {user.email}
          </span>
          <button
            onClick={signOut}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
