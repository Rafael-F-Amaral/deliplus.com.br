"use client";

import React, { useEffect } from "react";
import { Save, RotateCcw, Loader2 } from "lucide-react";

export interface FloatingActionBarProps {
  isDirty: boolean;
  isSaving: boolean;
  dirtyCount?: number;
  onSave: () => void;
  onDiscard: () => void;
}

export function FloatingActionBar({
  isDirty,
  isSaving,
  dirtyCount = 1,
  onSave,
  onDiscard,
}: FloatingActionBarProps) {
  // Atalho de teclado global Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !isSaving) {
          onSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, isSaving, onSave]);

  // Alerta de antes de descarregar a página caso haja alterações
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  if (!isDirty && !isSaving) return null;

  return (
    <div
      role="region"
      aria-label="Barra de salvamento de alterações"
      className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+var(--sidebar-w,260px)/2)] lg:-translate-x-1/2 z-[55] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 w-[calc(100vw-1.5rem)] sm:w-auto sm:max-w-[calc(100vw-2rem)] px-4 sm:px-5 py-3 rounded-2xl bg-[#2E4233]/95 dark:bg-[#1B241E]/95 backdrop-blur-md border border-white/15 dark:border-[#2A382E] shadow-2xl shadow-black/35 animate-in fade-in slide-in-from-bottom-5 duration-300 print:hidden"
    >
      {/* Indicador de Alterações Pendentes */}
      <div className="flex items-center gap-2 sm:pr-2 sm:border-r sm:border-white/15 dark:sm:border-white/10 min-w-0">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
        </span>
        <span className="text-xs font-medium text-white/95">
          {dirtyCount > 1
            ? `${dirtyCount} alterações não salvas`
            : "Alterações não salvas"}
        </span>
      </div>

      {/* Botões de Ação */}
      <div className="flex items-center gap-2 ml-auto sm:ml-0">
        <button
          type="button"
          onClick={onDiscard}
          disabled={isSaving}
          className="flex items-center justify-center gap-1.5 min-h-9 px-3 py-1.5 rounded-xl text-xs font-medium text-white/85 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Descartar</span>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 min-h-9 px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#B4482D] hover:bg-[#9E3E26] text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-black/25 text-white/95 px-1.5 py-0.5 rounded-md font-mono border border-white/20">
                Ctrl+S
              </kbd>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
