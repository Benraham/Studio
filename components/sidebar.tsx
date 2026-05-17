"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/", label: "Ideas" },
  { href: "/short-form", label: "Short Form" },
  { href: "/chat", label: "Chat" },
  { href: "/channel", label: "Channel" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-[240px] flex flex-col z-40"
      style={{
        background: "rgba(255, 255, 255, 0.84)",
        backdropFilter: "blur(24px) saturate(1.9)",
        WebkitBackdropFilter: "blur(24px) saturate(1.9)",
        borderRight: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "2px 0 24px rgba(0, 0, 0, 0.04)",
      }}
    >
      <div className="px-5 pt-7 pb-8">
        <Link href="/" className="block group">
          <span className="text-[18px] font-bold tracking-[-0.03em] text-[--text]">
            Studio
            <span
              className="text-[--accent] transition-transform duration-300 inline-block group-hover:scale-110 origin-bottom-left"
            >
              .
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        <ul className="space-y-0.5">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={`relative flex items-center pl-3.5 pr-3 py-2 rounded-[9px] text-[14px] font-medium transition-all duration-150 ${
                    active
                      ? "text-[--accent] bg-[--accent-quiet]"
                      : "text-[--text-muted] hover:text-[--text] hover:bg-black/[0.04]"
                  }`}
                >
                  {active ? (
                    <span className="absolute left-0 top-2 bottom-2 w-[2.5px] rounded-r-full bg-[--accent]" />
                  ) : null}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <Link
          href="/settings"
          className={`flex items-center px-3.5 py-2 rounded-[9px] text-[13px] font-medium transition-all duration-150 ${
            isActive(pathname, "/settings")
              ? "text-[--accent] bg-[--accent-quiet]"
              : "text-[--text-muted] hover:text-[--text] hover:bg-black/[0.04]"
          }`}
        >
          Settings
        </Link>
        <button
          onClick={signOut}
          className="w-full text-left flex items-center px-3.5 py-2 rounded-[9px] text-[13px] text-[--text-muted] hover:text-[--text] hover:bg-black/[0.04] transition-all duration-150"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
