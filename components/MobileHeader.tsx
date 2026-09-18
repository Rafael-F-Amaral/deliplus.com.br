import { Menu } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-6 bg-white border-b border-border-200 md:hidden">
      <button className="text-ink-600 hover:text-ink-950 transition-colors">
        <Menu size={28} strokeWidth={1.5} />
      </button>
      <h1 className="font-serif text-[28px] text-forest-950 font-medium">Deliplus</h1>
      <div className="w-10 h-10 rounded-full bg-surface-100 border border-border-200 flex items-center justify-center">
        <span className="text-[13px] font-medium text-ink-600">MN</span>
      </div>
    </header>
  );
}
