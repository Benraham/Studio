import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="max-w-[1080px] mx-auto px-10 py-10 slide-up">{children}</div>
      </main>
    </div>
  );
}
