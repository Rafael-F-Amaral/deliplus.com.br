"use client";

import React from "react";
import {
  ModernBusinessHours,
  ModernDaySchedule,
  ScheduleShift,
} from "@/app/dashboard/settings/types";
import {
  Clock,
  Copy,
  Plus,
  Trash2,
  Sparkles,
  Moon,
  CheckCircle2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

export const WEEK_DAYS_CONFIG: {
  key: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  label: string;
  shortLabel: string;
}[] = [
  { key: "seg", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "ter", label: "Terça-feira", shortLabel: "Ter" },
  { key: "qua", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "qui", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "sex", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "sab", label: "Sábado", shortLabel: "Sáb" },
  { key: "dom", label: "Domingo", shortLabel: "Dom" },
];

export function normalizeBusinessHours(raw: any): ModernBusinessHours {
  const defaultDays = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
  const result: any = {};

  for (const day of defaultDays) {
    const dayData = raw?.[day];
    if (!dayData) {
      result[day] = {
        enabled: day !== "dom",
        shifts: [{ id: "shift-1", name: "Geral", open: "18:00", close: "23:00" }],
      };
    } else if (Array.isArray(dayData.shifts) && dayData.shifts.length > 0) {
      result[day] = {
        enabled: Boolean(dayData.enabled),
        shifts: dayData.shifts.map((s: any, idx: number) => ({
          id: s.id || `shift-${idx + 1}`,
          name: s.name || (idx === 0 ? "1º Turno" : "2º Turno"),
          open: s.open || "18:00",
          close: s.close || "23:00",
        })),
      };
    } else {
      // Converte formato legado { open, close, enabled }
      result[day] = {
        enabled: Boolean(dayData.enabled),
        shifts: [
          {
            id: "legacy",
            name: "Geral",
            open: dayData.open || "18:00",
            close: dayData.close || "23:00",
          },
        ],
      };
    }
  }

  return result as ModernBusinessHours;
}

export interface WeeklyScheduleManagerProps {
  hours: ModernBusinessHours;
  onChange: (hours: ModernBusinessHours) => void;
  onToast?: (msg: string) => void;
}

export function WeeklyScheduleManager({
  hours,
  onChange,
  onToast,
}: WeeklyScheduleManagerProps) {
  // Toggle enabled para um dia
  const handleToggleDay = (
    dayKey: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"
  ) => {
    const current = hours[dayKey];
    onChange({
      ...hours,
      [dayKey]: {
        ...current,
        enabled: !current.enabled,
      },
    });
  };

  // Alterar horário de um turno
  const handleUpdateShift = (
    dayKey: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom",
    shiftIndex: number,
    field: "open" | "close" | "name",
    value: string
  ) => {
    const dayData = hours[dayKey];
    const newShifts = [...dayData.shifts];
    newShifts[shiftIndex] = {
      ...newShifts[shiftIndex],
      [field]: value,
    };
    onChange({
      ...hours,
      [dayKey]: {
        ...dayData,
        shifts: newShifts,
      },
    });
  };

  // Adicionar segundo turno (máximo 2 turnos por dia)
  const handleAddShift = (
    dayKey: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"
  ) => {
    const dayData = hours[dayKey];
    if (dayData.shifts.length >= 2) return;
    const newShifts = [
      ...dayData.shifts,
      {
        id: `shift-${Date.now()}`,
        name: "Jantar",
        open: "18:30",
        close: "23:30",
      },
    ];
    onChange({
      ...hours,
      [dayKey]: {
        ...dayData,
        shifts: newShifts,
      },
    });
  };

  // Remover segundo turno
  const handleRemoveShift = (
    dayKey: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom",
    shiftIndex: number
  ) => {
    const dayData = hours[dayKey];
    if (dayData.shifts.length <= 1) return;
    const newShifts = dayData.shifts.filter((_, idx) => idx !== shiftIndex);
    onChange({
      ...hours,
      [dayKey]: {
        ...dayData,
        shifts: newShifts,
      },
    });
  };

  // 1-Clique: Copiar Segunda para Terça a Sexta
  const handleCopyMondayToWeekdays = () => {
    const monday = hours.seg;
    const weekdays: ("ter" | "qua" | "qui" | "sex")[] = ["ter", "qua", "qui", "sex"];
    const updated = { ...hours };
    weekdays.forEach((d) => {
      updated[d] = JSON.parse(JSON.stringify(monday));
    });
    onChange(updated);
    onToast?.("Horários de Segunda copiados para Terça a Sexta! 📋");
  };

  // 1-Clique: Replicar para Todos os Dias
  const handleCopyMondayToAll = () => {
    const monday = hours.seg;
    const allDays: ("ter" | "qua" | "qui" | "sex" | "sab" | "dom")[] = [
      "ter",
      "qua",
      "qui",
      "sex",
      "sab",
      "dom",
    ];
    const updated = { ...hours };
    allDays.forEach((d) => {
      updated[d] = JSON.parse(JSON.stringify(monday));
    });
    onChange(updated);
    onToast?.("Horários de Segunda replicados para toda a semana! ✨");
  };

  return (
    <div className="space-y-4">
      {/* Barra de Ações Rápidas (1-Clique) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F5F1E6] dark:bg-[#233127] border border-[#E5DFD1] dark:border-[#2F4234]">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 text-[#CB5A3C] shrink-0" />
          <span className="font-medium text-foreground">Ações inteligentes:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyMondayToWeekdays}
            className="flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#2A3B30] border border-[#E2DDD0] dark:border-[#384D3D] text-[#2E4233] dark:text-[#F2EFE9] hover:bg-[#F8F6EF] dark:hover:bg-[#324538] transition-colors shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#B4482D] dark:text-[#FF7D4F]" />
            <span>Copiar Seg para Dias Úteis</span>
          </button>

          <button
            type="button"
            onClick={handleCopyMondayToAll}
            className="flex items-center gap-1.5 min-h-9 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#2A3B30] border border-[#E2DDD0] dark:border-[#384D3D] text-[#2E4233] dark:text-[#F2EFE9] hover:bg-[#F8F6EF] dark:hover:bg-[#324538] transition-colors shadow-2xs cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-[#2E4233] dark:text-emerald-400" />
            <span>Replicar para Todos</span>
          </button>
        </div>
      </div>

      {/* Chips Rápidos de Status dos Dias */}
      <div className="flex flex-wrap items-center gap-1.5">
        {WEEK_DAYS_CONFIG.map(({ key, shortLabel }) => {
          const isEnabled = hours[key]?.enabled;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={Boolean(isEnabled)}
              onClick={() => handleToggleDay(key)}
              className={`min-h-9 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isEnabled
                  ? "bg-[#2E4233] dark:bg-emerald-600 text-white border-[#2E4233] dark:border-emerald-500 shadow-xs"
                  : "bg-[#F5F1E6] dark:bg-[#233127] text-muted-foreground border-[#E5DFD1] dark:border-[#2F4234] hover:border-muted-foreground"
              }`}
            >
              {shortLabel} {isEnabled ? "✓" : "—"}
            </button>
          );
        })}
      </div>

      {/* Lista Semanal de Dias com Suporte a 2 Turnos */}
      <div className="space-y-3 pt-2">
        {WEEK_DAYS_CONFIG.map(({ key, label }) => {
          const day = hours[key] || {
            enabled: false,
            shifts: [{ id: "def", name: "Geral", open: "18:00", close: "23:00" }],
          };

          return (
            <div
              key={key}
              className={`p-3.5 rounded-xl border transition-all ${
                day.enabled
                  ? "bg-[#F8F6EF] dark:bg-[#233127] border-[#E2DDD0] dark:border-[#2F4234] shadow-xs"
                  : "bg-[#F5F1E6]/60 dark:bg-[#1E2B22]/60 border-[#E5DFD1]/50 dark:border-[#2A382E]/50 opacity-60"
              }`}
            >
              {/* Topo do Dia */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2.5">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={() => handleToggleDay(key)}
                    aria-label={`${day.enabled ? "Desativar" : "Ativar"} ${label}`}
                    activeTrackColor="bg-emerald-600 dark:bg-emerald-500"
                  />
                  <span
                    className={`font-serif font-bold text-sm ${
                      day.enabled
                        ? "text-[#1A241E] dark:text-[#F2EFE9]"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {day.enabled && day.shifts.length < 2 && (
                  <button
                    type="button"
                    onClick={() => handleAddShift(key)}
                    className="flex items-center gap-1 min-h-9 px-2 rounded-lg text-[11px] font-semibold text-[#B4482D] dark:text-[#FF7D4F] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar 2º Turno (ex: Almoço / Jantar)</span>
                  </button>
                )}
              </div>

              {/* Turnos */}
              {day.enabled ? (
                <div className="space-y-2 pt-1">
                  {day.shifts.map((shift, shiftIdx) => {
                    // Detecção de virada de madrugada (close < open, ex: 19:00 -> 02:00)
                    const isOvernight = shift.close < shift.open && shift.close !== "";

                    return (
                      <div
                        key={shift.id || shiftIdx}
                        className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-[#FAF8F0] dark:bg-[#2A3B30] border border-[#E2DDD0] dark:border-[#384D3D] text-xs"
                      >
                        <span className="font-semibold text-foreground/80 min-w-[70px]">
                          {shift.name || (shiftIdx === 0 ? "1º Turno" : "2º Turno")}:
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-muted-foreground text-[11px]">Das</span>
                          <input
                            type="time"
                            value={shift.open}
                            aria-label={`Abertura de ${label} (${shift.name || "turno"})`}
                            onChange={(e) =>
                              handleUpdateShift(key, shiftIdx, "open", e.target.value)
                            }
                            className="px-2 py-1 rounded-lg border border-[#DFD8C8] dark:border-[#3E5544] bg-white dark:bg-[#324538] text-foreground font-semibold text-base lg:text-xs focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none"
                          />
                          <span className="text-muted-foreground text-[11px]">às</span>
                          <input
                            type="time"
                            value={shift.close}
                            aria-label={`Fechamento de ${label} (${shift.name || "turno"})`}
                            onChange={(e) =>
                              handleUpdateShift(key, shiftIdx, "close", e.target.value)
                            }
                            className="px-2 py-1 rounded-lg border border-[#DFD8C8] dark:border-[#3E5544] bg-white dark:bg-[#324538] text-foreground font-semibold text-base lg:text-xs focus:ring-2 focus:ring-[#CB5A3C]/20 focus:outline-none"
                          />
                        </div>

                        {/* Badge de Virada de Madrugada */}
                        {isOvernight && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            <Moon className="w-2.5 h-2.5 shrink-0" />
                            Madrugada (+1 dia)
                          </span>
                        )}

                        {/* Botão Remover Turno se for o 2º */}
                        {day.shifts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveShift(key, shiftIdx)}
                            aria-label={`Remover ${shift.name || "segundo turno"} de ${label}`}
                            className="min-h-9 min-w-9 flex items-center justify-center p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ml-auto cursor-pointer"
                            title="Remover este turno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic pl-11">
                  Fechado durante todo o dia
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
