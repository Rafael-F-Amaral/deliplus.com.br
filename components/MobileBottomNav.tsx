import Link from "next/link";
import { Home, ShoppingBag, BookOpen, Users, MoreHorizontal } from "lucide-react";

export function MobileBottomNav({ activePath }: { activePath: string }) {
  const items = [
    { label: "Visão geral", icon: Home, href: "/visao-geral" },
    { label: "Pedidos", icon: ShoppingBag, href: "/pedidos" },
    { label: "Cardápio", icon: BookOpen, href: "/cardapio" },
    { label: "Clientes", icon: Users, href: "/clientes" },
    { label: "Mais", icon: MoreHorizontal, href: "#" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-200/60 pb-safe md:hidden z-50">
      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        {items.map((item) => {
          const isActive = activePath === item.href;
          const Icon = item.icon;
          return (
            <Link 
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-2 gap-1.5 transition-colors ${
                isActive ? "text-olive-700" : "text-ink-600 hover:text-ink-950"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`text-[11px] ${isActive ? "font-medium" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
