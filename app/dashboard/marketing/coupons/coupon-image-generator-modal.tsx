"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Share2
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
  icon: string;
  imageUrl?: string;
  fallbackGradient: string;
  accentColor: string;
}

const FOOD_THEMES: FoodTheme[] = [
  {
    id: "burger",
    name: "Burger Artesanal",
    category: "Lanches & Burgers",
    icon: "🍔",
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #1f140e, #3d1d12)",
    accentColor: "#CB5A3C"
  },
  {
    id: "pizza",
    name: "Pizza & Forno a Lenha",
    category: "Pizzarias",
    icon: "🍕",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2b1108, #521808)",
    accentColor: "#E11D48"
  },
  {
    id: "acai",
    name: "Açaí & Sorveteria",
    category: "Açaí & Gelados",
    icon: "🫐",
    imageUrl: "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #1e092b, #3b1057)",
    accentColor: "#9333EA"
  },
  {
    id: "sushi",
    name: "Sushi & Japonês",
    category: "Culinária Oriental",
    icon: "🍣",
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #0d1117, #1f2937)",
    accentColor: "#F59E0B"
  },
  {
    id: "caseira",
    name: "Marmitex & Caseira",
    category: "Restaurantes",
    icon: "🍲",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #181d16, #2d3829)",
    accentColor: "#10B981"
  },
  {
    id: "doces",
    name: "Doceria & Bolos",
    category: "Confeitaria & Café",
    icon: "🍰",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2e111a, #54192d)",
    accentColor: "#EC4899"
  },
  {
    id: "petiscos",
    name: "Pastéis & Petiscos",
    category: "Bares & Petiscarias",
    icon: "🥟",
    imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=1200&q=80",
    fallbackGradient: "linear-gradient(135deg, #2b1f09, #4a340b)",
    accentColor: "#F59E0B"
  },
  {
    id: "grad_terracotta",
    name: "DeliPlus Terracotta",
    category: "Cores da Marca",
    icon: "🎨",
    fallbackGradient: "linear-gradient(135deg, #1e110d, #421c14)",
    accentColor: "#CB5A3C"
  },
  {
    id: "grad_forest",
    name: "Verde Floresta",
    category: "Cores da Marca",
    icon: "🌲",
    fallbackGradient: "linear-gradient(135deg, #0e1a12, #1b3323)",
    accentColor: "#10B981"
  },
  {
    id: "grad_dark",
    name: "Dark Charcoal",
    category: "Cores da Marca",
    icon: "🖤",
    fallbackGradient: "linear-gradient(135deg, #0b0f17, #1a2233)",
    accentColor: "#38BDF8"
  }
];

const AVAILABLE_SOCIALS = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "facebook", name: "Facebook", icon: "👥" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
  { id: "ifood", name: "iFood", icon: "🛵" },
  { id: "google", name: "Google", icon: "⭐" }
];

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

interface CaptionTemplate {
  id: string;
  title: string;
  category: string;
  badge: string;
  text: string;
}

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
  // Navigation Tabs: "design" (Arte Visual) vs "copy_studio" (Gerador de Legendas)
  const [activeTab, setActiveTab] = useState<"design" | "copy_studio">("design");

  // Formats: story (9:16 = 1080x1920) or feed (1:1 = 1080x1080)
  const [aspectFormat, setAspectFormat] = useState<"story" | "feed">("story");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("burger");
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Social Icons on Image (Max 4)
  const [selectedSocials, setSelectedSocials] = useState<string[]>(["instagram", "whatsapp"]);

  // Editable fields
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

  // Interactive Color Picker & Hue Slider
  const [accentColor, setAccentColor] = useState("#CB5A3C");
  const [hueValue, setHueValue] = useState(() => hexToHue("#CB5A3C"));

  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Copywriting Studio State
  const cleanStoreLink = `deliplus.com.br/${storeSlug || "sua-loja"}`;
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>("cravings");

  const buildCaptionTemplate = (baseText: string) => {
    return baseText
      .replace(/{CODIGO}/g, couponCode)
      .replace(/{DESCONTO}/g, discountHighlight)
      .replace(/{MINIMO}/g, minOrderText)
      .replace(/{LOJA}/g, storeName || "nosso delivery")
      .replace(/{LINK}/g, cleanStoreLink);
  };

  const CAPTION_TEMPLATES: CaptionTemplate[] = [
    {
      id: "cravings",
      title: "🤤 Fome & Desejo",
      category: "cravings",
      badge: "Alta Conversão",
      text: "🔥 Bateu aquela fome incontrolável? A gente resolve agora!\n\nPeça direto pelo nosso cardápio online e aproveite: use o cupom *{CODIGO}* para garantir *{DESCONTO}* no seu pedido!\n\n👉 {MINIMO}\n👉 Válido apenas 1 uso por cliente\n👉 Peça quentinho em minutos pelo link da nossa bio!\n\n📲 {LINK}\n\n#delivery #comidaboa #almoco #jantar #lanche #cupomdedesconto"
    },
    {
      id: "urgency",
      title: "🚨 Urgência & Relâmpago",
      category: "urgency",
      badge: "Só Hoje",
      text: "🚨 CUPOM RELÂMPAGO NA ÁREA! (Válido só hoje)\n\nLiberamos o cupom *{CODIGO}* com *{DESCONTO}* exclusivo para pedidos no nosso cardápio próprio!\n\n⚠️ {MINIMO}\n⚠️ Não cumulativo • Limitado a 1 uso por cliente\n\nCorre antes que acabe a cota de hoje! Link direto na bio 🏃💨\n\n📲 {LINK}\n\n#promocao #cupomdedesconto #deliveryrapido #descontodehoje"
    },
    {
      id: "first_order",
      title: "🌟 Boas-Vindas (1º Pedido)",
      category: "first_order",
      badge: "Novos Clientes",
      text: "👋 Primeira vez pedindo com a gente? O presente de boas-vindas é por nossa conta!\n\nUse o cupom especial *{CODIGO}* no seu 1º pedido e ganhe *{DESCONTO}*!\n\n✨ {MINIMO}\n✨ Válido exclusivamente para novos clientes no cardápio online\n\nToque no link da nossa bio e faça sua primeira experiência com a gente! 🍔✨\n\n📲 {LINK}\n\n#primeiropedido #deliverylocal #desconto #comidagourmet"
    },
    {
      id: "weekend",
      title: "🍕 Sextou & Fim de Semana",
      category: "weekend",
      badge: "Fim de Semana",
      text: "🍕 Sextou com comida boa e zero louça na pia!\n\nReúna a galera ou aproveite o filme no sofá: garanta *{DESCONTO}* usando o cupom *{CODIGO}* no nosso cardápio!\n\n👉 {MINIMO}\n👉 1 uso por cliente • Válido para o fim de semana\n\nPediu, chegou quentinho! Acesse o link da bio 🛋️🛵\n\n📲 {LINK}\n\n#sextou #fimdesemana #deliverynight #pizzanight #burgernight"
    },
    {
      id: "whatsapp",
      title: "💬 Lista de Transmissão (WhatsApp)",
      category: "whatsapp",
      badge: "WhatsApp Direto",
      text: "Olá! Tudo bem? Passando para te avisar que liberamos um cupom exclusivo para você hoje no nosso cardápio online! 🎁\n\nUse o código *{CODIGO}* e ganhe *{DESCONTO}* no seu pedido!\n\n📌 {MINIMO}\n📌 Válido para 1 uso por cliente\n\nPara pedir agora sem taxas extras, clique no link:\n👉 https://{LINK}\n\nBom apetite! 😋"
    },
    {
      id: "short_reels",
      title: "⚡ Curta & Direta (Reels & Stories)",
      category: "short_reels",
      badge: "Stories & Reels",
      text: "A única notificação de delivery que você queria hoje! 📲🤤\n\nUse o cupom *{CODIGO}* para *{DESCONTO}* ({MINIMO}). Link na bio! 🛵✨\n\n📲 {LINK}"
    }
  ];

  const [activeCaptionText, setActiveCaptionText] = useState(() =>
    buildCaptionTemplate(CAPTION_TEMPLATES[0].text)
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTheme = FOOD_THEMES.find((t) => t.id === selectedThemeId) || FOOD_THEMES[0];

  // Toggle social network selection (max 4)
  const handleToggleSocial = (id: string) => {
    if (selectedSocials.includes(id)) {
      setSelectedSocials(selectedSocials.filter((s) => s !== id));
    } else {
      if (selectedSocials.length >= 4) return;
      setSelectedSocials([...selectedSocials, id]);
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = aspectFormat === "story" ? 1920 : 1080;

    canvas.width = width;
    canvas.height = height;

    const renderCard = (imgBg?: HTMLImageElement | null) => {
      // 1. Clear background
      ctx.fillStyle = "#121417";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw image or fallback gradient
      if (imgBg) {
        // Draw image covering canvas (object-fit: cover)
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

        // Dark cinematic vignette overlay (10% lighter as requested!)
        const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
        darkOverlay.addColorStop(0, "rgba(10, 12, 16, 0.65)");
        darkOverlay.addColorStop(0.3, "rgba(10, 12, 16, 0.72)");
        darkOverlay.addColorStop(0.7, "rgba(10, 12, 16, 0.76)");
        darkOverlay.addColorStop(1, "rgba(6, 8, 12, 0.85)");
        ctx.fillStyle = darkOverlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback rich gradient
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

        // Circular ambient glow
        const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
        glow.addColorStop(0, `${accentColor}33`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // Vertical spacing based on format & Instagram Safe Zones
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
      const pillY = isStory ? 240 : 65;

      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.32)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(pillText, width / 2, pillY + (isStory ? 40 : 33));

      // 4. Subtitle Tagline
      const taglineFontSize = isStory ? 44 : 34;
      ctx.font = `bold ${taglineFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = accentColor;
      const taglineY = isStory ? 360 : 155;
      ctx.fillText(tagline.toUpperCase(), width / 2, taglineY);

      // 5. Main Headline
      const headlineFontSize = isStory ? 88 : 76;
      ctx.font = `900 ${headlineFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 6;
      const headlineY = isStory ? 465 : 240;
      ctx.fillText(headline.toUpperCase(), width / 2, headlineY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 6. Huge Discount Display
      const discountFontSize = isStory ? 136 : 112;
      ctx.font = `900 ${discountFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.shadowColor = `${accentColor}80`;
      ctx.shadowBlur = 40;
      const centerY = isStory ? 680 : 390;
      ctx.fillText(discountHighlight, width / 2, centerY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 7. Coupon Ticket Voucher Box
      const ticketW = isStory ? 880 : 860;
      const ticketH = isStory ? 340 : 265;
      const ticketX = (width - ticketW) / 2;
      const ticketY = isStory ? 780 : 465;

      // Ticket background with shadow
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 35;
      ctx.shadowOffsetY = 14;
      ctx.beginPath();
      ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 30);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Ticket dashed border
      ctx.strokeStyle = "#CB5A3C";
      ctx.lineWidth = 3.5;
      ctx.setLineDash([14, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ticket "Use o cupom no checkout"
      const checkoutTextSize = isStory ? 30 : 26;
      ctx.font = `bold ${checkoutTextSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#6B7280";
      ctx.fillText("USE O CUPOM NO CHECKOUT:", width / 2, ticketY + (isStory ? 62 : 50));

      // Ticket Code (Monospace bold)
      const codeFontSize = isStory ? 84 : 72;
      ctx.font = `900 ${codeFontSize}px 'Courier New', monospace, sans-serif`;
      ctx.fillStyle = "#111827";
      ctx.fillText(couponCode.toUpperCase(), width / 2, ticketY + (isStory ? 158 : 132));

      // Ticket sub-rule inside box (Mínimo)
      const minOrderFontSize = isStory ? 36 : 32;
      ctx.font = `bold ${minOrderFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#374151";
      ctx.fillText(minOrderText, width / 2, ticketY + (isStory ? 232 : 194));

      // Ticket sub-rule (1 uso por cliente / não cumulativo)
      const subRuleFontSize = isStory ? 28 : 24;
      ctx.font = `600 ${subRuleFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#6B7280";
      ctx.fillText("1 uso por cliente • Não cumulativo com outros cupons", width / 2, ticketY + (isStory ? 292 : 238));

      // 8. Call to Action Button / Pill
      const ctaY = isStory ? 1180 : 765;
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

      // 9. Link do cardápio
      const linkY = isStory ? 1315 : 880;
      const linkFontSize = isStory ? 36 : 32;
      ctx.font = `bold ${linkFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#E5E7EB";
      ctx.fillText(`deliplus.com.br/${storeSlug || "sua-loja"}`, width / 2, linkY);

      // 10. REDES SOCIAIS ABAIXO DO LINK (ATÉ 4 ÍCONES)
      if (selectedSocials.length > 0) {
        const socialY = isStory ? 1410 : 935;
        const iconRadius = isStory ? 24 : 19;
        const iconSpacing = isStory ? 64 : 52;
        const totalSocialW = (selectedSocials.length - 1) * iconSpacing;
        const startX = width / 2 - totalSocialW / 2;

        selectedSocials.forEach((socialId, idx) => {
          const cx = startX + idx * iconSpacing;
          const cy = socialY;

          // Outer circle badge
          ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
          ctx.strokeStyle = "rgba(255, 255, 255, 0.40)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, iconRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = "#FFFFFF";

          if (socialId === "instagram") {
            const s = iconRadius * 1.05;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(cx - s / 2, cy - s / 2, s, s, 6);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.26, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx + s * 0.28, cy - s * 0.28, 1.8, 0, Math.PI * 2);
            ctx.fill();
          } else if (socialId === "whatsapp") {
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(cx, cy - 1, iconRadius * 0.58, 0.2 * Math.PI, 1.9 * Math.PI);
            ctx.lineTo(cx - iconRadius * 0.6, cy + iconRadius * 0.6);
            ctx.closePath();
            ctx.stroke();
            ctx.font = `bold ${iconRadius * 0.75}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("✆", cx + 0.5, cy + iconRadius * 0.28);
          } else if (socialId === "facebook") {
            ctx.font = `bold ${iconRadius * 1.3}px 'Segoe UI', Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("f", cx, cy + iconRadius * 0.45);
          } else if (socialId === "tiktok") {
            ctx.font = `bold ${iconRadius * 1.25}px sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("♪", cx, cy + iconRadius * 0.42);
          } else if (socialId === "ifood") {
            ctx.font = `bold ${iconRadius * 0.9}px 'Arial Black', sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("iF", cx, cy + iconRadius * 0.34);
          } else if (socialId === "google") {
            ctx.font = `bold ${iconRadius * 1.2}px 'Segoe UI', Arial, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillText("G", cx, cy + iconRadius * 0.42);
          }
        });
      }

      // 11. MARCA D'ÁGUA DELIPLUS EM BADGE / PÍLULA (SAFE ZONE RESPEITADA)
      const waterFontSize = isStory ? 32 : 26;
      ctx.font = `bold ${waterFontSize}px system-ui, -apple-system, sans-serif`;
      const waterText = "✦ Criado com DeliPlus  •  www.deliplus.com.br ✦";
      const waterPillWidth = ctx.measureText(waterText).width + 64;
      const waterPillHeight = isStory ? 64 : 52;
      const waterPillX = (width - waterPillWidth) / 2;
      const waterPillY = isStory ? 1560 : 990;

      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.34)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(waterPillX, waterPillY, waterPillWidth, waterPillHeight, waterPillHeight / 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(waterText, width / 2, waterPillY + (isStory ? 43 : 35));
    };

    // Load image if available
    const targetImageSrc = customImageSrc || activeTheme.imageUrl;

    if (targetImageSrc) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        renderCard(img);
      };
      img.onerror = () => {
        renderCard(null);
      };
      img.src = targetImageSrc;
    } else {
      renderCard(null);
    }
  }, [
    aspectFormat,
    selectedThemeId,
    customImageSrc,
    activeTheme,
    headline,
    tagline,
    couponCode,
    discountHighlight,
    minOrderText,
    callToAction,
    accentColor,
    selectedSocials,
    storeName,
    storeSlug
  ]);

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

  // Copy caption to clipboard
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaptionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  // Open WhatsApp with prefilled caption
  const handleOpenWhatsAppShare = () => {
    const encoded = encodeURIComponent(activeCaptionText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  // Insert tag into active caption text
  const insertTagIntoCaption = (tag: string) => {
    setActiveCaptionText((prev) => `${prev} ${tag}`);
  };

  return (
    <div className="bg-[#FAF9F5] border border-[#E3E1D9] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
      {/* Modal Top Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 bg-white border-b border-[#ECEAE2] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF0ED] text-[#CB5A3C] flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A241E] leading-tight">
              Gerador de Artes & Estúdio de Legendas
            </h2>
            <p className="text-[12px] text-[#637267]">
              Crie a arte visual e copie a legenda profissional para suas postagens
            </p>
          </div>
        </div>

        {/* Studio Sub-Pages Tab Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 bg-[#F4F3EE] p-1 rounded-xl border border-[#EAE8E0]">
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
              onClick={() => setActiveTab("copy_studio")}
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
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ml-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DESIGN DA ARTE (VISUAL)                                  */}
      {/* ============================================================== */}
      {activeTab === "design" && (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT: Live Preview Canvas */}
          <div className="lg:col-span-5 bg-[#121614] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#242A27] min-h-[440px]">
            {/* Format Switcher */}
            <div className="flex items-center gap-2 bg-[#1C221F] p-1 rounded-xl mb-3 border border-[#2D3631]">
              <button
                type="button"
                onClick={() => setAspectFormat("story")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  aspectFormat === "story"
                    ? "bg-[#CB5A3C] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Smartphone size={14} />
                <span>Story / Reels (9:16)</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectFormat("feed")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  aspectFormat === "feed"
                    ? "bg-[#CB5A3C] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Square size={14} />
                <span>Feed / Post (1:1)</span>
              </button>
            </div>

            {/* Canvas Viewport container */}
            <div className="relative flex items-center justify-center w-full max-w-[350px] shadow-2xl rounded-2xl overflow-hidden border-2 border-white/10">
              <canvas
                ref={canvasRef}
                className="w-full h-auto object-contain block rounded-2xl"
                style={{
                  maxHeight: aspectFormat === "story" ? "540px" : "350px"
                }}
              />
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400 text-center">
              <Sparkles size={12} className="text-[#CB5A3C]" />
              <span>Marca d&apos;água <strong>www.deliplus.com.br</strong> nítida e segura no rodapé</span>
            </div>
          </div>

          {/* RIGHT: Visual Customization Controls */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 overflow-y-auto bg-white">
            {/* 1. Escolha do Nicho / Fundo (Em SELECT compacto para economizar espaço!) */}
            <div>
              <label className="text-[12.5px] font-bold text-[#1A241E] block mb-1.5">
                1. Nicho & Fundo da Arte (Foto 10% mais iluminada)
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
                    className="w-full px-3 py-2 bg-white border border-[#E3E1D9] rounded-xl text-[13px] font-semibold text-[#1A241E] focus:outline-none focus:border-[#CB5A3C] cursor-pointer"
                  >
                    <optgroup label="🍕 Nichos de Food Delivery">
                      {FOOD_THEMES.filter((t) => t.category !== "Cores da Marca").map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.icon} {theme.name} — {theme.category}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="🎨 Cores & Gradientes da Marca">
                      {FOOD_THEMES.filter((t) => t.category === "Cores da Marca").map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.icon} {theme.name}
                        </option>
                      ))}
                    </optgroup>
                    {customImageSrc && (
                      <option value="custom">📸 Imagem própria enviada</option>
                    )}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CB5A3C]/40 bg-[#FAF0ED] text-[#CB5A3C] text-xs font-bold hover:bg-[#FBE8E4] transition-colors cursor-pointer shrink-0"
                >
                  <Upload size={14} />
                  <span>Foto própria</span>
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
                  <span className="text-orange-800 font-medium flex items-center gap-1">
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

            {/* 2. Textos do Cupom */}
            <div className="border-t border-[#ECEAE2] pt-3.5 space-y-2.5">
              <label className="text-[12.5px] font-bold text-[#1A241E] block">
                2. Textos da Arte
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Código do Cupom
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-1.5 text-sm font-mono font-bold border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Destaque do Desconto
                  </label>
                  <input
                    type="text"
                    value={discountHighlight}
                    onChange={(e) => setDiscountHighlight(e.target.value)}
                    placeholder="Ex: 15% OFF, R$ 10 OFF"
                    className="w-full px-3 py-1.5 text-sm font-bold text-[#CB5A3C] border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Título Principal
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm font-semibold border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Subtítulo / Tagline
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Regra de Pedido Mínimo
                  </label>
                  <input
                    type="text"
                    value={minOrderText}
                    onChange={(e) => setMinOrderText(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#637267] block mb-1">
                    Chamada para Ação
                  </label>
                  <input
                    type="text"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 3. Ícones de Redes Sociais na Imagem (Máx 4) */}
            <div className="border-t border-[#ECEAE2] pt-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12.5px] font-bold text-[#1A241E]">
                  3. Redes Sociais na Imagem (abaixo do link)
                </label>
                <span className="text-[11px] text-[#637267] font-semibold">
                  {selectedSocials.length}/4 selecionadas
                </span>
              </div>
              <p className="text-[11px] text-[#637267] mb-2">
                Selecione até 4 redes para exibir os ícones estilizados na arte:
              </p>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {AVAILABLE_SOCIALS.map((soc) => {
                  const isSelected = selectedSocials.includes(soc.id);
                  return (
                    <button
                      key={soc.id}
                      type="button"
                      onClick={() => handleToggleSocial(soc.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#2E4233] text-white border-[#2E4233] shadow-2xs font-bold"
                          : "bg-[#FAF8F0] border-[#E3E1D9] text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-sm mb-0.5">{soc.icon}</span>
                      <span className="text-[10.5px]">{soc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Cor de Destaque com SELETOR DE PONTINHO (Slider de Matiz) */}
            <div className="border-t border-[#ECEAE2] pt-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12.5px] font-bold text-[#1A241E] flex items-center gap-1.5">
                  <Sliders size={14} className="text-[#CB5A3C]" />
                  <span>4. Seletor de Cores Interativo</span>
                </label>

                {/* Eyedropper & Hex */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F0] border border-[#E3E1D9] px-2 py-0.5 rounded-lg">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor(e.target.value);
                      setHueValue(hexToHue(e.target.value));
                    }}
                    className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
                    title="Seletor de cor livre"
                  />
                  <span className="font-mono text-[11.5px] font-bold text-gray-800 uppercase">
                    {accentColor}
                  </span>
                </div>
              </div>

              {/* Slider de arrastar o pontinho */}
              <div className="relative pt-1 pb-1">
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
                  className="w-full h-3.5 rounded-full appearance-none cursor-pointer border border-black/10 shadow-inner"
                  style={{
                    background:
                      "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
                  }}
                />
              </div>

              {/* Bolinhas de atalho de cores recomendadas */}
              <div className="flex items-center gap-2 pt-0.5">
                {[
                  { name: "Laranja Logo", color: "#CB5A3C" },
                  { name: "Ouro Quente", color: "#F59E0B" },
                  { name: "Verde Esmeralda", color: "#10B981" },
                  { name: "Roxo Neon", color: "#9333EA" },
                  { name: "Vermelho Rubi", color: "#E11D48" },
                  { name: "Azul Céu", color: "#0EA5E9" }
                ].map((item) => (
                  <button
                    key={item.color}
                    type="button"
                    onClick={() => {
                      setAccentColor(item.color);
                      setHueValue(hexToHue(item.color));
                    }}
                    style={{ backgroundColor: item.color }}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer shadow-xs ${
                      accentColor === item.color
                        ? "scale-125 ring-2 ring-offset-2 ring-[#1A241E]"
                        : "hover:scale-110"
                    }`}
                    title={item.name}
                  />
                ))}
              </div>
            </div>

            {/* 5. Botões de Ação do Design */}
            <div className="border-t border-[#ECEAE2] pt-3.5 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={isGenerating}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                <Download size={16} />
                <span>{isGenerating ? "Exportando PNG..." : "Baixar Arte PNG em Alta Definição"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("copy_studio")}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-[#CB5A3C]/40 bg-[#FAF0ED] hover:bg-[#FBE8E4] text-[#CB5A3C] font-bold text-sm transition-colors cursor-pointer"
              >
                <PenTool size={15} />
                <span>Gerar Legenda</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: ESTÚDIO DE LEGENDAS (COPYWRITING PARA DELIVERY)           */}
      {/* ============================================================== */}
      {activeTab === "copy_studio" && (
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT: Live Post Mockup */}
          <div className="lg:col-span-5 bg-[#171A18] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#242A27]">
            <div className="w-full max-w-[340px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden text-[#111827]">
              {/* Instagram Mockup Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#CB5A3C] text-white flex items-center justify-center text-xs font-bold">
                    {storeName ? storeName.slice(0, 1).toUpperCase() : "D"}
                  </div>
                  <div>
                    <div className="text-[12px] font-bold leading-tight">{storeName || "DeliPlus"}</div>
                    <div className="text-[10px] text-gray-500">Patrocinado • Delivery</div>
                  </div>
                </div>
                <span className="text-gray-400 font-bold text-xs">•••</span>
              </div>

              {/* Post Thumbnail / Aspect Preview */}
              <div className="relative aspect-square bg-[#121614] flex items-center justify-center p-3 text-center overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${customImageSrc || activeTheme.imageUrl})` }} />
                <div className="relative z-10 p-3 bg-black/60 backdrop-blur-xs rounded-xl border border-white/20 text-white">
                  <div className="text-xs font-bold text-[#F59E0B] mb-0.5">{couponCode}</div>
                  <div className="text-lg font-black">{discountHighlight}</div>
                  <div className="text-[10px] text-gray-300">{minOrderText}</div>
                </div>
              </div>

              {/* Instagram Post Content */}
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
                  Curtido por outros clientes
                </div>

                {/* Caption with real text */}
                <div className="text-[11.5px] text-gray-800 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  <span className="font-bold mr-1.5">{storeSlug || "sualoja"}</span>
                  {activeCaptionText}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
              <Share2 size={12} className="text-[#CB5A3C]" />
              <span>Prévia de como a legenda aparece no feed do Instagram</span>
            </div>
          </div>

          {/* RIGHT: Caption Studio Controls & Templates */}
          <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 overflow-y-auto bg-white">
            {/* Template Selector by Category */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12.5px] font-bold text-[#1A241E]">
                  Modelos de Copy de Alta Conversão
                </label>
                <span className="text-[11px] text-[#CB5A3C] font-semibold">
                  Clique para carregar
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CAPTION_TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplateCategory === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateCategory(tmpl.id);
                        setActiveCaptionText(buildCaptionTemplate(tmpl.text));
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#CB5A3C] bg-[#FAF0ED] ring-1 ring-[#CB5A3C]"
                          : "border-[#ECEAE2] bg-[#FAF8F0] hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-[11.5px] font-bold text-[#1A241E] truncate">
                        {tmpl.title}
                      </div>
                      <div className="text-[10px] text-[#637267] truncate">
                        {tmpl.badge}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Insertion Pills */}
            <div className="border-t border-[#ECEAE2] pt-3">
              <label className="text-[11.5px] font-bold text-[#1A241E] block mb-1">
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
                    className="px-2 py-0.5 rounded-lg border border-[#E3E1D9] bg-[#FAF8F0] hover:bg-gray-100 text-[11px] font-semibold text-gray-700 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Editable Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[12px] font-bold text-[#1A241E]">
                  Texto da Legenda (Totalmente Editável):
                </label>
                <div className="text-[11px] text-[#637267] font-medium">
                  {activeCaptionText.length} caracteres
                </div>
              </div>

              <textarea
                rows={9}
                value={activeCaptionText}
                onChange={(e) => setActiveCaptionText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-[13px] font-normal border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white leading-relaxed resize-y"
              />

              <div className="flex items-center justify-between text-[11px] text-[#637267] mt-1">
                <span>
                  💡 <strong>Dica Pro:</strong> Os primeiros 125 caracteres são vistos antes do botão &quot;...mais&quot;.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const found = CAPTION_TEMPLATES.find((t) => t.id === selectedTemplateCategory);
                    if (found) setActiveCaptionText(buildCaptionTemplate(found.text));
                  }}
                  className="flex items-center gap-1 text-[#CB5A3C] hover:underline font-semibold cursor-pointer"
                >
                  <RotateCcw size={11} />
                  <span>Restaurar modelo</span>
                </button>
              </div>
            </div>

            {/* Action Buttons for Caption */}
            <div className="border-t border-[#ECEAE2] pt-3 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyCaption}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
              >
                {copiedCaption ? (
                  <>
                    <Check size={16} className="text-emerald-300" />
                    <span>Legenda Copiada com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copiar Legenda Formatada</span>
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
      )}
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
