"use client";

import React, { useRef, useState } from "react";
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  MapPin,
  Sparkles,
  ExternalLink,
  Search,
  Loader2,
  Plus,
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon } from "@/components/ui/social-icons";
import { CoverPhotoPickerModal } from "@/components/dashboard/cover-photo-picker-modal";

export const GASTRONOMIC_CATEGORIES = [
  "Restaurante Geral",
  "Pizzaria",
  "Hamburgueria",
  "Comida Japonesa / Sushi",
  "Pastelaria",
  "Açaí & Sorvetes",
  "Doceria & Confeitaria",
  "Marmitaria / Prato Feito",
  "Churrascaria & Carnes",
  "Bebidas & Distribuidora",
  "Lanchonete & Salgados",
  "Cafeteria & Padaria",
  "Comida Saudável & Fit",
];

export interface ProfileBrandSectionProps {
  storeName: string;
  setStoreName: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  instagram: string;
  setInstagram: (val: string) => void;
  logoUrl: string | null;
  setLogoUrl: (val: string | null) => void;
  bannerUrl: string | null;
  setBannerUrl: (val: string | null) => void;
  onUploadImage: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "banner"
  ) => void;
  showCoverPickerModal: boolean;
  setShowCoverPickerModal: (val: boolean) => void;
}

export function ProfileBrandSection({
  storeName,
  setStoreName,
  category,
  setCategory,
  bio,
  setBio,
  address,
  setAddress,
  phone,
  setPhone,
  instagram,
  setInstagram,
  logoUrl,
  setLogoUrl,
  bannerUrl,
  setBannerUrl,
  onUploadImage,
  showCoverPickerModal,
  setShowCoverPickerModal,
}: ProfileBrandSectionProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Controle de imagem quebrada
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [bannerLoadError, setBannerLoadError] = useState(false);

  // Controle de segmento culinário personalizado
  const isPresetCategory = GASTRONOMIC_CATEGORIES.includes(category);
  const [isCustomCategory, setIsCustomCategory] = useState(
    !isPresetCategory && Boolean(category && category !== "Restaurante Geral")
  );

  // Rastreador de Endereço por CEP
  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const cleanWhatsapp = phone.replace(/\D/g, "");
  const cleanInstagram = instagram.replace("@", "").trim();

  // Função para buscar endereço via CEP (ViaCEP)
  const handleSearchCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      setCepFeedback({ type: "error", text: "Digite os 8 dígitos do CEP." });
      return;
    }

    setIsSearchingCep(true);
    setCepFeedback(null);

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepFeedback({ type: "error", text: "CEP não encontrado." });
      } else {
        const rua = data.logradouro || "";
        const bairro = data.bairro || "";
        const cidade = data.localidade || "";
        const uf = data.uf || "";

        const fullAddr = `${rua}${bairro ? ` - ${bairro}` : ""}${cidade ? `, ${cidade}` : ""}${uf ? ` - ${uf}` : ""}`.trim();
        setAddress(fullAddr);
        setCepFeedback({
          type: "success",
          text: `${data.localidade} / ${data.uf} preenchido! Complete com o número.`,
        });
      }
    } catch {
      setCepFeedback({ type: "error", text: "Falha na consulta do CEP." });
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* COLUNA 1: IDENTIDADE VISUAL DA LOJA (LOGO & CAPA)              */}
      {/* ============================================================== */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-base text-[#B4482D] dark:text-[#FF7D4F]">
            Identidade Visual da Loja
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Seu logotipo e imagem de capa aparecem em destaque na vitrine mobile do cliente.
          </p>
        </div>

        {/* LOGOTIPO */}
        <div className="p-3.5 rounded-xl bg-[#F5F1E6] dark:bg-[#233127] border border-[#E5DFD1] dark:border-[#2F4234] space-y-2.5">
          <label className="block text-xs font-semibold text-foreground">
            Logotipo Oficial da Loja
          </label>
          <div className="flex items-center gap-3.5">
            <div className="relative h-16 w-16 rounded-2xl border-2 border-[#DFD8C8] dark:border-[#384D3D] bg-[#FAF7F0] dark:bg-[#2B3B2F] shrink-0 flex items-center justify-center shadow-2xs group">
              {logoUrl && !logoLoadError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <Camera className="w-6 h-6 text-muted-foreground" />
              )}
              {logoUrl && !logoLoadError && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl(null);
                    setLogoLoadError(false);
                  }}
                  aria-label="Remover logotipo"
                  className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 flex items-center justify-center transition-opacity cursor-pointer after:content-[''] after:absolute after:-inset-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title="Remover logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1 flex-1 min-w-0">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  setLogoLoadError(false);
                  onUploadImage(e, "logo");
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full sm:w-auto min-h-9 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E4233] text-white hover:bg-[#25352A] transition-colors shadow-2xs cursor-pointer text-center inline-flex items-center justify-center"
              >
                {logoUrl && !logoLoadError ? "Trocar Logotipo" : "Enviar Logotipo"}
              </button>
              <p className="text-[10px] text-muted-foreground truncate">
                PNG, JPG ou WEBP (500x500px).
              </p>
            </div>
          </div>
        </div>

        {/* CAPA PANORÂMICA */}
        <div className="p-3.5 rounded-xl bg-[#F5F1E6] dark:bg-[#233127] border border-[#E5DFD1] dark:border-[#2F4234] space-y-2.5">
          <label className="block text-xs font-semibold text-foreground">
            Capa Panorâmica da Vitrine
          </label>
          <div className="space-y-2">
            <div className="relative h-20 w-full rounded-xl overflow-hidden border border-[#DFD8C8] dark:border-[#384D3D] bg-[#FAF7F0] dark:bg-[#2B3B2F] shadow-2xs">
              {bannerUrl && !bannerLoadError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerUrl}
                  alt="Banner"
                  className="w-full h-full object-cover"
                  onError={() => setBannerLoadError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-0.5">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-[10px]">Nenhuma foto de capa definida</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => {
                  setBannerLoadError(false);
                  onUploadImage(e, "banner");
                }}
              />
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                className="min-h-9 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#293B30] border border-[#DFD8C8] dark:border-[#384D3D] text-foreground hover:bg-[#FAF8F0] dark:hover:bg-[#314537] transition-colors shadow-2xs cursor-pointer"
              >
                Enviar Imagem
              </button>

              <button
                type="button"
                onClick={() => setShowCoverPickerModal(true)}
                className="min-h-9 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#CB5A3C]/12 dark:bg-[#E76F41]/15 text-[#B4482D] dark:text-[#FF7D4F] hover:bg-[#CB5A3C]/20 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Galeria Unsplash</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLUNA 2: DADOS COMERCIAIS & APRESENTAÇÃO                      */}
      {/* ============================================================== */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-base text-[#B4482D] dark:text-[#FF7D4F]">
            Dados Comerciais & Apresentação
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Nome oficial, nicho culinário e texto de apresentação para encantar clientes.
          </p>
        </div>

        {/* NOME DA LOJA */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Nome da Loja *
          </label>
          <input
            type="text"
            value={storeName}
            maxLength={60}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="Ex: Pizzaria Forno Nobre"
            className="w-full px-3 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
          />
        </div>

        {/* SEGMENTO CULINÁRIO */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-foreground">
              Segmento Culinário
            </label>
            <button
              type="button"
              onClick={() => setIsCustomCategory(!isCustomCategory)}
              className="text-[11px] font-semibold text-[#B4482D] dark:text-[#FF7D4F] hover:underline cursor-pointer inline-flex items-center gap-1 min-h-[36px] lg:min-h-[32px] px-1"
            >
              <Plus className="w-3 h-3" />
              <span>{isCustomCategory ? "Escolher da lista" : "Novo Segmento"}</span>
            </button>
          </div>

          {isCustomCategory ? (
            <div className="space-y-1">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Digite o segmento da sua loja (ex: Creperia, Poke, etc.)"
                className="w-full px-3 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
                autoFocus
              />
              <span className="text-[10px] text-muted-foreground block">
                Você pode digitar livremente o nicho culinário da sua loja.
              </span>
            </div>
          ) : (
            <select
              value={category}
              onChange={(e) => {
                if (e.target.value === "__custom__") {
                  setIsCustomCategory(true);
                  setCategory("");
                } else {
                  setCategory(e.target.value);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none cursor-pointer transition-colors"
            >
              {GASTRONOMIC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__custom__">+ Outro (Digitar novo segmento...)</option>
            </select>
          )}
        </div>

        {/* APRESENTAÇÃO DA LOJA (SEM BIOGRAFIA) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-foreground">
              Apresentação da Loja
            </label>
            <span className="text-[10px] text-muted-foreground">
              {bio.length}/150 car.
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={150}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Ex: As melhores pizzas artesanais da cidade, massa de fermentação lenta e forno a lenha."
            className="w-full px-3 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none resize-none leading-relaxed transition-colors"
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLUNA 3: LOCALIZAÇÃO & CANAIS OFICIAIS                        */}
      {/* ============================================================== */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs space-y-4 md:col-span-2 xl:col-span-1">
        <div className="border-b border-border/60 pb-3">
          <h3 className="font-serif font-bold text-base text-[#B4482D] dark:text-[#FF7D4F]">
            Localização & Canais Oficiais
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Busca de endereço por CEP e canais oficiais para atendimento no WhatsApp e Instagram.
          </p>
        </div>

        {/* RASTREADOR DE ENDEREÇO POR CEP */}
        <div className="p-3.5 rounded-xl bg-[#F5F1E6] dark:bg-[#233127] border border-[#E5DFD1] dark:border-[#2F4234] space-y-2.5">
          <label className="block text-xs font-semibold text-foreground">
            Buscar Endereço por CEP
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={cep}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                const formatted =
                  val.length > 5 ? `${val.slice(0, 5)}-${val.slice(5, 8)}` : val;
                setCep(formatted);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchCep();
                }
              }}
              placeholder="00000-000"
              className="flex-1 min-w-[110px] max-w-[160px] px-3 py-1.5 rounded-xl border border-[#E2DDD0] dark:border-[#384D3D] bg-white dark:bg-[#2A3B30] text-foreground text-base lg:text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#CB5A3C]/20"
            />
            <button
              type="button"
              onClick={handleSearchCep}
              disabled={isSearchingCep}
              className="flex items-center justify-center gap-1.5 min-h-9 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2E4233] text-white hover:bg-[#25352A] transition-colors shadow-2xs cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isSearchingCep ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Buscar CEP</span>
            </button>
          </div>

          {cepFeedback && (
            <p
              className={`text-[11px] font-medium ${
                cepFeedback.type === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {cepFeedback.text}
            </p>
          )}

          {/* Campo Completo de Endereço Físico */}
          <div className="pt-1">
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Endereço Completo (Balcão / Cozinha)
            </label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua das Flores, 123 - Centro, São Paulo - SP"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#384D3D] bg-white dark:bg-[#2A3B30] text-foreground text-base lg:text-xs font-medium focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* CANAIS OFICIAIS (WHATSAPP E INSTAGRAM) */}
        <div className="space-y-3 pt-1">
          {/* WHATSAPP */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              WhatsApp Oficial de Atendimento
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 pointer-events-none">
                <WhatsAppIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
              />
            </div>
            {cleanWhatsapp && (
              <a
                href={`https://wa.me/55${cleanWhatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 min-h-[36px] py-1 lg:min-h-0 lg:py-0 hover:underline"
              >
                <span>Testar link wa.me</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* INSTAGRAM */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Instagram da Loja (@)
            </label>
            <div className="relative">
              <div className="absolute left-3 top-2.5 pointer-events-none">
                <InstagramIcon className="w-4 h-4 text-pink-600" />
              </div>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@fornonobre"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#E2DDD0] dark:border-[#324537] bg-[#F8F6EF] dark:bg-[#243329] text-foreground text-base lg:text-xs font-medium focus:bg-white dark:focus:bg-[#2A3B30] focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-colors"
              />
            </div>
            {cleanInstagram && (
              <a
                href={`https://instagram.com/${cleanInstagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-700 dark:text-pink-400 mt-0.5 min-h-[36px] py-1 lg:min-h-0 lg:py-0 hover:underline"
              >
                <span>Abrir perfil</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* MODAL UNSPLASH */}
      <CoverPhotoPickerModal
        isOpen={showCoverPickerModal}
        onClose={() => setShowCoverPickerModal(false)}
        currentBannerUrl={bannerUrl}
        onSelectCover={(photoUrl: string) => {
          setBannerUrl(photoUrl);
          setShowCoverPickerModal(false);
        }}
      />
    </div>
  );
}
