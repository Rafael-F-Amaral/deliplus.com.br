"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Smartphone,
  Square,
  PenTool,
  Send,
  RotateCcw,
  Sliders,
  Share2,
  ThumbsUp,
  MessageSquare,
  ChevronDown,
  ExternalLink,
  Move,
  Edit3
} from "lucide-react";
import type { CouponItem } from "./coupons-client";

export interface CouponImageGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: CouponItem | null;
  storeName: string;
  storeSlug: string;
}

interface FoodTheme {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  fallbackGradient: string;
  accentColor: string;
}

const FOOD_THEMES: FoodTheme[] = [
  {
    id: "burger",
    name: "Burger Artesanal",
    category: "Lanches & Burgers",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #1f140e, #3d1d12)",
    accentColor: "#CB5A3C"
  },
  {
    id: "pizza",
    name: "Pizza & Forno a Lenha",
    category: "Pizzarias",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2b1108, #521808)",
    accentColor: "#E11D48"
  },
  {
    id: "acai",
    name: "Açaí & Sorveteria",
    category: "Açaí & Gelados",
    imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #1e092b, #3b1057)",
    accentColor: "#9333EA"
  },
  {
    id: "sushi",
    name: "Sushi & Japonês",
    category: "Culinária Oriental",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #0d1117, #1f2937)",
    accentColor: "#F59E0B"
  },
  {
    id: "caseira",
    name: "Marmitex & Caseira",
    category: "Restaurantes",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #181d16, #2d3829)",
    accentColor: "#10B981"
  },
  {
    id: "doces",
    name: "Doceria & Bolos",
    category: "Confeitaria & Café",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2e111a, #54192d)",
    accentColor: "#EC4899"
  },
  {
    id: "petiscos",
    name: "Pastéis & Petiscos",
    category: "Bares & Petiscarias",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2b1f09, #4a340b)",
    accentColor: "#F59E0B"
  },
  {
    id: "grad_terracotta",
    name: "DeliPlus Terracotta",
    category: "Cores da Marca",
    fallbackGradient: "linear-gradient(135deg, #1e110d, #421c14)",
    accentColor: "#CB5A3C"
  },
  {
    id: "grad_forest",
    name: "Verde Floresta",
    category: "Cores da Marca",
    fallbackGradient: "linear-gradient(135deg, #0e1a12, #1b3323)",
    accentColor: "#10B981"
  },
  {
    id: "grad_dark",
    name: "Dark Charcoal",
    category: "Cores da Marca",
    fallbackGradient: "linear-gradient(135deg, #0b0f17, #1a2233)",
    accentColor: "#38BDF8"
  }
];

export type SocialNetworkId =
  | "instagram"
  | "whatsapp"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "x"
  | "kwai";

export interface SocialAccountItem {
  id: SocialNetworkId;
  name: string;
  handle: string;
  enabled: boolean;
  brandColor: string;
}

// Convert HSL hue to Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function hexToHue(hex: string): number {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d === 0) return 15;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  return h;
}

// Authentic SVG Brand Icons
function BrandIconBadge({ id, size = 20 }: { id: SocialNetworkId; size?: number }) {
  if (id === "instagram") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)"
        }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      </div>
    );
  }
  if (id === "whatsapp") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-[#25D366]"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.68} height={size * 0.68} viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </div>
    );
  }
  if (id === "facebook") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-[#1877F2]"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </div>
    );
  }
  if (id === "youtube") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-[#FF0000]"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </div>
    );
  }
  if (id === "tiktok") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-[#010101]"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="white">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      </div>
    );
  }
  if (id === "x") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-black"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>
    );
  }
  if (id === "kwai") {
    return (
      <div
        className="rounded-md flex items-center justify-center shrink-0 shadow-2xs bg-[#FF5000]"
        style={{ width: size, height: size }}
      >
        <span className="text-[12px] font-black text-white leading-none">K</span>
      </div>
    );
  }
  return null;
}

// Canvas brand logo renderer
function drawBrandLogo(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, size: number) {
  ctx.save();
  const r = size / 2;
  const cx = x + r;
  const cy = y + r;

  if (id === "instagram") {
    const grad = ctx.createLinearGradient(x, y + size, x + size, y);
    grad.addColorStop(0, "#f09433");
    grad.addColorStop(0.3, "#e6683c");
    grad.addColorStop(0.6, "#dc2743");
    grad.addColorStop(1, "#bc1888");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, size * 0.28);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.8, size * 0.08);
    ctx.beginPath();
    ctx.roundRect(x + size * 0.18, y + size * 0.18, size * 0.64, size * 0.64, size * 0.18);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + size * 0.68, y + size * 0.32, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === "whatsapp") {
    ctx.fillStyle = "#25D366";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#FFFFFF";
    ctx.fillStyle = "#FFFFFF";
    ctx.lineWidth = Math.max(1.8, size * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.03, size * 0.26, 0.2 * Math.PI, 1.9 * Math.PI);
    ctx.lineTo(cx - size * 0.26, cy + size * 0.26);
    ctx.closePath();
    ctx.stroke();

    ctx.font = `bold ${Math.round(size * 0.38)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("✆", cx, cy + size * 0.11);
  } else if (id === "facebook") {
    ctx.fillStyle = "#1877F2";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${Math.round(size * 0.68)}px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("f", cx + size * 0.04, cy + size * 0.24);
  } else if (id === "youtube") {
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.roundRect(x, y + size * 0.14, size, size * 0.72, size * 0.22);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.16);
    ctx.lineTo(cx + size * 0.18, cy);
    ctx.lineTo(cx - size * 0.12, cy + size * 0.16);
    ctx.closePath();
    ctx.fill();
  } else if (id === "x") {
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `900 ${Math.round(size * 0.52)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("𝕏", cx, cy + size * 0.18);
  } else if (id === "tiktok") {
    ctx.fillStyle = "#010101";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${Math.round(size * 0.58)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("♪", cx, cy + size * 0.2);
  } else if (id === "kwai") {
    ctx.fillStyle = "#FF5000";
    ctx.beginPath();
    ctx.roundRect(x, y + size * 0.08, size, size * 0.84, size * 0.25);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${Math.round(size * 0.44)}px 'Arial Black', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("K", cx, cy + size * 0.16);
  }

  ctx.restore();
}

function renderWhatsAppFormattedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*[^*]+\*)/g);
    return (
      <React.Fragment key={lIdx}>
        {parts.map((part, pIdx) => {
          if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return (
              <strong key={pIdx} className="font-bold text-gray-950">
                {part.slice(1, -1)}
              </strong>
            );
          }
          if (part.startsWith("https://") || part.startsWith("deliplus.com.br")) {
            return (
              <span key={pIdx} className="text-[#027EB5] underline cursor-pointer">
                {part}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
        {lIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export type MarketingChannel = "instagram" | "facebook" | "whatsapp";
export type MarketingFormat = "feed" | "story" | "chat";

interface CaptionTemplateItem {
  id: string;
  title: string;
  badge: string;
  format: MarketingFormat;
  text: string;
}

const INSTAGRAM_TEMPLATES: CaptionTemplateItem[] = [
  {
    id: "ig_cravings",
    title: "Fome & Desejo",
    badge: "Feed (Alta Conversão)",
    format: "feed",
    text: "🔥 Bateu aquela fome incontrolável? A gente resolve agora!\n\nPeça direto pelo nosso cardápio online e aproveite: use o cupom *{CODIGO}* para garantir *{DESCONTO}* no seu pedido!\n\n👉 {MINIMO}\n👉 Válido apenas 1 uso por cliente\n👉 Peça quentinho em minutos pelo link da nossa bio!\n\n📲 {LINK}\n\n#delivery #comidaboa #almoco #jantar #lanche #cupomdedesconto"
  },
  {
    id: "ig_urgency",
    title: "Urgência Relâmpago",
    badge: "Feed (Só Hoje)",
    format: "feed",
    text: "🚨 CUPOM RELÂMPAGO NA ÁREA! (Válido só hoje)\n\nLiberamos o cupom *{CODIGO}* com *{DESCONTO}* exclusivo para pedidos no nosso cardápio próprio!\n\n⚠️ {MINIMO}\n⚠️ Não cumulativo • Limitado a 1 uso por cliente\n\nCorre antes que acabe a cota de hoje! Link direto na bio 🏃💨\n\n📲 {LINK}\n\n#promocao #cupomdedesconto #deliveryrapido #descontodehoje"
  },
  {
    id: "ig_first_order",
    title: "Boas-Vindas (1º Pedido)",
    badge: "Feed (Novos Clientes)",
    format: "feed",
    text: "👋 Primeira vez pedindo com a gente? O presente de boas-vindas é por nossa conta!\n\nUse o cupom especial *{CODIGO}* no seu 1º pedido e ganhe *{DESCONTO}*!\n\n✨ {MINIMO}\n✨ Válido exclusivamente para novos clientes no cardápio online\n\nToque no link da nossa bio e faça sua primeira experiência com a gente! 🍔✨\n\n📲 {LINK}\n\n#primeiropedido #deliverylocal #desconto #comidagourmet"
  },
  {
    id: "ig_weekend",
    title: "Sextou & Fim de Semana",
    badge: "Feed (Fim de Semana)",
    format: "feed",
    text: "🍕 Sextou com comida boa e zero louça na pia!\n\nReúna a galera ou aproveite o filme no sofá: garanta *{DESCONTO}* usando o cupom *{CODIGO}* no nosso cardápio!\n\n👉 {MINIMO}\n👉 1 uso por cliente • Válido para o fim de semana\n\nPediu, chegou quentinho! Acesse o link da bio 🛋️🛵\n\n📲 {LINK}\n\n#sextou #fimdesemana #deliverynight #pizzanight #burgernight"
  },
  {
    id: "ig_story",
    title: "Story & Reels Direto",
    badge: "Story / Reels (9:16)",
    format: "story",
    text: "A única notificação de delivery que você queria hoje! 📲🤤\n\nUse o cupom *{CODIGO}* para *{DESCONTO}* ({MINIMO}).\n\nToque no link do Story ou acesse o link na nossa bio! 🛵✨\n\n📲 {LINK}"
  }
];

const FACEBOOK_TEMPLATES: CaptionTemplateItem[] = [
  {
    id: "fb_standard",
    title: "Postagem de Conversão",
    badge: "Feed do Facebook",
    format: "feed",
    text: "Hoje a refeição fica mais gostosa e prática por aqui! 🍽️✨\n\nLiberamos um cupom especial de {DESCONTO} para quem fizer o pedido diretamente no nosso cardápio online.\n\n🎟️ Use o cupom: {CODIGO}\n📌 Regra: {MINIMO}\n\nClique no link abaixo e faça seu pedido sem intermediários nem taxas extras:\n👉 https://{LINK}\n\nPreparamos tudo na hora com ingredientes selecionados. Peça agora e receba quentinho em casa! ❤️🛵"
  },
  {
    id: "fb_urgency",
    title: "Promoção Só Hoje",
    badge: "Feed (Relâmpago)",
    format: "feed",
    text: "🚨 ATENÇÃO: CUPOM DISPONÍVEL POR TEMPO LIMITADO!\n\nGaranta {DESCONTO} no seu pedido hoje usando o código {CODIGO} no nosso cardápio oficial!\n\n⚠️ {MINIMO}\n⚠️ Válido para os primeiros pedidos do dia!\n\nClique direto no link e aproveite antes de encerrar:\n👉 https://{LINK}"
  },
  {
    id: "fb_weekend",
    title: "Fim de Semana em Família",
    badge: "Feed (Família)",
    format: "feed",
    text: "Fim de semana combina com descanso e boa comida! 🍕🥤\n\nReúna a família ou os amigos e garanta {DESCONTO} no seu pedido com o cupom {CODIGO} ({MINIMO}).\n\nPeça direto pelo nosso cardápio oficial:\n👉 https://{LINK}\n\nEntrega rápida e segura no conforto do seu lar! 🛵✨"
  },
  {
    id: "fb_story",
    title: "Story do Facebook",
    badge: "Story (9:16)",
    format: "story",
    text: "Cupom liberado no nosso cardápio! Use {CODIGO} e ganhe {DESCONTO} ({MINIMO}). Acesse o link no story ou acesse https://{LINK} para pedir agora! 🛵💨"
  }
];

const WHATSAPP_TEMPLATES: CaptionTemplateItem[] = [
  {
    id: "wa_broadcast",
    title: "Lista de Clientes VIP",
    badge: "Conversa no Chat",
    format: "chat",
    text: "Olá! Tudo bem? Passando para te avisar que liberamos um cupom exclusivo para você hoje no nosso delivery! 🎁\n\nUse o código *{CODIGO}* e garanta *{DESCONTO}* no seu pedido!\n\n📌 {MINIMO}\n📌 Válido para 1 uso por cliente\n\nPara pedir agora sem taxas extras, clique no link:\n👉 https://{LINK}\n\nBom apetite! 😋"
  },
  {
    id: "wa_flash",
    title: "Disparo Relâmpago",
    badge: "Conversa no Chat",
    format: "chat",
    text: "🚨 *CUPOM RELÂMPAGO LIBERADO!* 🚨\n\nLiberamos o cupom *{CODIGO}* dando *{DESCONTO}* exclusivo para quem pede no nosso cardápio próprio!\n\n⚠️ {MINIMO}\n⚠️ Válido apenas para pedidos de hoje!\n\nCorre para garantir o seu antes que encerre a cota:\n👉 https://{LINK}\n\nQualquer dúvida é só responder aqui! 🛵💨"
  },
  {
    id: "wa_status",
    title: "Status do WhatsApp",
    badge: "Status (9:16)",
    format: "story",
    text: "🔥 Cupom especial liberado hoje no cardápio!\n\nUse o código *{CODIGO}* para garantir *{DESCONTO}* ({MINIMO}).\n\nPeça agora no link:\n👉 https://{LINK}"
  },
  {
    id: "wa_welcome",
    title: "Boas-Vindas pelo WhatsApp",
    badge: "Conversa no Chat",
    format: "chat",
    text: "Seja muito bem-vindo(a) ao nosso atendimento! 👋✨\n\nComo presente para o seu primeiro pedido com a gente, você ganhou o cupom *{CODIGO}* com *{DESCONTO}*!\n\n✨ {MINIMO}\n\nVeja nosso cardápio completo e monte seu pedido:\n👉 https://{LINK}\n\nEstamos prontos para preparar o seu pedido com todo carinho! 🍔🍕"
  }
];

interface LayoutPositions {
  storePillY: number;
  headerGroupY: number;
  discountY: number;
  ticketY: number;
  ctaY: number;
  socialsY: number;
}

const DEFAULT_STORY_POSITIONS: LayoutPositions = {
  storePillY: 13,
  headerGroupY: 22,
  discountY: 35,
  ticketY: 52,
  ctaY: 69,
  socialsY: 78
};

const DEFAULT_FEED_POSITIONS: LayoutPositions = {
  storePillY: 7,
  headerGroupY: 18,
  discountY: 36,
  ticketY: 58,
  ctaY: 76,
  socialsY: 86
};

type EditTarget = "header" | "discount" | "ticket" | "cta" | null;

function CouponImageGeneratorContent({
  onClose,
  coupon,
  storeName,
  storeSlug
}: {
  onClose: () => void;
  coupon: CouponItem | null;
  storeName: string;
  storeSlug: string;
}) {
  const [activeTab, setActiveTab] = useState<"design" | "copy_studio">("design");

  const [aspectFormat, setAspectFormat] = useState<"story" | "feed">("story");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("burger");
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  const [positions, setPositions] = useState<LayoutPositions>(DEFAULT_STORY_POSITIONS);

  const [socialAccounts, setSocialAccounts] = useState<SocialAccountItem[]>(() => [
    { id: "instagram", name: "Instagram", handle: `@${storeSlug || "sualoja"}`, enabled: true, brandColor: "#E1306C" },
    { id: "whatsapp", name: "WhatsApp", handle: "Peça pelo WhatsApp", enabled: true, brandColor: "#25D366" },
    { id: "facebook", name: "Facebook", handle: `/${storeSlug || "sualoja"}`, enabled: false, brandColor: "#1877F2" },
    { id: "youtube", name: "YouTube", handle: `@${storeSlug || "sualoja"}`, enabled: false, brandColor: "#FF0000" },
    { id: "tiktok", name: "TikTok", handle: `@${storeSlug || "sualoja"}`, enabled: false, brandColor: "#010101" },
    { id: "x", name: "X (Twitter)", handle: `@${storeSlug || "sualoja"}`, enabled: false, brandColor: "#000000" },
    { id: "kwai", name: "Kwai", handle: `@${storeSlug || "sualoja"}`, enabled: false, brandColor: "#FF5000" }
  ]);

  const [headline, setHeadline] = useState(() => {
    if (coupon?.description && coupon.description.includes("1º")) return "SEU 1º PEDIDO";
    return "DESCONTO ESPECIAL";
  });
  const [tagline, setTagline] = useState(() => {
    if (coupon?.description && coupon.description.includes("1º")) return "DESCONTO DE BOAS-VINDAS";
    return "PEÇA HOJE PELO NOSSO CARDÁPIO";
  });
  const [couponCode, setCouponCode] = useState(() => (coupon ? coupon.code : "DELI10"));
  const [discountHighlight, setDiscountHighlight] = useState(() => {
    if (!coupon) return "15% OFF";
    if (coupon.discount_type === "percentage") return `${coupon.discount_value}% OFF`;
    if (coupon.discount_type === "fixed") return `R$ ${(coupon.discount_value / 100).toFixed(2).replace(".", ",")} OFF`;
    return "FRETE GRÁTIS";
  });
  const [minOrderText, setMinOrderText] = useState(() => {
    if (coupon && coupon.min_order_cents > 0) {
      return `Válido para pedidos acima de R$ ${(coupon.min_order_cents / 100).toFixed(2).replace(".", ",")}`;
    }
    return "Válido para pedidos acima de R$ 35,00";
  });
  const [callToAction, setCallToAction] = useState("Peça pelo link na bio ou WhatsApp");

  // Active quick edit dialog target
  const [activeEditTarget, setActiveEditTarget] = useState<EditTarget>(null);

  // Dragging state with move-vs-click discriminator
  const [draggingKey, setDraggingKey] = useState<keyof LayoutPositions | null>(null);
  const dragInfoRef = useRef<{
    key: keyof LayoutPositions | null;
    startY: number;
    startElementY: number;
    hasMoved: boolean;
  }>({
    key: null,
    startY: 0,
    startElementY: 0,
    hasMoved: false
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const [accentColor, setAccentColor] = useState("#CB5A3C");
  const [hueValue, setHueValue] = useState(() => hexToHue("#CB5A3C"));

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveRenderedImageUrl, setLiveRenderedImageUrl] = useState<string | null>(null);

  const cleanStoreLink = `deliplus.com.br/${storeSlug || "sua-loja"}`;
  const [studioChannel, setStudioChannel] = useState<MarketingChannel>("instagram");
  const [studioFormat, setStudioFormat] = useState<MarketingFormat>("feed");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("ig_cravings");

  const buildCaptionTemplate = useCallback((baseText: string) => {
    return baseText
      .replace(/{CODIGO}/g, couponCode)
      .replace(/{DESCONTO}/g, discountHighlight)
      .replace(/{MINIMO}/g, minOrderText)
      .replace(/{LOJA}/g, storeName || "nosso delivery")
      .replace(/{LINK}/g, cleanStoreLink);
  }, [couponCode, discountHighlight, minOrderText, storeName, cleanStoreLink]);

  const [activeCaptionText, setActiveCaptionText] = useState(() =>
    buildCaptionTemplate(INSTAGRAM_TEMPLATES[0].text)
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cached preloaded background image in memory (ELIMINATES FLICKERING!)
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const activeTheme = FOOD_THEMES.find((t) => t.id === selectedThemeId) || FOOD_THEMES[0];

  const activeSocials = socialAccounts.filter((s) => s.enabled);
  const enabledSocialsCount = activeSocials.length;

  const handleAddSocialAccount = (id: string) => {
    if (enabledSocialsCount >= 4) return;
    setSocialAccounts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: true } : s))
    );
  };

  const handleRemoveSocialAccount = (id: string) => {
    setSocialAccounts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: false } : s))
    );
  };

  const handleSocialAccountChange = (id: string, newHandle: string) => {
    setSocialAccounts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, handle: newHandle } : s))
    );
  };

  const handleToggleFormat = (newFormat: "story" | "feed") => {
    setAspectFormat(newFormat);
    setPositions(newFormat === "story" ? DEFAULT_STORY_POSITIONS : DEFAULT_FEED_POSITIONS);
  };

  const handleResetPositions = () => {
    setPositions(aspectFormat === "story" ? DEFAULT_STORY_POSITIONS : DEFAULT_FEED_POSITIONS);
  };

  // Synchronous, flicker-free canvas drawing routine
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectFormat === "story" ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    // 1. Clear background
    ctx.fillStyle = "#121417";
    ctx.fillRect(0, 0, width, height);

    // 2. Draw image or fallback gradient (from memory cache synchronously!)
    const imgBg = bgImageRef.current;
    if (imgBg) {
      const imgAspect = imgBg.width / imgBg.height;
      const canvasAspect = width / height;
      let renderW = width;
      let renderH = height;
      let renderX = 0;
      let renderY = 0;

      if (imgAspect > canvasAspect) {
        renderW = height * imgAspect;
        renderX = (width - renderW) / 2;
      } else {
        renderH = width / imgAspect;
        renderY = (height - renderH) / 2;
      }
      ctx.drawImage(imgBg, renderX, renderY, renderW, renderH);

      // Dark cinematic vignette overlay
      const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
      darkOverlay.addColorStop(0, "rgba(10, 12, 16, 0.65)");
      darkOverlay.addColorStop(0.3, "rgba(10, 12, 16, 0.72)");
      darkOverlay.addColorStop(0.7, "rgba(10, 12, 16, 0.76)");
      darkOverlay.addColorStop(1, "rgba(6, 8, 12, 0.85)");
      ctx.fillStyle = darkOverlay;
      ctx.fillRect(0, 0, width, height);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (selectedThemeId === "grad_forest") {
        bgGrad.addColorStop(0, "#0e1e16");
        bgGrad.addColorStop(1, "#1c3526");
      } else if (selectedThemeId === "grad_dark") {
        bgGrad.addColorStop(0, "#10151f");
        bgGrad.addColorStop(1, "#1e293d");
      } else {
        bgGrad.addColorStop(0, "#26130e");
        bgGrad.addColorStop(1, "#4a1e16");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
      glow.addColorStop(0, `${accentColor}33`);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);
    }

    const isStory = aspectFormat === "story";

    // 3. Top Store Pill Badge
    const storeLabel = (storeName || "DELIPLUS DELIVERY").toUpperCase();
    const storeFontSize = isStory ? 32 : 26;
    ctx.font = `bold ${storeFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    const pillText = `★  ${storeLabel}  ★`;
    const pillWidth = ctx.measureText(pillText).width + 60;
    const pillHeight = isStory ? 58 : 48;
    const pillX = (width - pillWidth) / 2;
    const pillY = (positions.storePillY / 100) * height;

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(pillText, width / 2, pillY + (isStory ? 40 : 33));

    // 4 & 5. Header Group (Tagline & Headline)
    const headerCenterY = (positions.headerGroupY / 100) * height;

    const taglineFontSize = isStory ? 42 : 32;
    ctx.font = `bold ${taglineFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.fillText(tagline.toUpperCase(), width / 2, headerCenterY);

    const headlineFontSize = isStory ? 84 : 70;
    ctx.font = `900 ${headlineFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 6;
    ctx.fillText(headline.toUpperCase(), width / 2, headerCenterY + (isStory ? 80 : 64));
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // 6. Huge Discount Display
    const discountFontSize = isStory ? 134 : 108;
    ctx.font = `900 ${discountFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.shadowColor = `${accentColor}80`;
    ctx.shadowBlur = 40;
    const centerY = (positions.discountY / 100) * height;
    ctx.fillText(discountHighlight, width / 2, centerY);
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // 7. Coupon Ticket Voucher Box
    const ticketW = isStory ? 880 : 860;
    const ticketH = isStory ? 340 : 265;
    const ticketX = (width - ticketW) / 2;
    const ticketY = (positions.ticketY / 100) * height;

    ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 14;
    ctx.beginPath();
    ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 30);
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#CB5A3C";
    ctx.lineWidth = 3.5;
    ctx.setLineDash([14, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    const checkoutTextSize = isStory ? 30 : 26;
    ctx.font = `bold ${checkoutTextSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#6B7280";
    ctx.fillText("USE O CUPOM NO CHECKOUT:", width / 2, ticketY + (isStory ? 62 : 50));

    const codeFontSize = isStory ? 84 : 72;
    ctx.font = `900 ${codeFontSize}px 'Courier New', monospace, sans-serif`;
    ctx.fillStyle = "#111827";
    ctx.fillText(couponCode.toUpperCase(), width / 2, ticketY + (isStory ? 158 : 132));

    const minOrderFontSize = isStory ? 36 : 32;
    ctx.font = `bold ${minOrderFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#374151";
    ctx.fillText(minOrderText, width / 2, ticketY + (isStory ? 232 : 194));

    const subRuleFontSize = isStory ? 28 : 24;
    ctx.font = `600 ${subRuleFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#6B7280";
    ctx.fillText("1 uso por cliente • Não cumulativo com outros cupons", width / 2, ticketY + (isStory ? 292 : 238));

    // 8. Call to Action Button / Pill
    const ctaY = (positions.ctaY / 100) * height;
    const ctaW = isStory ? 760 : 740;
    const ctaH = isStory ? 80 : 70;
    const ctaX = (width - ctaW) / 2;

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();

    const ctaFontSize = isStory ? 36 : 32;
    ctx.font = `bold ${ctaFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`👉 ${callToAction.toUpperCase()}`, width / 2, ctaY + (isStory ? 52 : 45));

    // 9 & 10. Link e Redes Sociais
    const socialsBaseY = (positions.socialsY / 100) * height;

    const linkFontSize = isStory ? 36 : 30;
    ctx.font = `bold ${linkFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = "#E5E7EB";
    ctx.fillText(`deliplus.com.br/${storeSlug || "sua-loja"}`, width / 2, socialsBaseY);

    const visibleSocials = socialAccounts.filter((s) => s.enabled).slice(0, 4);

    if (visibleSocials.length > 0) {
      const logoSize = isStory ? 32 : 24;
      const fontTextSize = isStory ? 26 : 21;
      ctx.font = `bold ${fontTextSize}px system-ui, -apple-system, sans-serif`;

      const isMultiRow = visibleSocials.length > 2;
      const rows = isMultiRow
        ? [visibleSocials.slice(0, 2), visibleSocials.slice(2, 4)]
        : [visibleSocials];

      const rowHeight = isStory ? 52 : 42;
      const rowGap = isStory ? 12 : 8;
      const startY = socialsBaseY + (isStory ? 30 : 22);

      rows.forEach((rowSocials, rIdx) => {
        const currentY = startY + rIdx * (rowHeight + rowGap);

        const pillMetrics = rowSocials.map((soc) => {
          const txt = soc.handle.trim() || soc.name;
          const textW = ctx.measureText(txt).width;
          const pillW = logoSize + textW + (isStory ? 36 : 28);
          return { soc, txt, pillW };
        });

        const totalRowW =
          pillMetrics.reduce((acc, p) => acc + p.pillW, 0) +
          (rowSocials.length - 1) * (isStory ? 18 : 12);
        let currentX = width / 2 - totalRowW / 2;

        pillMetrics.forEach(({ soc, txt, pillW }) => {
          ctx.fillStyle = "rgba(0, 0, 0, 0.68)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(currentX, currentY, pillW, rowHeight, rowHeight / 2);
          ctx.fill();
          ctx.stroke();

          const logoPadding = isStory ? 10 : 8;
          const logoX = currentX + logoPadding;
          const logoY = currentY + (rowHeight - logoSize) / 2;
          drawBrandLogo(ctx, soc.id, logoX, logoY, logoSize);

          ctx.fillStyle = "#FFFFFF";
          ctx.textAlign = "left";
          const textX = logoX + logoSize + (isStory ? 10 : 8);
          const textY = currentY + rowHeight / 2 + fontTextSize * 0.35;
          ctx.fillText(txt, textX, textY);

          currentX += pillW + (isStory ? 18 : 12);
        });
      });
    }

    // 11. Marca d'água DeliPlus
    const waterFontSize = isStory ? 32 : 24;
    ctx.font = `bold ${waterFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    const waterText = "✦ Criado com DeliPlus  •  www.deliplus.com.br ✦";
    const waterPillWidth = ctx.measureText(waterText).width + 64;
    const waterPillHeight = isStory ? 64 : 50;
    const waterPillX = (width - waterPillWidth) / 2;
    const waterPillY = isStory ? 1810 : 1010;

    ctx.fillStyle = "rgba(0, 0, 0, 0.82)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.36)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(waterPillX, waterPillY, waterPillWidth, waterPillHeight, waterPillHeight / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(waterText, width / 2, waterPillY + (isStory ? 43 : 33));
  }, [
    aspectFormat,
    selectedThemeId,
    headline,
    tagline,
    couponCode,
    discountHighlight,
    minOrderText,
    callToAction,
    accentColor,
    socialAccounts,
    storeName,
    storeSlug,
    positions
  ]);

  // Synchronize snapshot for copy studio / export (only when needed, not on every drag frame!)
  const syncSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setLiveRenderedImageUrl(dataUrl);
    } catch {
      // Ignore CORS local issues if any
    }
  }, []);

  // Preload background image ONCE when source changes (ELIMINATES FLICKERING!)
  useEffect(() => {
    const targetImageSrc = customImageSrc || activeTheme.imageUrl;
    if (!targetImageSrc) {
      bgImageRef.current = null;
      drawCanvas();
      syncSnapshot();
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      bgImageRef.current = img;
      drawCanvas();
      syncSnapshot();
    };
    img.onerror = () => {
      bgImageRef.current = null;
      drawCanvas();
      syncSnapshot();
    };
    img.src = targetImageSrc;
  }, [customImageSrc, selectedThemeId, activeTheme.imageUrl, drawCanvas, syncSnapshot]);

  // Redraw canvas smoothly on state/positions change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Open edit dialog for clicked element
  const openEditorForBlock = (key: keyof LayoutPositions) => {
    if (key === "headerGroupY") setActiveEditTarget("header");
    else if (key === "discountY") setActiveEditTarget("discount");
    else if (key === "ticketY") setActiveEditTarget("ticket");
    else if (key === "ctaY") setActiveEditTarget("cta");
  };

  // Pointer Down: Setup drag without cancelling click!
  const handleBlockPointerDown = (key: keyof LayoutPositions, e: React.PointerEvent) => {
    // If clicking an edit button, let it trigger click directly
    if ((e.target as HTMLElement).closest("button")) return;

    dragInfoRef.current = {
      key,
      startY: e.clientY,
      startElementY: positions[key],
      hasMoved: false
    };
  };

  // Pointer Move: Only start dragging if moved > 4px
  const handleContainerPointerMove = (e: React.PointerEvent) => {
    const info = dragInfoRef.current;
    if (!info.key || !canvasContainerRef.current) return;

    const distY = Math.abs(e.clientY - info.startY);
    if (distY > 4) {
      info.hasMoved = true;
      if (draggingKey !== info.key) {
        setDraggingKey(info.key);
      }
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const deltaY = ((e.clientY - info.startY) / rect.height) * 100;
      const newY = Math.min(Math.max(info.startElementY + deltaY, 6), 92);

      setPositions((prev) => ({
        ...prev,
        [info.key!]: Math.round(newY * 10) / 10
      }));
    }
  };

  // Pointer Up: If didn't move, it's a CLICK!
  const handleContainerPointerUp = () => {
    const info = dragInfoRef.current;
    if (!info.key) return;

    const wasDragging = info.hasMoved;
    const targetKey = info.key;

    dragInfoRef.current.key = null;
    setDraggingKey(null);

    if (!wasDragging) {
      openEditorForBlock(targetKey);
    } else {
      syncSnapshot();
    }
  };

  // Custom User Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomImageSrc(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Download high-resolution PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    setTimeout(() => {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        const safeCode = couponCode.toLowerCase().replace(/[^a-z0-9]/g, "-");
        link.download = `cupom-${safeCode}-${aspectFormat}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("Erro ao baixar imagem:", err);
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaptionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleOpenWhatsAppShare = () => {
    const encoded = encodeURIComponent(activeCaptionText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const insertTagIntoCaption = (tag: string) => {
    setActiveCaptionText((prev) => `${prev} ${tag}`);
  };

  const currentTemplates =
    studioChannel === "instagram"
      ? INSTAGRAM_TEMPLATES
      : studioChannel === "facebook"
      ? FACEBOOK_TEMPLATES
      : WHATSAPP_TEMPLATES;

  const availableSocialsToAdd = socialAccounts.filter((s) => !s.enabled);

  const handleSelectChannel = (channel: MarketingChannel) => {
    setStudioChannel(channel);
    let templates: CaptionTemplateItem[] = INSTAGRAM_TEMPLATES;
    let defaultFormat: MarketingFormat = "feed";

    if (channel === "facebook") {
      templates = FACEBOOK_TEMPLATES;
      defaultFormat = "feed";
    } else if (channel === "whatsapp") {
      templates = WHATSAPP_TEMPLATES;
      defaultFormat = "chat";
    }

    const firstTemplate = templates[0];
    setSelectedTemplateId(firstTemplate.id);
    setActiveCaptionText(buildCaptionTemplate(firstTemplate.text));
    setStudioFormat(defaultFormat);

    if (defaultFormat === "feed") {
      setAspectFormat("feed");
    }
  };

  const handleSelectFormat = (format: MarketingFormat) => {
    setStudioFormat(format);
    if (format === "story") {
      handleToggleFormat("story");
    } else if (format === "feed") {
      handleToggleFormat("feed");
    }
    const matchedTmpl = currentTemplates.find((t) => t.format === format);
    if (matchedTmpl) {
      setSelectedTemplateId(matchedTmpl.id);
      setActiveCaptionText(buildCaptionTemplate(matchedTmpl.text));
    }
  };

  return (
    <div className="bg-[#FAF9F5] dark:bg-[#131A15] border border-[#E3E1D9] dark:border-[#2A382E] rounded-2xl w-full max-w-6xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-[#1B241E] border-b border-[#ECEAE2] dark:border-[#2A382E]">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#1A241E] dark:text-[#F2EFE9] leading-tight">
            Estúdio de Criação DeliPlus
          </h2>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md bg-[#FAF0ED] text-[#CB5A3C] text-[11px] font-bold">
            Edição Direta na Arte
          </span>
        </div>

        {/* Studio Sub-Pages Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#F4F3EE] dark:bg-[#161F18] p-1 rounded-xl border border-[#EAE8E0] dark:border-[#2A382E]">
            <button
              type="button"
              onClick={() => setActiveTab("design")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "design"
                  ? "bg-white text-[#2E4233] shadow-xs"
                  : "text-[#637267] hover:text-[#1A241E]"
              }`}
            >
              <Sparkles size={14} className={activeTab === "design" ? "text-[#CB5A3C]" : ""} />
              <span>1. Design da Arte</span>
            </button>
            <button
              type="button"
              onClick={() => {
                syncSnapshot();
                setActiveTab("copy_studio");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "copy_studio"
                  ? "bg-white text-[#2E4233] shadow-xs"
                  : "text-[#637267] hover:text-[#1A241E]"
              }`}
            >
              <PenTool size={14} className={activeTab === "copy_studio" ? "text-[#CB5A3C]" : ""} />
              <span>2. Estúdio de Legendas</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#25332A] rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DESIGN DA ARTE (CANVA STYLE DIRECT EDITING & DRAGGING)    */}
      {/* ============================================================== */}
      <div className={`flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 ${activeTab === "design" ? "" : "hidden"}`}>
        {/* LEFT / CENTER: The Hero Interactive Artwork (Canva Space) */}
        <div
          className="lg:col-span-8 bg-[#121614] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#242A27] min-h-[520px] select-none"
          onPointerMove={handleContainerPointerMove}
          onPointerUp={handleContainerPointerUp}
        >
          {/* Format and Tool Controls */}
          <div className="flex items-center justify-between w-full max-w-[420px] mb-3">
            <div className="flex items-center gap-1 bg-[#1C221F] p-1 rounded-xl border border-[#2D3631]">
              <button
                type="button"
                onClick={() => handleToggleFormat("story")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  aspectFormat === "story"
                    ? "bg-[#CB5A3C] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone size={13} />
                <span>Story (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleFormat("feed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  aspectFormat === "feed"
                    ? "bg-[#CB5A3C] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Square size={13} />
                <span>Feed (1:1)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetPositions}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white bg-[#1C221F] hover:bg-[#252E2A] px-2.5 py-1.5 rounded-xl border border-[#2D3631] transition-colors cursor-pointer"
              title="Restaurar posições originais de fábrica"
            >
              <RotateCcw size={12} />
              <span>Resetar Posições</span>
            </button>
          </div>

          {/* Interactive Canva Workspace Container */}
          <div
            ref={canvasContainerRef}
            className="relative flex items-center justify-center w-full max-w-[360px] shadow-2xl rounded-2xl overflow-hidden border-2 border-white/15 bg-black"
            style={{
              maxHeight: aspectFormat === "story" ? "560px" : "360px"
            }}
          >
            {/* The Raw Canvas (Visual Layer) */}
            <canvas
              ref={canvasRef}
              className="w-full h-auto object-contain block rounded-2xl pointer-events-none"
            />

            {/* THE CANVA INTERACTIVE OVERLAY: Click to Edit + Drag Layer */}
            <div className="absolute inset-0 z-20 pointer-events-auto overflow-hidden">
              {/* 1. Header Group (Tagline & Headline) */}
              <div
                style={{ top: `${positions.headerGroupY}%` }}
                onPointerDown={(e) => handleBlockPointerDown("headerGroupY", e)}
                className={`absolute left-2 right-2 -translate-y-1/2 flex flex-col items-center justify-center px-2 py-1.5 group rounded-xl transition-all ${
                  draggingKey === "headerGroupY"
                    ? "ring-2 ring-[#CB5A3C] ring-dashed bg-black/50 cursor-grabbing"
                    : "hover:ring-1 hover:ring-[#CB5A3C]/80 hover:ring-dashed hover:bg-black/30 cursor-pointer"
                }`}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-2 mb-1 pointer-events-none shadow-lg">
                  <span className="flex items-center gap-1 text-[#CB5A3C]">
                    <Edit3 size={11} />
                    Clique para editar
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <Move size={11} />
                    Arraste ↕
                  </span>
                </div>
                <div className="w-full h-12" />
              </div>

              {/* 2. Discount Highlight */}
              <div
                style={{ top: `${positions.discountY}%` }}
                onPointerDown={(e) => handleBlockPointerDown("discountY", e)}
                className={`absolute left-2 right-2 -translate-y-1/2 flex flex-col items-center justify-center px-2 py-1.5 group rounded-xl transition-all ${
                  draggingKey === "discountY"
                    ? "ring-2 ring-[#CB5A3C] ring-dashed bg-black/50 cursor-grabbing"
                    : "hover:ring-1 hover:ring-[#CB5A3C]/80 hover:ring-dashed hover:bg-black/30 cursor-pointer"
                }`}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-2 mb-1 pointer-events-none shadow-lg">
                  <span className="flex items-center gap-1 text-[#CB5A3C]">
                    <Edit3 size={11} />
                    Clique para trocar desconto
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <Move size={11} />
                    Arraste ↕
                  </span>
                </div>
                <div className="w-full h-12" />
              </div>

              {/* 3. Coupon Ticket Voucher */}
              <div
                style={{ top: `${positions.ticketY}%` }}
                onPointerDown={(e) => handleBlockPointerDown("ticketY", e)}
                className={`absolute left-3 right-3 flex flex-col items-center justify-center p-2 group rounded-2xl transition-all ${
                  draggingKey === "ticketY"
                    ? "ring-2 ring-[#CB5A3C] ring-dashed bg-white/20 cursor-grabbing"
                    : "hover:ring-1 hover:ring-[#CB5A3C]/80 hover:ring-dashed hover:bg-black/20 cursor-pointer"
                }`}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/85 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-2 mb-1 pointer-events-none shadow-lg">
                  <span className="flex items-center gap-1 text-[#CB5A3C]">
                    <Edit3 size={11} />
                    Clique para alterar cupom/regras
                  </span>
                  <span className="text-white/50">•</span>
                  <span className="flex items-center gap-1 text-gray-300">
                    <Move size={11} />
                    Arraste ↕
                  </span>
                </div>
                <div className="w-full h-20" />
              </div>

              {/* 4. Call to Action Pill */}
              <div
                style={{ top: `${positions.ctaY}%` }}
                onPointerDown={(e) => handleBlockPointerDown("ctaY", e)}
                className={`absolute left-4 right-4 flex flex-col items-center justify-center p-1 group rounded-full transition-all ${
                  draggingKey === "ctaY"
                    ? "ring-2 ring-white ring-dashed bg-black/40 cursor-grabbing"
                    : "hover:ring-1 hover:ring-white/80 hover:ring-dashed hover:bg-black/25 cursor-pointer"
                }`}
              >
                <div className="w-full h-8" />
              </div>

              {/* 5. Socials & Link (Draggable footer) */}
              <div
                style={{ top: `${positions.socialsY}%` }}
                onPointerDown={(e) => handleBlockPointerDown("socialsY", e)}
                className={`absolute left-2 right-2 flex flex-col items-center justify-center p-1 group rounded-xl transition-all ${
                  draggingKey === "socialsY"
                    ? "ring-2 ring-white/60 ring-dashed bg-black/40 cursor-grabbing"
                    : "hover:ring-1 hover:ring-white/40 hover:ring-dashed hover:bg-black/25 cursor-grab"
                }`}
              >
                <div className="w-full h-10" />
              </div>
            </div>

            {/* DIRECT EDITING POPUP MODAL (Opens instantly on click!) */}
            {activeEditTarget && (
              <div
                className="absolute inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setActiveEditTarget(null);
                }}
              >
                <div className="bg-white dark:bg-[#1B241E] rounded-2xl p-4 sm:p-5 shadow-2xl border border-gray-200 dark:border-[#2A382E] w-full max-w-[320px] text-gray-950 dark:text-[#F2EFE9] space-y-3">
                  {/* EDIT TARGET 1: HEADER (TAGLINE + HEADLINE) */}
                  {activeEditTarget === "header" && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-[#F2EFE9]">
                          Editar Título e Subtítulo
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveEditTarget(null)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Subtítulo / Tagline
                        </label>
                        <input
                          autoFocus
                          type="text"
                          value={tagline}
                          onChange={(e) => setTagline(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-1.5 text-xs font-medium border border-gray-300 dark:border-[#2A382E] bg-white dark:bg-[#161F18] text-gray-900 dark:text-[#F2EFE9] rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Título Principal
                        </label>
                        <input
                          type="text"
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-1.5 text-xs font-bold border border-gray-300 rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>
                    </>
                  )}

                  {/* EDIT TARGET 2: DISCOUNT HIGHLIGHT */}
                  {activeEditTarget === "discount" && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-gray-900">
                          Editar Destaque do Desconto
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveEditTarget(null)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Texto do Desconto
                        </label>
                        <input
                          autoFocus
                          type="text"
                          value={discountHighlight}
                          onChange={(e) => setDiscountHighlight(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-2 text-base font-black text-[#CB5A3C] text-center border border-gray-300 rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>

                      {/* Quick chips */}
                      <div>
                        <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                          Atalhos Rápidos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {["10% OFF", "15% OFF", "20% OFF", "FRETE GRÁTIS", "R$ 10 OFF"].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setDiscountHighlight(opt)}
                              className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-[#FAF0ED] hover:text-[#CB5A3C] text-[11px] font-bold text-gray-700 transition-colors"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* EDIT TARGET 3: TICKET VOUCHER */}
                  {activeEditTarget === "ticket" && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-gray-900">
                          Editar Cupom e Regra
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveEditTarget(null)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Código do Cupom
                        </label>
                        <input
                          autoFocus
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-1.5 text-sm font-mono font-black text-gray-950 text-center border border-gray-300 rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Regra de Pedido Mínimo
                        </label>
                        <input
                          type="text"
                          value={minOrderText}
                          onChange={(e) => setMinOrderText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-1.5 text-xs font-medium text-gray-800 border border-gray-300 rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>
                    </>
                  )}

                  {/* EDIT TARGET 4: CALL TO ACTION */}
                  {activeEditTarget === "cta" && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-xs font-bold text-gray-900">
                          Editar Chamada de Ação
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveEditTarget(null)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 dark:text-[#9CA79E] block mb-1">
                          Texto do Botão
                        </label>
                        <input
                          autoFocus
                          type="text"
                          value={callToAction}
                          onChange={(e) => setCallToAction(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && setActiveEditTarget(null)}
                          className="w-full px-3 py-1.5 text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-[#CB5A3C]"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveEditTarget(null)}
                    className="w-full py-2 rounded-xl bg-[#2E4233] hover:bg-[#243428] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer mt-1"
                  >
                    ✓ Concluir Edição
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canva Studio Helper Tip */}
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-300 bg-[#1C221F] px-3.5 py-1.5 rounded-full border border-[#2D3631]">
            <Edit3 size={13} className="text-[#CB5A3C]" />
            <span>
              <strong>Modo Direto:</strong> Clique em qualquer texto para editar ou arraste verticalmente para posicionar.
            </span>
          </div>
        </div>

        {/* RIGHT: Lean & Clean Quick Inspector (No cluttered form!) */}
        <div className="lg:col-span-4 p-5 space-y-4 overflow-y-auto bg-white dark:bg-[#1B241E] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Quick Text Shortcut Chips (Easy one-click access) */}
            <div>
              <label className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9] block mb-1.5">
                Textos Rápidos da Arte (Clique para editar)
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveEditTarget("header")}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] hover:border-[#CB5A3C] text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-gray-500 dark:text-[#9CA79E] font-semibold block">Título:</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-[#F2EFE9] truncate block">
                    {headline}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEditTarget("discount")}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] hover:border-[#CB5A3C] text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-gray-500 dark:text-[#9CA79E] font-semibold block">Desconto:</span>
                  <span className="text-xs font-black text-[#CB5A3C] truncate block">
                    {discountHighlight}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEditTarget("ticket")}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] hover:border-[#CB5A3C] text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-gray-500 dark:text-[#9CA79E] font-semibold block">Cupom:</span>
                  <span className="text-xs font-mono font-bold text-gray-900 dark:text-[#F2EFE9] truncate block">
                    {couponCode}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveEditTarget("cta")}
                  className="p-2 rounded-xl border border-gray-200 dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] hover:border-[#CB5A3C] text-left transition-colors cursor-pointer"
                >
                  <span className="text-[10px] text-gray-500 dark:text-[#9CA79E] font-semibold block">Botão / CTA:</span>
                  <span className="text-xs font-bold text-gray-900 dark:text-[#F2EFE9] truncate block">
                    {callToAction}
                  </span>
                </button>
              </div>
            </div>

            {/* 1. Fundo da Arte */}
            <div className="border-t border-[#ECEAE2] dark:border-[#2A382E] pt-3.5">
              <label className="text-xs font-bold text-[#1A241E] block mb-1.5">
                1. Fundo da Arte
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <select
                    value={customImageSrc ? "custom" : selectedThemeId}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        fileInputRef.current?.click();
                      } else {
                        setSelectedThemeId(e.target.value);
                        setCustomImageSrc(null);
                        const found = FOOD_THEMES.find((t) => t.id === e.target.value);
                        if (found) {
                          setAccentColor(found.accentColor);
                          setHueValue(hexToHue(found.accentColor));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#161F18] border border-[#E3E1D9] dark:border-[#2A382E] rounded-xl text-xs font-semibold text-[#1A241E] dark:text-[#F2EFE9] focus:outline-none focus:border-[#CB5A3C] cursor-pointer"
                  >
                    <optgroup label="Nichos de Alimentação">
                      {FOOD_THEMES.filter((t) => t.category !== "Cores da Marca").map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name} — {theme.category}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Cores e Gradientes da Marca">
                      {FOOD_THEMES.filter((t) => t.category === "Cores da Marca").map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </optgroup>
                    {customImageSrc && (
                      <option value="custom">Imagem própria enviada</option>
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CB5A3C]/40 bg-[#FAF0ED] text-[#CB5A3C] text-xs font-bold hover:bg-[#FBE8E4] transition-colors cursor-pointer shrink-0"
                >
                  <Upload size={13} />
                  <span>Foto</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {customImageSrc && (
                <div className="mt-1.5 p-1.5 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between text-xs">
                  <span className="text-orange-800 font-medium flex items-center gap-1 text-[11px]">
                    <ImageIcon size={12} />
                    Foto personalizada ativa
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomImageSrc(null)}
                    className="text-[11px] text-red-600 hover:underline font-bold"
                  >
                    Remover
                  </button>
                </div>
              )}
            </div>

            {/* 2. Redes Sociais no Rodapé */}
            <div className="border-t border-[#ECEAE2] dark:border-[#2A382E] pt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                  2. Redes Sociais no Rodapé
                </label>
                <span className="text-[11px] font-bold text-gray-500">
                  {enabledSocialsCount}/4 ativas
                </span>
              </div>

              <div className="space-y-1.5">
                {activeSocials.map((soc) => (
                  <div
                    key={soc.id}
                    className="flex items-center gap-2 p-1.5 rounded-xl border border-[#D5D0C0] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A]"
                  >
                    <BrandIconBadge id={soc.id} size={18} />

                    <span className="text-[11px] font-bold text-[#1A241E] dark:text-[#F2EFE9] w-18 shrink-0">
                      {soc.name}
                    </span>

                    <input
                      type="text"
                      value={soc.handle}
                      onChange={(e) => handleSocialAccountChange(soc.id, e.target.value)}
                      placeholder={`Ex: @${storeSlug || "sualoja"}`}
                      className="flex-1 px-2 py-0.5 text-xs border border-[#D5D0C0] dark:border-[#2A382E] rounded-lg bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] font-medium focus:outline-none focus:border-[#CB5A3C]"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveSocialAccount(soc.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}

                {enabledSocialsCount < 4 && availableSocialsToAdd.length > 0 && (
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddSocialAccount(e.target.value);
                        }
                      }}
                      className="w-full py-1.5 px-3 bg-[#FAF0ED]/70 hover:bg-[#FAF0ED] text-[#CB5A3C] border border-dashed border-[#CB5A3C]/50 rounded-xl text-xs font-bold text-center cursor-pointer transition-colors focus:outline-none appearance-none"
                    >
                      <option value="" disabled>
                        + Adicionar Rede Social ({enabledSocialsCount}/4)
                      </option>
                      {availableSocialsToAdd.map((s) => (
                        <option key={s.id} value={s.id} className="text-[#1A241E] font-medium">
                          + {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#CB5A3C]">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Cor de Destaque Interativa */}
            <div className="border-t border-[#ECEAE2] pt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1A241E] flex items-center gap-1.5">
                  <Sliders size={13} className="text-[#CB5A3C]" />
                  <span>3. Cor da Identidade</span>
                </label>

                <div className="flex items-center gap-1.5 bg-[#FAF8F0] dark:bg-[#25332A] border border-[#E3E1D9] dark:border-[#2A382E] px-2 py-0.5 rounded-lg">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setHueValue(hexToHue(e.target.value));
                    }}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] font-bold text-gray-800 dark:text-[#F2EFE9] uppercase">
                    {accentColor}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="360"
                value={hueValue}
                onChange={(e) => {
                  const h = Number(e.target.value);
                  setHueValue(h);
                  setAccentColor(hslToHex(h, 92, 50));
                }}
                className="w-full h-3 rounded-full appearance-none cursor-pointer border border-black/10 shadow-inner"
                style={{
                  background:
                    "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                }}
              />
            </div>
          </div>

          {/* Action: Download High Res PNG */}
          <div className="border-t border-[#ECEAE2] dark:border-[#2A382E] pt-4">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>{isGenerating ? "Exportando PNG..." : "Baixar Arte PNG em Alta Resolução"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 2: ESTÚDIO DE LEGENDAS (MULTI-REDE SOCIAL & MOCKUPS REAIS) */}
      {/* ============================================================== */}
      <div className={`flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 ${activeTab === "copy_studio" ? "" : "hidden"}`}>
        <div className="lg:col-span-5 bg-[#171A18] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#242A27] min-h-[440px] overflow-y-auto">
          {/* MOCKUP 1: INSTAGRAM FEED (1:1) */}
          {studioChannel === "instagram" && studioFormat === "feed" && (
            <div className="w-full max-w-[330px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-[#111827]">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#CB5A3C] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {storeName ? storeName.slice(0, 1).toUpperCase() : "D"}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold leading-tight">{storeSlug || "sualoja"}</div>
                    <div className="text-[10px] text-gray-500">Patrocinado • Delivery</div>
                  </div>
                </div>
                <span className="text-gray-400 font-bold text-xs tracking-widest">•••</span>
              </div>

              <div className="relative aspect-square bg-[#0c0e0d] flex items-center justify-center overflow-hidden">
                {liveRenderedImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={liveRenderedImageUrl}
                    alt="Arte do post"
                    className="w-full h-full object-contain block"
                  />
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs">
                    Carregando arte...
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1.5 text-[12px]">
                <div className="flex items-center justify-between text-gray-700">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm">♡</span>
                    <span className="font-bold text-sm">💬</span>
                    <span className="font-bold text-sm">↗</span>
                  </div>
                  <span className="font-bold text-sm">🔖</span>
                </div>

                <div className="font-semibold text-[11px] text-gray-900">
                  Curtido por clientes e outras pessoas
                </div>

                <div className="text-[11.5px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words max-h-44 overflow-y-auto">
                  <span className="font-bold mr-1.5">{storeSlug || "sualoja"}</span>
                  {activeCaptionText}
                </div>
              </div>
            </div>
          )}

          {/* MOCKUP 2: INSTAGRAM & FACEBOOK STORY / REELS (9:16) */}
          {((studioChannel === "instagram" && studioFormat === "story") ||
            (studioChannel === "facebook" && studioFormat === "story") ||
            (studioChannel === "whatsapp" && studioFormat === "story")) && (
            <div className="relative w-[265px] aspect-[9/16] bg-black rounded-[32px] overflow-hidden border-[5px] border-[#2A2E2C] shadow-2xl flex flex-col justify-between">
              {liveRenderedImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={liveRenderedImageUrl}
                  alt="Story preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
                  Carregando arte do Story...
                </div>
              )}

              <div className="relative z-10 p-3 pt-3.5 bg-gradient-to-b from-black/70 via-black/30 to-transparent space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  <div className="h-0.5 bg-white rounded-full"></div>
                  <div className="h-0.5 bg-white/40 rounded-full"></div>
                  <div className="h-0.5 bg-white/40 rounded-full"></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                        {storeName ? storeName.slice(0, 1).toUpperCase() : "D"}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-white shadow-xs drop-shadow-sm">
                      {storeSlug || "sualoja"}
                    </span>
                    <span className="text-[10px] text-white/70">12 min</span>
                  </div>
                  <span className="text-white text-xs font-bold">✕</span>
                </div>
              </div>

              <div className="relative z-10 flex justify-center px-4">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 text-[11px] font-bold text-gray-900 border border-white">
                  <ExternalLink size={12} className="text-[#CB5A3C]" />
                  <span>{cleanStoreLink}</span>
                </div>
              </div>

              <div className="relative z-10 p-3 pb-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center gap-2">
                <div className="flex-1 py-1.5 px-3 rounded-full border border-white/40 bg-black/40 text-white/80 text-[11px]">
                  Enviar mensagem...
                </div>
                <div className="text-white text-base">♡</div>
                <div className="text-white text-base">↗</div>
              </div>
            </div>
          )}

          {/* MOCKUP 3: FACEBOOK FEED POST (1:1) */}
          {studioChannel === "facebook" && studioFormat === "feed" && (
            <div className="w-full max-w-[330px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-[#111827]">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    {storeName ? storeName.slice(0, 1).toUpperCase() : "D"}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-gray-900 leading-tight">
                      {storeName || "DeliPlus"}
                    </div>
                    <div className="text-[10px] text-gray-500">Publicado agora • 🌐</div>
                  </div>
                </div>
                <span className="text-gray-400 font-bold text-xs tracking-widest">•••</span>
              </div>

              <div className="px-3.5 py-2 text-[11.5px] text-gray-800 leading-relaxed whitespace-pre-wrap break-words max-h-28 overflow-y-auto border-b border-gray-50">
                {activeCaptionText}
              </div>

              <div className="relative aspect-square bg-[#0c0e0d] flex items-center justify-center overflow-hidden">
                {liveRenderedImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={liveRenderedImageUrl}
                    alt="Facebook arte"
                    className="w-full h-full object-contain block"
                  />
                )}
              </div>

              <div className="px-3 py-2 flex items-center justify-between text-[11px] text-gray-500 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-xs">👍❤️</span>
                  <span>48 curtidas</span>
                </div>
                <span>6 comentários</span>
              </div>

              <div className="grid grid-cols-3 text-center py-2 text-[11px] font-semibold text-gray-600">
                <button type="button" className="flex items-center justify-center gap-1">
                  <ThumbsUp size={13} />
                  <span>Curtir</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-1">
                  <MessageSquare size={13} />
                  <span>Comentar</span>
                </button>
                <button type="button" className="flex items-center justify-center gap-1">
                  <Share2 size={13} />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>
          )}

          {/* MOCKUP 4: WHATSAPP CHAT CONVERSATION */}
          {studioChannel === "whatsapp" && studioFormat === "chat" && (
            <div className="w-full max-w-[330px] rounded-2xl shadow-2xl border border-gray-300 overflow-hidden bg-[#ECE5DD] flex flex-col text-[#111827]">
              <div className="bg-[#008069] text-white px-3 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-xs">←</span>
                  <div className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-bold border border-white/30">
                    {storeName ? storeName.slice(0, 1).toUpperCase() : "D"}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold leading-tight">{storeName || "DeliPlus"}</div>
                    <div className="text-[9.5px] text-emerald-100">online</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white text-xs">
                  <span>📹</span>
                  <span>📞</span>
                  <span>⋮</span>
                </div>
              </div>

              <div className="p-3 space-y-2 flex-1 min-h-[300px] flex flex-col justify-end">
                <div className="flex justify-center mb-1">
                  <span className="bg-white/80 backdrop-blur-xs text-[10px] font-semibold text-gray-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                    HOJE
                  </span>
                </div>

                <div className="self-end max-w-[92%] bg-[#E7FFDB] rounded-2xl rounded-tr-xs p-2 shadow-xs border border-[#C5E8B7] text-[#111827]">
                  {liveRenderedImageUrl && (
                    <div className="rounded-xl overflow-hidden mb-2 bg-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={liveRenderedImageUrl}
                        alt="Arte cupom"
                        className="w-full max-h-[180px] object-cover block"
                      />
                    </div>
                  )}

                  <div className="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-gray-900">
                    {renderWhatsAppFormattedText(activeCaptionText)}
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-1 text-[9.5px] text-gray-500">
                    <span>14:32</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F0F2F5] px-2.5 py-2 flex items-center gap-2 border-t border-gray-200">
                <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-gray-400 border border-gray-200 flex items-center justify-between">
                  <span>Mensagem</span>
                  <span className="text-gray-400">📎</span>
                </div>
                <div className="w-7 h-7 rounded-full bg-[#00A884] text-white flex items-center justify-center text-xs shadow-xs">
                  🎙️
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400 text-center">
            <Share2 size={12} className="text-[#CB5A3C]" />
            <span>
              Mockup realista para <strong>{studioChannel.toUpperCase()}</strong> ({studioFormat})
            </span>
          </div>
        </div>

        {/* RIGHT: Studio Controls, Channel Switcher & Templates */}
        <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 overflow-y-auto bg-white dark:bg-[#1B241E]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                1. Escolha a Rede Social & Formato de Publicação
              </label>
              <span className="text-[11px] text-[#CB5A3C] font-semibold">
                Padronizado para Marketing
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectChannel("instagram")}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  studioChannel === "instagram"
                    ? "border-[#E1306C] bg-[#FFF0F5] text-[#E1306C] ring-1 ring-[#E1306C] shadow-2xs"
                    : "border-[#ECEAE2] bg-[#FAF8F0] text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BrandIconBadge id="instagram" size={16} />
                <span>Instagram</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChannel("facebook")}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  studioChannel === "facebook"
                    ? "border-[#1877F2] bg-[#F0F5FF] text-[#1877F2] ring-1 ring-[#1877F2] shadow-2xs"
                    : "border-[#ECEAE2] bg-[#FAF8F0] text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BrandIconBadge id="facebook" size={16} />
                <span>Facebook</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectChannel("whatsapp")}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  studioChannel === "whatsapp"
                    ? "border-[#25D366] bg-[#F0FFF4] text-[#1D994B] ring-1 ring-[#25D366] shadow-2xs"
                    : "border-[#ECEAE2] bg-[#FAF8F0] text-gray-700 hover:bg-gray-100"
                }`}
              >
                <BrandIconBadge id="whatsapp" size={16} />
                <span>WhatsApp</span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-[#637267] dark:text-[#9CA79E]">Destino:</span>

              {studioChannel === "instagram" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("feed")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "feed"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Feed / Postagem (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("story")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "story"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Story / Reels (9:16)
                  </button>
                </>
              )}

              {studioChannel === "facebook" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("feed")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "feed"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Feed / Postagem (1:1)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("story")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "story"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Story (9:16)
                  </button>
                </>
              )}

              {studioChannel === "whatsapp" && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("chat")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "chat"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Conversa / Chat Direto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectFormat("story")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studioFormat === "story"
                        ? "bg-[#1A241E] text-white shadow-xs"
                        : "bg-[#F4F3EE] text-[#637267] hover:text-[#1A241E]"
                    }`}
                  >
                    Status (9:16)
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-[#ECEAE2] pt-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12.5px] font-bold text-[#1A241E]">
                2. Modelos de Texto para {studioChannel === "instagram" ? "Instagram" : studioChannel === "facebook" ? "Facebook" : "WhatsApp"}
              </label>
              <span className="text-[11px] text-[#637267]">
                Clique para carregar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {currentTemplates.map((tmpl) => {
                const isSelected = selectedTemplateId === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setActiveCaptionText(buildCaptionTemplate(tmpl.text));
                      if (tmpl.format === "story") {
                        handleToggleFormat("story");
                        setStudioFormat("story");
                      } else if (tmpl.format === "feed") {
                        handleToggleFormat("feed");
                        setStudioFormat("feed");
                      } else if (tmpl.format === "chat") {
                        setStudioFormat("chat");
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#CB5A3C] bg-[#FAF0ED] ring-1 ring-[#CB5A3C]"
                        : "border-[#ECEAE2] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#161F18] hover:bg-gray-100 dark:hover:bg-[#25332A]"
                    }`}
                  >
                    <div className="text-[12px] font-bold text-[#1A241E] dark:text-[#F2EFE9] truncate">
                      {tmpl.title}
                    </div>
                    <div className="text-[10px] text-[#637267] dark:text-[#9CA79E] truncate mt-0.5">
                      {tmpl.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#ECEAE2] dark:border-[#2A382E] pt-3">
            <label className="text-[11.5px] font-bold text-[#1A241E] dark:text-[#F2EFE9] block mb-1">
              Inserir Variáveis com 1 Clique:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "+ Cupom", value: `*${couponCode}*` },
                { label: "+ Desconto", value: `*${discountHighlight}*` },
                { label: "+ Mínimo", value: minOrderText },
                { label: "+ Link", value: cleanStoreLink },
                { label: "🍔", value: "🍔" },
                { label: "🍕", value: "🍕" },
                { label: "🍟", value: "🍟" },
                { label: "🥤", value: "🥤" },
                { label: "🔥", value: "🔥" },
                { label: "🤤", value: "🤤" },
                { label: "🛵", value: "🛵" },
                { label: "📲", value: "📲" }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => insertTagIntoCaption(item.value)}
                  className="px-2 py-0.5 rounded-lg border border-[#E3E1D9] dark:border-[#2A382E] bg-[#FAF8F0] dark:bg-[#25332A] hover:bg-gray-100 dark:hover:bg-[#2E4233] text-[11px] font-semibold text-gray-700 dark:text-[#F2EFE9] transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-bold text-[#1A241E] dark:text-[#F2EFE9]">
                Texto da Mensagem / Legenda:
              </label>
              <div className="text-[11px] text-[#637267] dark:text-[#9CA79E] font-medium">
                {activeCaptionText.length} caracteres
              </div>
            </div>

            <textarea
              rows={8}
              value={activeCaptionText}
              onChange={(e) => setActiveCaptionText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-[13px] font-normal border border-[#E3E1D9] dark:border-[#2A382E] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white dark:bg-[#161F18] text-[#1A241E] dark:text-[#F2EFE9] leading-relaxed resize-y break-words"
            />

            <div className="flex items-center justify-between text-[11px] text-[#637267] dark:text-[#9CA79E] mt-1">
              <span>
                💡 <strong>Dica:</strong> Em mensagens do WhatsApp, textos entre *asteriscos* ficam em negrito.
              </span>
              <button
                type="button"
                onClick={() => {
                  const found = currentTemplates.find((t) => t.id === selectedTemplateId);
                  if (found) setActiveCaptionText(buildCaptionTemplate(found.text));
                }}
                className="flex items-center gap-1 text-[#CB5A3C] hover:underline font-semibold cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Restaurar modelo</span>
              </button>
            </div>
          </div>

          <div className="border-t border-[#ECEAE2] pt-3 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyCaption}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              {copiedCaption ? (
                <>
                  <Check size={16} className="text-emerald-300" />
                  <span>Copiado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>
                    {studioChannel === "whatsapp"
                      ? "Copiar Mensagem Formatada"
                      : "Copiar Legenda Formatada"}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsAppShare}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-colors cursor-pointer"
            >
              <Send size={15} />
              <span>Testar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CouponImageGeneratorModal({
  isOpen,
  onClose,
  coupon,
  storeName,
  storeSlug
}: CouponImageGeneratorProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <CouponImageGeneratorContent
        key={coupon ? coupon.id : "global-art"}
        onClose={onClose}
        coupon={coupon}
        storeName={storeName}
        storeSlug={storeSlug}
      />
    </div>
  );
}
