import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";

interface AppShellProps {
  children: ReactNode;
  activePath: string;
}

export function AppShell({ children, activePath }: AppShellProps) {
  return (
    <div className="flex h-screen w-full bg-surface-100 overflow-hidden font-sans text-ink-950">
      <Sidebar activePath={activePath} />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <MobileHeader />
        
        <div className="flex-1 overflow-y-auto pb-24 md:pb-12 px-6 md:px-12 pt-6 md:pt-12">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </div>
        
        <MobileBottomNav activePath={activePath} />
      </main>
    </div>
  );
}
