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
  Square
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
  // Formats: story (9:16 = 1080x1920) or feed (1:1 = 1080x1080)
  const [aspectFormat, setAspectFormat] = useState<"story" | "feed">("story");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("burger");
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);

  // Initialize editable fields directly from coupon prop
  const [headline, setHeadline] = useState(() => {
    if (coupon?.description && coupon.description.includes("1º")) return "SEU 1º PEDIDO";
    return "DESCONTO ESPECIAL";
  });
  const [tagline, setTagline] = useState(() => {
    if (coupon?.description && coupon.description.includes("1º")) return "DESCONTO DE BOAS-VINDAS";
    return "PEÇA HOJE PELO NOSSO CARDÁPIO";
  });
  const [couponCode, setCouponCode] = useState(() => coupon ? coupon.code : "DELI10");
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
  const [accentColor, setAccentColor] = useState("#CB5A3C");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeTheme = FOOD_THEMES.find(t => t.id === selectedThemeId) || FOOD_THEMES[0];

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

        // Dark cinematic vignette overlay
        const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
        darkOverlay.addColorStop(0, "rgba(10, 12, 16, 0.78)");
        darkOverlay.addColorStop(0.3, "rgba(10, 12, 16, 0.85)");
        darkOverlay.addColorStop(0.7, "rgba(10, 12, 16, 0.88)");
        darkOverlay.addColorStop(1, "rgba(6, 8, 12, 0.96)");
        ctx.fillStyle = darkOverlay;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback rich gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        if (selectedThemeId === "grad_forest") {
          bgGrad.addColorStop(0, "#0a1610");
          bgGrad.addColorStop(1, "#182c1f");
        } else if (selectedThemeId === "grad_dark") {
          bgGrad.addColorStop(0, "#0c0f17");
          bgGrad.addColorStop(1, "#1a2438");
        } else {
          bgGrad.addColorStop(0, "#1f0f0b");
          bgGrad.addColorStop(1, "#3d1912");
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Circular ambient glow
        const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
        glow.addColorStop(0, `${accentColor}26`);
        glow.addColorStop(1, "transparent");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // Vertical spacing based on format
      const isStory = aspectFormat === "story";
      const topY = isStory ? 200 : 110;
      const centerY = isStory ? 760 : 490;

      // 3. Top Store Pill Badge
      const storeLabel = (storeName || "DELIPLUS DELIVERY").toUpperCase();
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      const pillText = `★  ${storeLabel}  ★`;
      const pillWidth = ctx.measureText(pillText).width + 60;
      const pillHeight = 52;
      const pillX = (width - pillWidth) / 2;
      const pillY = topY;

      ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 26);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(pillText, width / 2, pillY + 35);

      // 4. Subtitle Tagline
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = accentColor;
      ctx.fillText(tagline.toUpperCase(), width / 2, pillY + 115);

      // 5. Main Headline
      ctx.font = "900 68px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillText(headline.toUpperCase(), width / 2, pillY + 195);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 6. Huge Discount Display
      ctx.font = `900 ${isStory ? "130px" : "110px"} system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = accentColor;
      ctx.shadowColor = `${accentColor}80`;
      ctx.shadowBlur = 35;
      ctx.fillText(discountHighlight, width / 2, centerY);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 7. Coupon Ticket Voucher Box
      const ticketW = isStory ? 820 : 760;
      const ticketH = isStory ? 280 : 230;
      const ticketX = (width - ticketW) / 2;
      const ticketY = isStory ? centerY + 90 : centerY + 50;

      // Ticket background with subtle shadow
      ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.roundRect(ticketX, ticketY, ticketW, ticketH, 28);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Ticket dashed border
      ctx.strokeStyle = "#CB5A3C";
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 10]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ticket "Use o cupom no checkout"
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#6B7280";
      ctx.fillText("USE O CUPOM NO CHECKOUT:", width / 2, ticketY + 54);

      // Ticket Code (Monospace bold)
      ctx.font = "900 72px 'Courier New', monospace, sans-serif";
      ctx.fillStyle = "#111827";
      ctx.fillText(couponCode.toUpperCase(), width / 2, ticketY + 138);

      // Ticket sub-rule inside box
      ctx.font = "600 23px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#4B5563";
      ctx.fillText(minOrderText, width / 2, ticketY + 195);

      if (isStory) {
        ctx.font = "500 20px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#9CA3AF";
        ctx.fillText("1 uso por cliente • Não cumulativo com outros cupons", width / 2, ticketY + 236);
      }

      // 8. Call to Action Button / Pill
      const ctaY = isStory ? ticketY + ticketH + 90 : ticketY + ticketH + 45;
      const ctaW = 680;
      const ctaH = 68;
      const ctaX = (width - ctaW) / 2;

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 34);
      ctx.fill();

      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`👉 ${callToAction.toUpperCase()}`, width / 2, ctaY + 44);

      // 9. Link do cardápio
      const linkY = ctaY + 115;
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#E5E7EB";
      ctx.fillText(`deliplus.com.br/${storeSlug || "sua-loja"}`, width / 2, linkY);

      // 10. WATERMARK DELIPLUS OBRIGATÓRIA (Rodapé elegante)
      const waterY = height - (isStory ? 75 : 45);
      ctx.font = "600 21px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.fillText("Criado com DeliPlus  •  www.deliplus.com.br", width / 2, waterY);

      // Subtle star icon next to watermark
      ctx.fillStyle = accentColor;
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText("✦", width / 2 - 210, waterY - 1);
      ctx.fillText("✦", width / 2 + 210, waterY - 1);
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

  // Copy ready-made Instagram / WhatsApp caption
  const handleCopyCaption = () => {
    const captionText = `🔥 PROMOÇÃO ESPECIAL NO NOSSO CARDÁPIO! 🔥\n\nUse o cupom *${couponCode}* e garanta *${discountHighlight}* no seu pedido!\n\n👉 ${minOrderText}\n👉 Válido apenas 1 uso por cliente (não cumulativo)\n👉 Peça agora pelo nosso cardápio online no link da bio!\n\n📲 www.deliplus.com.br/${storeSlug || "sua-loja"}`;
    navigator.clipboard.writeText(captionText);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  return (
    <div className="bg-[#FAF9F5] border border-[#E3E1D9] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
      {/* Modal Top Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#ECEAE2]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FAF0ED] text-[#CB5A3C] flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1A241E] leading-tight">
              Gerador de Artes para Redes Sociais
            </h2>
            <p className="text-[12px] text-[#637267]">
              Artes automáticas de alta conversão para Instagram Stories, Feed e WhatsApp
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Modal Content: Split Screen (Preview Left, Controls Right) */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* LEFT: Live Preview Canvas */}
        <div className="lg:col-span-5 bg-[#121614] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#242A27] min-h-[420px]">
          {/* Format Switcher */}
          <div className="flex items-center gap-2 bg-[#1C221F] p-1 rounded-xl mb-4 border border-[#2D3631]">
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
          <div className="relative flex items-center justify-center w-full max-w-[320px] shadow-2xl rounded-2xl overflow-hidden border-2 border-white/10">
            <canvas
              ref={canvasRef}
              className="w-full h-auto object-contain block rounded-2xl"
              style={{
                maxHeight: aspectFormat === "story" ? "520px" : "320px"
              }}
            />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
            <Sparkles size={12} className="text-[#CB5A3C]" />
            <span>Marca d&apos;água <strong>www.deliplus.com.br</strong> inclusa no rodapé</span>
          </div>
        </div>

        {/* RIGHT: Customization Controls */}
        <div className="lg:col-span-7 p-4 sm:p-6 space-y-5 overflow-y-auto bg-white">
          {/* 1. Escolha do Tema / Nicho */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-bold text-[#1A241E]">
                1. Escolha o Nicho / Fundo da Arte
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#CB5A3C] hover:underline cursor-pointer"
              >
                <Upload size={12} />
                <span>Enviar foto própria</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FOOD_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id && !customImageSrc;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      setCustomImageSrc(null);
                      setAccentColor(theme.accentColor);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#CB5A3C] bg-[#FDF2F0] ring-1 ring-[#CB5A3C]"
                        : "border-[#ECEAE2] bg-[#FAF8F0] hover:border-gray-300"
                    }`}
                  >
                    <span className="text-lg">{theme.icon}</span>
                    <div className="overflow-hidden">
                      <div className="text-[12px] font-bold text-[#1A241E] truncate">
                        {theme.name}
                      </div>
                      <div className="text-[10px] text-[#637267] truncate">
                        {theme.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {customImageSrc && (
              <div className="mt-2 p-2 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
                  <ImageIcon size={13} />
                  Usando imagem personalizada enviada
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
          <div className="border-t border-[#ECEAE2] pt-4 space-y-3">
            <label className="text-[13px] font-bold text-[#1A241E] block">
              2. Personalize os Textos da Arte
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#637267] block mb-1">
                  Código do Cupom
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#637267] block mb-1">
                  Desconto em Destaque
                </label>
                <input
                  type="text"
                  value={discountHighlight}
                  onChange={(e) => setDiscountHighlight(e.target.value)}
                  placeholder="Ex: 15% OFF, R$ 10 OFF"
                  className="w-full px-3 py-2 text-sm font-bold text-[#CB5A3C] border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#637267] block mb-1">
                  Título Principal
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
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
                  className="w-full px-3 py-2 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[#637267] block mb-1">
                  Regra de Pedido Mínimo
                </label>
                <input
                  type="text"
                  value={minOrderText}
                  onChange={(e) => setMinOrderText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
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
                  className="w-full px-3 py-2 text-sm border border-[#E3E1D9] rounded-xl focus:border-[#CB5A3C] focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          {/* 3. Cor de Destaque */}
          <div className="border-t border-[#ECEAE2] pt-4">
            <label className="text-[13px] font-bold text-[#1A241E] block mb-2">
              3. Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
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
                  onClick={() => setAccentColor(item.color)}
                  style={{ backgroundColor: item.color }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer shadow-xs ${
                    accentColor === item.color ? "scale-125 ring-2 ring-offset-2 ring-[#1A241E]" : "hover:scale-110"
                  }`}
                  title={item.name}
                />
              ))}
            </div>
          </div>

          {/* 4. Botões de Ação */}
          <div className="border-t border-[#ECEAE2] pt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2E4233] hover:bg-[#233327] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>{isGenerating ? "Exportando PNG..." : "Baixar Arte PNG em Alta Definição"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCaption}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl border border-[#E3E1D9] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              {copiedCaption ? (
                <>
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-emerald-600">Legenda Copiada!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Legenda</span>
                </>
              )}
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
