"use client";

import React, { useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { QrCode, Download, Printer, X } from "lucide-react";

export interface StoreQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  storeSlug: string;
  onToast?: (msg: string, type?: "success" | "error") => void;
}

export function StoreQrModal({
  isOpen,
  onClose,
  storeName,
  storeSlug,
  onToast,
}: StoreQrModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const publicStoreUrl = `https://deliplus.com.br/${storeSlug}`;

  const downloadQRCode = () => {
    const canvas = document.getElementById("store-qr-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${storeSlug}.png`;
    downloadLink.click();
    onToast?.("QR Code baixado com sucesso!");
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR Code para Mesa e Balcão"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-xs animate-in fade-in duration-200 print:static print:block print:bg-transparent print:p-0"
    >
      <div
        className="absolute inset-0 cursor-pointer print:hidden"
        onClick={onClose}
      />

      <div
        id="store-qr-print"
        className="relative z-10 w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 print:max-h-none print:overflow-visible print:bg-white print:text-[#1A241E] print:border-2 print:border-[#2E4233] print:p-8 print:shadow-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 print:border-[#E5DFD1] pb-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#1A241E] dark:text-[#F2EFE9] print:text-[#1A241E]">
              QR Code da Vitrine
            </h3>
            <p className="text-xs text-muted-foreground print:text-[#525B4E] mt-0.5 leading-relaxed">
              Imprima o display para mesas e balcão ou baixe em PNG para artes e embalagens.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar QR Code"
            className="min-h-9 min-w-9 flex items-center justify-center p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 sm:p-5 rounded-xl bg-[#F5F1E6] dark:bg-[#233127] border border-[#E5DFD1] dark:border-[#2F4234] print:bg-[#F5F1E6] print:border-[#E5DFD1]">
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-[#DFD8C8] dark:border-[#384D3D] print:border-[#DFD8C8] shrink-0">
            <QRCodeSVG value={publicStoreUrl} size={144} level="H" />
            <div className="hidden">
              <QRCodeCanvas
                id="store-qr-canvas"
                value={publicStoreUrl}
                size={512}
                level="H"
              />
            </div>
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-1.5">
              <QrCode className="w-4 h-4 text-[#B4482D] dark:text-[#FF7D4F] print:text-[#B4482D] shrink-0" />
              <span className="font-serif font-bold text-sm text-foreground print:text-[#1A241E] truncate">
                {storeName || "Sua Loja"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground print:text-[#525B4E] leading-relaxed">
              O cliente aponta a câmera do celular e acessa o cardápio direto, sem baixar aplicativo.
            </p>
            <span className="text-[11px] font-mono text-muted-foreground print:text-[#2E4233] block truncate pt-0.5">
              deliplus.com.br/{storeSlug}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={downloadQRCode}
            className="flex items-center justify-center gap-1.5 min-h-9 px-3.5 py-2 rounded-xl bg-white dark:bg-[#2A3B30] border border-[#DFD8C8] dark:border-[#384D3D] text-xs font-semibold text-foreground hover:bg-[#F8F6EF] dark:hover:bg-[#324538] transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar PNG</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCard}
            className="flex items-center justify-center gap-1.5 min-h-9 px-4 py-2 rounded-xl bg-[#2E4233] text-white text-xs font-semibold hover:bg-[#25352A] transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Display</span>
          </button>
        </div>
      </div>
    </div>
  );
}
