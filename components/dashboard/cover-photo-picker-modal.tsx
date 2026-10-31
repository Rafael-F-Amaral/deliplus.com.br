"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  X,
  Search,
  Check,
  Sparkles,
  ExternalLink,
  Camera,
  RefreshCw,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { StockPhoto } from "@/app/api/stock-photos/route";

interface CoverPhotoPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBannerUrl?: string | null;
  onSelectCover: (photoUrl: string) => void;
}

const CATEGORIES = [
  { id: "todas", label: "✨ Todas as Capas" },
  { id: "pizza", label: "🍕 Pizzas & Forno" },
  { id: "burger", label: "🍔 Hambúrgueres" },
  { id: "saudavel", label: "🥗 Saudável & Bowls" },
  { id: "japonesa", label: "🍣 Japonesa & Sushi" },
  { id: "italiana", label: "🍝 Massas & Italiana" },
  { id: "doces", label: "🍧 Açaí & Sobremesas" },
  { id: "cafeteria", label: "☕ Café & Padaria" },
  { id: "carnes", label: "🥩 Carnes & Grelha" },
  { id: "caseira", label: "🍱 Comida Caseira" },
  { id: "bar", label: "🍺 Chopp & Petiscos" },
];

export function CoverPhotoPickerModal({
  isOpen,
  onClose,
  currentBannerUrl,
  onSelectCover,
}: CoverPhotoPickerModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<StockPhoto | null>(null);
  const [sourceBadge, setSourceBadge] = useState<string>("curated");
  const [isPending, startTransition] = useTransition();

  // Buscar fotos da API com debounce na busca
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchPhotos();
    }, 250);

    return () => clearTimeout(timer);
  }, [isOpen, selectedCategory, searchQuery]);

  async function fetchPhotos(randomize = false) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== "todas") {
        params.set("category", selectedCategory);
      }
      if (searchQuery.trim()) {
        params.set("q", searchQuery.trim());
      }
      if (randomize) {
        params.set("random", "true");
      }

      const res = await fetch(`/api/stock-photos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
        setSourceBadge(data.source || "curated");
      }
    } catch (err) {
      console.error("Erro ao carregar fotos de capa:", err);
    } finally {
      setLoading(false);
    }
  }

  // Fechar no ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleConfirm() {
    if (!selectedPhoto) return;
    onSelectCover(selectedPhoto.url);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="bg-[#FAF8F5] border border-[#E8E2D8] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-white px-5 sm:px-6 py-4 border-b border-[#E8E2D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF3EC] text-[#2E6B3E] flex items-center justify-center border border-[#CFE4D4]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="cover-picker-title" className="text-base sm:text-lg font-bold text-[#1C251F]">
                  Galeria de Capas em Alta Resolução
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#2E6B3E]/10 text-[#2E6B3E]">
                  Profissional
                </span>
              </div>
              <p className="text-xs text-[#637267]">
                Selecione uma imagem panorâmica para dar destaque à vitrine da sua loja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchPhotos(true)}
              title="Embaralhar fotos"
              className="p-2 rounded-xl text-[#637267] hover:text-[#1C251F] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#637267] hover:text-[#1C251F] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-[#FAF8F5] px-5 sm:px-6 py-3.5 border-b border-[#E8E2D8] space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9B90]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar capas por palavra-chave (ex: pizza, burger, sushi, churrasco, café...)"
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white border border-[#DDD6C8] text-xs sm:text-sm text-[#1C251F] placeholder:text-[#8C9B90] focus:outline-hidden focus:border-[#2E6B3E] focus:ring-2 focus:ring-[#2E6B3E]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#8C9B90] hover:text-[#1C251F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? "bg-[#2E6B3E] text-white shadow-xs"
                      : "bg-white text-[#556358] border border-[#E2DBD0] hover:bg-[#F4EFE6] hover:text-[#1C251F]"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PHOTO GRID BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-[#ECE7DC] animate-pulse border border-[#DDD6C8]"
                />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EDE7DB] text-[#8C9B90] flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#1C251F]">Nenhuma imagem encontrada</h3>
              <p className="text-xs text-[#637267] max-w-sm mx-auto">
                Tente buscar com outros termos ou selecione uma categoria diferente no filtro acima.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("todas");
                }}
                className="px-4 py-2 rounded-xl bg-white border border-[#DDD6C8] text-xs font-bold text-[#2E6B3E] hover:bg-[#F2ECE1] transition cursor-pointer"
              >
                Limpar filtros e ver todas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => {
                const isSelected = selectedPhoto?.id === photo.id;
                const isCurrent = currentBannerUrl === photo.url;

                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-[#E8E2D8] flex flex-col ${
                      isSelected
                        ? "border-[#2E6B3E] ring-3 ring-[#2E6B3E]/20 shadow-md scale-[1.01]"
                        : "border-transparent hover:border-[#2E6B3E]/40 hover:shadow-xs"
                    }`}
                  >
                    {/* Imagem */}
                    <div className="relative aspect-16/9 w-full overflow-hidden bg-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.thumb_url || photo.url}
                        alt={photo.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      {/* Gradiente sutil */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                      {/* Badge Atual / Selecionado */}
                      {isSelected ? (
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[#2E6B3E] text-white flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs">
                          Atual na Loja
                        </span>
                      ) : null}

                      {/* Título & Fotógrafo */}
                      <div className="absolute bottom-2.5 inset-x-2.5 text-white">
                        <p className="text-xs font-bold line-clamp-1 drop-shadow-xs">
                          {photo.title}
                        </p>
                        <p className="text-[10px] text-white/80 line-clamp-1">
                          Foto: {photo.photographer}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="bg-white px-5 sm:px-6 py-4 border-t border-[#E8E2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#637267] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2E6B3E]" />
            <span>
              {selectedPhoto
                ? `Selecionada: ${selectedPhoto.title} (${selectedPhoto.photographer})`
                : "Clique em uma capa para selecioná-la"}
            </span>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#DDD6C8] text-xs font-bold text-[#637267] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedPhoto}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs ${
                selectedPhoto
                  ? "bg-[#2E6B3E] text-white hover:bg-[#255732]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Usar Esta Capa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
