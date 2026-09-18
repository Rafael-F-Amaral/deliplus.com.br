import Link from "next/link";
import { 
  Home, 
  ShoppingBag, 
  BookOpen, 
  Users, 
  Megaphone, 
  DollarSign, 
  BarChart3, 
  Users2, 
  Settings, 
  Headset,
  ChevronDown,
  ExternalLink,
  Leaf
} from "lucide-react";

export function Sidebar({ activePath }: { activePath: string }) {
  const navItems = [
    { label: "Visão geral", icon: Home, href: "/visao-geral" },
    { label: "Pedidos", icon: ShoppingBag, href: "/pedidos" },
    { label: "Cardápio", icon: BookOpen, href: "/cardapio" },
    { label: "Clientes", icon: Users, href: "/clientes" },
    { label: "Marketing", icon: Megaphone, href: "/marketing" },
    { label: "Financeiro", icon: DollarSign, href: "/financeiro" },
    { label: "Relatórios", icon: BarChart3, href: "/relatorios" },
    { label: "Equipe", icon: Users2, href: "/equipe" },
    { label: "Configurações", icon: Settings, href: "/configuracoes" },
  ];

  return (
    <aside className="w-[380px] h-screen bg-forest-950 flex-shrink-0 flex flex-col hidden md:flex">
      {/* Header */}
      <div className="pt-12 px-12 pb-8">
        <h1 className="text-white font-serif text-[42px] font-medium tracking-tight mb-8">
          Deliplus
        </h1>
        
        {/* Store Switcher */}
        <button className="w-full bg-forest-900 border border-olive-700/30 rounded-2xl p-4 flex items-center justify-between hover:bg-forest-900/80 transition-colors text-left group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-olive-700/20 flex items-center justify-center text-white">
              <Leaf size={20} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-white font-medium text-[17px]">Casa Noma</div>
              <div className="text-gray-400 text-sm flex items-center gap-1 group-hover:text-gray-300 transition-colors">
                Ver loja <ExternalLink size={14} />
              </div>
            </div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-8 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activePath === item.href;
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-200 ${
                    isActive 
                      ? "bg-olive-700 text-white font-medium" 
                      : "text-gray-300 hover:text-white hover:bg-forest-900/50"
                  }`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                  <span className="text-[17px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Support Card */}
      <div className="p-8">
        <button className="w-full bg-forest-900/50 hover:bg-forest-900 transition-colors border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left">
          <div className="text-gray-400">
            <Headset size={24} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="text-white font-medium text-[15px]">Precisa de ajuda?</div>
            <div className="text-terracotta-600 font-medium text-[15px]">Fale com o suporte</div>
          </div>
          <ChevronDown size={20} className="text-gray-400" />
        </button>
      </div>
    </aside>
  );
}
