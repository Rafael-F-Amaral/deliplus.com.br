"use client"

import React, { useState, useRef, useEffect } from "react"
import {
  Calendar,
  Upload,
  X,
  Check,
  Lightbulb,
  Truck,
  Store,
  ChevronDown,
} from "lucide-react"

type DayFilter = "todos" | "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom"

interface SalesDataPoint {
  day: number
  label: string
  dateStr: string
  fullDate: string
  value: number
  orders: number
}

// 31 days of May 2026 mathematically reconciled:
// Total Revenue: R$ 28.756,40 | Total Orders: 1.248 | Ticket Médio: R$ 23,04
// Peak: 25/Mai (R$ 2.350,28 - 102 pedidos) | Lowest: 06/Mai (R$ 368,64 - 16 pedidos)
const SALES_TIMELINE: SalesDataPoint[] = [
  { day: 1, label: "01 Mai", dateStr: "01/05", fullDate: "01 de Maio (Sexta • Feriado)", value: 737.28, orders: 32 },
  { day: 2, label: "02 Mai", dateStr: "02/05", fullDate: "02 de Maio (Sábado)", value: 1036.80, orders: 45 },
  { day: 3, label: "03 Mai", dateStr: "03/05", fullDate: "03 de Maio (Domingo)", value: 875.52, orders: 38 },
  { day: 4, label: "04 Mai", dateStr: "04/05", fullDate: "04 de Maio (Segunda)", value: 414.72, orders: 18 },
  { day: 5, label: "05 Mai", dateStr: "05/05", fullDate: "05 de Maio (Terça)", value: 460.80, orders: 20 },
  { day: 6, label: "06 Mai", dateStr: "06/05", fullDate: "06 de Maio (Quarta • Dia mais calmo)", value: 368.64, orders: 16 },
  { day: 7, label: "07 Mai", dateStr: "07/05", fullDate: "07 de Maio (Quinta)", value: 576.00, orders: 25 },
  { day: 8, label: "08 Mai", dateStr: "08/05", fullDate: "08 de Maio (Sexta)", value: 921.60, orders: 40 },
  { day: 9, label: "09 Mai", dateStr: "09/05", fullDate: "09 de Maio (Sábado)", value: 1221.12, orders: 53 },
  { day: 10, label: "10 Mai", dateStr: "10/05", fullDate: "10 de Maio (Domingo • Dia das Mães)", value: 1036.80, orders: 45 },
  { day: 11, label: "11 Mai", dateStr: "11/05", fullDate: "11 de Maio (Segunda)", value: 460.80, orders: 20 },
  { day: 12, label: "12 Mai", dateStr: "12/05", fullDate: "12 de Maio (Terça)", value: 506.88, orders: 22 },
  { day: 13, label: "13 Mai", dateStr: "13/05", fullDate: "13 de Maio (Quarta)", value: 599.04, orders: 26 },
  { day: 14, label: "14 Mai", dateStr: "14/05", fullDate: "14 de Maio (Quinta)", value: 737.28, orders: 32 },
  { day: 15, label: "15 Mai", dateStr: "15/05", fullDate: "15 de Maio (Sexta)", value: 1105.92, orders: 48 },
  { day: 16, label: "16 Mai", dateStr: "16/05", fullDate: "16 de Maio (Sábado)", value: 1359.36, orders: 59 },
  { day: 17, label: "17 Mai", dateStr: "17/05", fullDate: "17 de Maio (Domingo)", value: 1105.92, orders: 48 },
  { day: 18, label: "18 Mai", dateStr: "18/05", fullDate: "18 de Maio (Segunda)", value: 506.88, orders: 22 },
  { day: 19, label: "19 Mai", dateStr: "19/05", fullDate: "19 de Maio (Terça)", value: 506.88, orders: 22 },
  { day: 20, label: "20 Mai", dateStr: "20/05", fullDate: "20 de Maio (Quarta)", value: 691.20, orders: 30 },
  { day: 21, label: "21 Mai", dateStr: "21/05", fullDate: "21 de Maio (Quinta)", value: 806.40, orders: 35 },
  { day: 22, label: "22 Mai", dateStr: "22/05", fullDate: "22 de Maio (Sexta)", value: 1198.08, orders: 52 },
  { day: 23, label: "23 Mai", dateStr: "23/05", fullDate: "23 de Maio (Sábado)", value: 1474.56, orders: 64 },
  { day: 24, label: "24 Mai", dateStr: "24/05", fullDate: "24 de Maio (Domingo)", value: 1290.24, orders: 56 },
  { day: 25, label: "25 Mai", dateStr: "25/05", fullDate: "25 de Maio (Segunda • Recorde do Mês)", value: 2350.28, orders: 102 },
  { day: 26, label: "26 Mai", dateStr: "26/05", fullDate: "26 de Maio (Terça)", value: 599.04, orders: 26 },
  { day: 27, label: "27 Mai", dateStr: "27/05", fullDate: "27 de Maio (Quarta)", value: 737.28, orders: 32 },
  { day: 28, label: "28 Mai", dateStr: "28/05", fullDate: "28 de Maio (Quinta)", value: 875.52, orders: 38 },
  { day: 29, label: "29 Mai", dateStr: "29/05", fullDate: "29 de Maio (Sexta)", value: 1267.20, orders: 55 },
  { day: 30, label: "30 Mai", dateStr: "30/05", fullDate: "30 de Maio (Sábado)", value: 1589.76, orders: 69 },
  { day: 31, label: "31 Mai", dateStr: "31/05", fullDate: "31 de Maio (Domingo)", value: 1336.32, orders: 58 },
]

function getSplinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : p2

    const cp1x = p1.x + (p2.x - p0.x) * 0.16
    const cp1y = p1.y + (p2.y - p0.y) * 0.16
    const cp2x = p2.x - (p3.x - p1.x) * 0.16
    const cp2y = p2.y - (p3.y - p1.y) * 0.16

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function CardHelpTooltip({
  title,
  description,
  tip,
}: {
  title: string
  description: string
  tip?: string
}) {
  return (
    <div className="relative group inline-block">
      <div
        className="w-4.5 h-4.5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[11px] font-extrabold leading-none shadow-2xs cursor-help hover:scale-105 transition-transform shrink-0"
        aria-label={`Ajuda: ${title}`}
      >
        ?
      </div>
      <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 p-3.5 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none text-left">
        <p className="text-[12px] font-bold text-white mb-1">
          {title}
        </p>
        <p className="text-[11px] text-white/90 leading-relaxed font-normal">
          {description}
        </p>
        {tip && (
          <div className="mt-2 pt-2 border-t border-white/15 flex items-start gap-1.5 text-[11px] text-white/90 font-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1" />
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface DayHourlyData {
  label: string
  fullName: string
  totalOrders: number
  peakDescription: string
  yMax: number
  hours: number[]
}

const HOURLY_BY_DAY: Record<DayFilter, DayHourlyData> = {
  todos: {
    label: "Média",
    fullName: "Média Consolidada de Maio",
    totalOrders: 1248,
    peakDescription: "Picos: 12h-13h no almoço e 19h-21h no jantar",
    yMax: 250,
    hours: [
      12, 8, 4, 2, 3, 8, 28, 58, 96, 128, 152, 182, 232, 190, 165, 145, 128, 112, 98, 72, 52, 34, 18
    ]
  },
  seg: {
    label: "Seg",
    fullName: "Segunda-feira",
    totalOrders: 98,
    peakDescription: "Pico corporativo no almoço (12h às 13h)",
    yMax: 35,
    hours: [
      0, 0, 0, 0, 0, 1, 4, 8, 12, 18, 20, 24, 28, 22, 12, 6, 4, 3, 5, 6, 5, 2, 0
    ]
  },
  ter: {
    label: "Ter",
    fullName: "Terça-feira (Dia mais calmo)",
    totalOrders: 84,
    peakDescription: "Fluxo moderado no almoço e jantar estável",
    yMax: 30,
    hours: [
      0, 0, 0, 0, 0, 1, 2, 6, 10, 14, 16, 18, 22, 16, 8, 4, 3, 4, 8, 10, 8, 4, 0
    ]
  },
  qua: {
    label: "Qua",
    fullName: "Quarta-feira",
    totalOrders: 112,
    peakDescription: "Pico duplo: almoço executivo e futebol à noite",
    yMax: 35,
    hours: [
      1, 0, 0, 0, 0, 1, 3, 8, 12, 16, 18, 20, 25, 18, 10, 6, 5, 6, 16, 22, 18, 8, 2
    ]
  },
  qui: {
    label: "Qui",
    fullName: "Quinta-feira",
    totalOrders: 145,
    peakDescription: "Jantar aquecido e almoço consistente",
    yMax: 40,
    hours: [
      1, 0, 0, 0, 1, 1, 4, 10, 14, 20, 24, 28, 32, 24, 14, 8, 6, 8, 26, 34, 25, 12, 3
    ]
  },
  sex: {
    label: "Sex",
    fullName: "Sexta-feira (Início do fim de semana)",
    totalOrders: 248,
    peakDescription: "Grande explosão no jantar das 19h às 21h",
    yMax: 70,
    hours: [
      2, 1, 0, 0, 1, 2, 6, 12, 18, 26, 32, 40, 46, 38, 22, 16, 14, 18, 42, 58, 46, 24, 8
    ]
  },
  sab: {
    label: "Sáb",
    fullName: "Sábado (Maior movimento da semana)",
    totalOrders: 312,
    peakDescription: "Pico duplo massivo: 12h-13h (almoço) e 19h-21h (jantar)",
    yMax: 80,
    hours: [
      4, 2, 1, 0, 1, 2, 5, 10, 20, 30, 42, 54, 64, 55, 32, 24, 20, 24, 48, 68, 52, 28, 12
    ]
  },
  dom: {
    label: "Dom",
    fullName: "Domingo (Família & Delivery)",
    totalOrders: 249,
    peakDescription: "Pico no almoço de domingo e jantar antecipado",
    yMax: 65,
    hours: [
      4, 2, 1, 0, 0, 1, 2, 6, 14, 22, 36, 44, 48, 52, 36, 20, 15, 18, 44, 50, 32, 14, 6
    ]
  }
}

// Data model for Matriz Comparativa with Period Filters
type MatrizPeriod = "mes" | "sem4" | "sem3" | "sem2" | "sem1"

interface MatrizDayItem {
  name: string
  dateDetail: string
  orders: number
  revenue: string
  percent: number
  barPercent: number
  isPeak?: boolean
  isCalm?: boolean
  tag?: string
}

interface MatrizPeriodData {
  label: string
  periodName: string
  dateRange: string
  totalOrders: number
  totalRevenue: string
  peakDay: string
  calmDay: string
  insight: string
  days: MatrizDayItem[]
}

const MATRIZ_DATA: Record<MatrizPeriod, MatrizPeriodData> = {
  mes: {
    label: "Mês Completo",
    periodName: "Maio de 2026 (Consolidado)",
    dateRange: "01 a 31 de Maio, 2026",
    totalOrders: 1248,
    totalRevenue: "R$ 28.756,40",
    peakDay: "Sábado (312 pedidos)",
    calmDay: "Terça-feira (84 pedidos)",
    insight: "Sábados e domingos respondem por 45% de todo o movimento do mês. Terça-feira é o dia ideal para promoções de frete reduzido.",
    days: [
      { name: "Sábado", dateDetail: "4 sábados no mês", orders: 312, revenue: "R$ 7.189,10", percent: 25.0, barPercent: 100, isPeak: true, tag: "Pico do Mês (Almoço + Jantar)" },
      { name: "Domingo", dateDetail: "5 domingos no mês", orders: 249, revenue: "R$ 5.736,96", percent: 20.0, barPercent: 80, tag: "Família & Jantar Antecipado" },
      { name: "Sexta-feira", dateDetail: "5 sextas no mês", orders: 248, revenue: "R$ 5.713,92", percent: 19.9, barPercent: 79, tag: "Pico Noturno (19h-21h)" },
      { name: "Quinta-feira", dateDetail: "4 quintas no mês", orders: 145, revenue: "R$ 3.340,80", percent: 11.6, barPercent: 46, tag: "Jantar Aquecido" },
      { name: "Quarta-feira", dateDetail: "4 quartas no mês", orders: 112, revenue: "R$ 2.580,48", percent: 9.0, barPercent: 36, tag: "Futebol & Almoço" },
      { name: "Segunda-feira", dateDetail: "4 segundas no mês", orders: 98, revenue: "R$ 2.257,92", percent: 7.8, barPercent: 31, tag: "Almoço Corporativo" },
      { name: "Terça-feira", dateDetail: "5 terças no mês", orders: 84, revenue: "R$ 1.935,36", percent: 6.7, barPercent: 27, isCalm: true, tag: "Dia Mais Calmo" },
    ]
  },
  sem4: {
    label: "Semana 4",
    periodName: "Semana 4 (Pico de Pagamento)",
    dateRange: "22 a 28 de Maio, 2026",
    totalOrders: 395,
    totalRevenue: "R$ 9.100,80",
    peakDay: "Segunda 25/Mai (102 pedidos)",
    calmDay: "Terça 26/Mai (26 pedidos)",
    insight: "A segunda-feira 25/Mai bateu o recorde mensal com 102 pedidos graças à injeção salarial e campanha no WhatsApp.",
    days: [
      { name: "Segunda (25/Mai)", dateDetail: "Dia de pagamento / Salário", orders: 102, revenue: "R$ 2.350,28", percent: 25.8, barPercent: 100, isPeak: true, tag: "Recorde Histórico da Loja" },
      { name: "Sábado (23/Mai)", dateDetail: "Fim de semana aquecido", orders: 64, revenue: "R$ 1.474,56", percent: 16.2, barPercent: 63, tag: "Jantar Massivo" },
      { name: "Domingo (24/Mai)", dateDetail: "Delivery família", orders: 56, revenue: "R$ 1.290,24", percent: 14.2, barPercent: 55, tag: "Almoço & Jantar" },
      { name: "Sexta (22/Mai)", dateDetail: "Início do fim de semana", orders: 52, revenue: "R$ 1.198,08", percent: 13.2, barPercent: 51, tag: "Pico 19h-21h" },
      { name: "Quinta (28/Mai)", dateDetail: "Jantar consistente", orders: 38, revenue: "R$ 875,52", percent: 9.6, barPercent: 37, tag: "Forte à Noite" },
      { name: "Quarta (27/Mai)", dateDetail: "Meio de semana", orders: 32, revenue: "R$ 737,28", percent: 8.1, barPercent: 31, tag: "Almoço Executivo" },
      { name: "Terça (26/Mai)", dateDetail: "Pós-recorde", orders: 26, revenue: "R$ 599,04", percent: 6.6, barPercent: 25, isCalm: true, tag: "Retração Natural" },
    ]
  },
  sem3: {
    label: "Semana 3",
    periodName: "Semana 3",
    dateRange: "15 a 21 de Maio, 2026",
    totalOrders: 312,
    totalRevenue: "R$ 7.189,12",
    peakDay: "Sábado 16/Mai (59 pedidos)",
    calmDay: "Seg / Ter (22 pedidos cada)",
    insight: "Equilíbrio padrão: o fim de semana (Sex, Sáb e Dom) concentrou 50% de todos os pedidos da semana.",
    days: [
      { name: "Sábado (16/Mai)", dateDetail: "Pico no almoço e jantar", orders: 59, revenue: "R$ 1.359,36", percent: 18.9, barPercent: 100, isPeak: true, tag: "Pico da Semana" },
      { name: "Sexta (15/Mai)", dateDetail: "Happy hour & delivery", orders: 48, revenue: "R$ 1.105,92", percent: 15.4, barPercent: 81, tag: "Jantar Forte" },
      { name: "Domingo (17/Mai)", dateDetail: "Almoço tradicional", orders: 48, revenue: "R$ 1.105,92", percent: 15.4, barPercent: 81, tag: "Família" },
      { name: "Quinta (21/Mai)", dateDetail: "Esquenta do fim de semana", orders: 35, revenue: "R$ 806,40", percent: 11.2, barPercent: 59, tag: "Jantar" },
      { name: "Quarta (20/Mai)", dateDetail: "Jogos da rodada", orders: 30, revenue: "R$ 691,20", percent: 9.6, barPercent: 51, tag: "Futebol à Noite" },
      { name: "Terça (19/Mai)", dateDetail: "Fluxo regular", orders: 22, revenue: "R$ 506,88", percent: 7.1, barPercent: 37, tag: "Estável" },
      { name: "Segunda (18/Mai)", dateDetail: "Início de semana", orders: 22, revenue: "R$ 506,88", percent: 7.1, barPercent: 37, isCalm: true, tag: "Dia Mais Calmo" },
    ]
  },
  sem2: {
    label: "Semana 2",
    periodName: "Semana 2 (Dia das Mães)",
    dateRange: "08 a 14 de Maio, 2026",
    totalOrders: 285,
    totalRevenue: "R$ 6.566,40",
    peakDay: "Sábado 09/Mai (53 pedidos)",
    calmDay: "Segunda 11/Mai (20 pedidos)",
    insight: "Fim de semana do Dia das Mães gerou volume extraordinário no domingo 10/Mai no almoço.",
    days: [
      { name: "Sábado (09/Mai)", dateDetail: "Véspera de Dia das Mães", orders: 53, revenue: "R$ 1.221,12", percent: 18.6, barPercent: 100, isPeak: true, tag: "Pico da Semana" },
      { name: "Domingo (10/Mai)", dateDetail: "Dia das Mães Oficial", orders: 45, revenue: "R$ 1.036,80", percent: 15.8, barPercent: 85, tag: "Super Almoço Família" },
      { name: "Sexta (08/Mai)", dateDetail: "Início das celebrações", orders: 40, revenue: "R$ 921,60", percent: 14.0, barPercent: 75, tag: "Jantar" },
      { name: "Quinta (14/Mai)", dateDetail: "Fluxo padrão", orders: 32, revenue: "R$ 737,28", percent: 11.2, barPercent: 60, tag: "Jantar" },
      { name: "Quarta (13/Mai)", dateDetail: "Almoço corporativo", orders: 26, revenue: "R$ 599,04", percent: 9.1, barPercent: 49, tag: "Corporativo" },
      { name: "Terça (12/Mai)", dateDetail: "Fluxo regular", orders: 22, revenue: "R$ 506,88", percent: 7.7, barPercent: 42, tag: "Estável" },
      { name: "Segunda (11/Mai)", dateDetail: "Pós-Dia das Mães", orders: 20, revenue: "R$ 460,80", percent: 7.0, barPercent: 38, isCalm: true, tag: "Dia Mais Calmo" },
    ]
  },
  sem1: {
    label: "Semana 1",
    periodName: "Semana 1 (Feriado de 01/Mai)",
    dateRange: "01 a 07 de Maio, 2026",
    totalOrders: 256,
    totalRevenue: "R$ 5.900,08",
    peakDay: "Sábado 02/Mai (45 pedidos)",
    calmDay: "Quarta 06/Mai (16 pedidos)",
    insight: "Início do mês marcado pelo feriado de 01/Mai (Sexta) que impulsionou pedidos na primeira noite.",
    days: [
      { name: "Sábado (02/Mai)", dateDetail: "Pós-feriado", orders: 45, revenue: "R$ 1.036,80", percent: 17.6, barPercent: 100, isPeak: true, tag: "Pico da Semana" },
      { name: "Domingo (03/Mai)", dateDetail: "Fim do feriadão", orders: 38, revenue: "R$ 875,52", percent: 14.8, barPercent: 84, tag: "Almoço & Jantar" },
      { name: "Sexta (01/Mai)", dateDetail: "Feriado do Trabalhador", orders: 32, revenue: "R$ 737,28", percent: 12.5, barPercent: 71, tag: "Feriado Nacional" },
      { name: "Quinta (07/Mai)", dateDetail: "Fluxo de rotina", orders: 25, revenue: "R$ 576,00", percent: 9.8, barPercent: 56, tag: "Jantar" },
      { name: "Terça (05/Mai)", dateDetail: "Retomada", orders: 20, revenue: "R$ 460,80", percent: 7.8, barPercent: 44, tag: "Estável" },
      { name: "Segunda (04/Mai)", dateDetail: "Primeira segunda útil", orders: 18, revenue: "R$ 414,72", percent: 7.0, barPercent: 40, tag: "Almoço" },
      { name: "Quarta (06/Mai)", dateDetail: "Dia atípico mais calmo", orders: 16, revenue: "R$ 368,64", percent: 6.3, barPercent: 36, isCalm: true, tag: "Dia Mais Calmo do Mês" },
    ]
  }
}

// Stateful Content for Matriz Comparativa Modal
function MatrizComparativaModalContent() {
  const [selectedPeriod, setSelectedPeriod] = useState<MatrizPeriod>("mes")
  const activeData = MATRIZ_DATA[selectedPeriod]

  return (
    <div className="space-y-3.5 text-xs">
      {/* Interactive Period Selector Filter */}
      <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[11px] font-bold text-[#1F2E22] uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#CB5A3C]" />
            Filtrar por Mês ou Semana:
          </span>
          <span className="text-[10px] font-semibold text-[#CB5A3C] bg-[#FDF0E9] px-2 py-0.5 rounded-full">
            {activeData.dateRange}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {(
            [
              { id: "mes", label: "Mês (Maio)" },
              { id: "sem4", label: "Semana 4" },
              { id: "sem3", label: "Semana 3" },
              { id: "sem2", label: "Semana 2" },
              { id: "sem1", label: "Semana 1" },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPeriod(p.id)}
              className={`py-1.5 px-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center ${
                selectedPeriod === p.id
                  ? "bg-[#CB5A3C] text-white shadow-xs"
                  : "bg-white text-[#2E4233] border border-[#E9E4D4] hover:border-[#CB5A3C]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Executive Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Pedidos no Período</span>
          <span className="font-bold text-[#1F2E22] text-sm sm:text-base">{activeData.totalOrders} pedidos</span>
        </div>
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Faturamento</span>
          <span className="font-bold text-[#CB5A3C] text-sm sm:text-base">{activeData.totalRevenue}</span>
        </div>
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Dia Mais Forte</span>
          <span className="font-bold text-[#15803D] text-xs sm:text-sm truncate block">{activeData.peakDay}</span>
        </div>
      </div>

      {/* Day by Day Breakdown with High-Contrast Progress Bars */}
      <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {activeData.days.map((d, i) => (
          <div
            key={i}
            className={`p-2 rounded-xl border transition-all ${
              d.isPeak
                ? "bg-[#FDF0E9]/70 border-[#F4D6C7]"
                : d.isCalm
                ? "bg-[#FAF8F0]/70 border-[#E9E4D4]"
                : "bg-white border-[#F0ECE1]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-[#111827]">
                    {d.name}
                  </span>
                  {d.tag && (
                    <span
                      className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                        d.isPeak
                          ? "bg-[#CB5A3C] text-white"
                          : d.isCalm
                          ? "bg-[#2E4233]/10 text-[#2E4233]"
                          : "bg-[#EBF5EE] text-[#15803D]"
                      }`}
                    >
                      {d.tag}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#525B4E] block mt-0.5">
                  {d.dateDetail}
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-xs sm:text-sm text-[#1F2E22]">
                  {d.orders} pedidos
                </span>
                <span className="text-[10px] font-semibold text-[#CB5A3C] block">
                  {d.revenue} ({d.percent.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Visual Proportional Bar */}
            <div className="w-full bg-[#EFECE3] h-2 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  d.isPeak ? "bg-[#CB5A3C]" : "bg-[#2E4233]"
                }`}
                style={{ width: `${d.barPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stateful Content for Curva ABC Modal with Enlarged, Clear Typography
function CurvaAbcModalContent() {
  const products = [
    { rank: 1, name: "Bowl Frango Oriental", cat: "Prato Principal", margin: "68% de margem", qty: 456, revenue: "R$ 14.592,00", share: 25.4, isTop: true },
    { rank: 2, name: "Moqueca de Camarão", cat: "Prato Principal", margin: "58% de margem", qty: 352, revenue: "R$ 13.728,00", share: 23.9, isTop: true },
    { rank: 3, name: "Lasanha à Bolonhesa", cat: "Massas", margin: "62% de margem", qty: 298, revenue: "R$ 8.940,00", share: 15.5 },
    { rank: 4, name: "Escondidinho de Carne", cat: "Tradicionais", margin: "65% de margem", qty: 274, revenue: "R$ 7.672,00", share: 13.3 },
    { rank: 5, name: "Salada Caesar", cat: "Entradas/Fit", margin: "72% de margem", qty: 241, revenue: "R$ 5.784,00", share: 10.1 },
    { rank: 6, name: "Suco de Laranja 500ml", cat: "Bebidas", margin: "78% de margem", qty: 210, revenue: "R$ 2.100,00", share: 3.7 },
  ]

  return (
    <div className="space-y-3.5">
      {/* Executive Highlight Banner */}
      <div className="bg-[#FAF8F0] p-3 rounded-xl border border-[#E9E4D4] flex items-center justify-between gap-3">
        <div>
          <span className="font-bold text-xs sm:text-sm text-[#111827] block">
            Top 2 produtos concentram 49,3% do faturamento
          </span>
          <p className="text-[11px] text-[#525B4E] mt-0.5">
            O Bowl Frango Oriental e a Moqueca de Camarão sustentam a lucratividade da sua operação.
          </p>
        </div>
        <div className="text-right shrink-0 bg-[#EBF5EE] px-3 py-1.5 rounded-lg border border-[#DCFCE7]">
          <span className="text-[10px] text-[#15803D] font-bold block">Margem Média</span>
          <span className="text-base font-bold text-[#15803D]">63,5%</span>
        </div>
      </div>

      {/* Enlarged Product List */}
      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((item) => (
          <div
            key={item.rank}
            className={`p-2.5 rounded-xl border transition-all ${
              item.isTop ? "bg-[#FDF0E9]/60 border-[#F4D6C7]" : "bg-white border-[#E9E4D4]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.rank === 1
                      ? "bg-[#CB5A3C] text-white shadow-2xs"
                      : item.rank === 2
                      ? "bg-[#2E4233] text-white shadow-2xs"
                      : "bg-[#2E4233]/10 text-[#2E4233]"
                  }`}
                >
                  {item.rank}
                </span>
                <div className="min-w-0">
                  <span className="text-sm sm:text-base font-bold text-[#111827] block truncate">
                    {item.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] text-[#525B4E] font-medium">{item.cat}</span>
                    <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] px-2 py-0.2 rounded-full">
                      {item.margin}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm sm:text-base font-bold text-[#CB5A3C] block">
                  {item.revenue}
                </span>
                <span className="text-xs font-bold text-[#1F2E22]">
                  {item.qty} unidades <span className="text-[10px] text-[#525B4E] font-normal">({item.share}% do total)</span>
                </span>
              </div>
            </div>

            {/* Revenue Contribution Bar */}
            <div className="w-full bg-[#EFECE3] h-2 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  item.rank === 1 ? "bg-[#CB5A3C]" : "bg-[#2E4233]"
                }`}
                style={{ width: `${item.share * 3.8}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stateful Content for Repetição de Clientes Modal with Prominent & Attractive Visuals
function RepeticaoModalContent() {
  const loyaltyItems = [
    { rank: 1, name: "Bowl Frango Oriental", repeat: "68%", badge: "Super Fidelidade", buyers: 310, repeatBuyers: 211, cadence: "Pede a cada 9 dias", tip: "Disparo no 9º dia pelo WhatsApp converte 42%" },
    { rank: 2, name: "Moqueca de Camarão", repeat: "54%", badge: "Alta Recompra", buyers: 260, repeatBuyers: 140, cadence: "Pede a cada 12 dias", tip: "Prato favorito no almoço de domingo" },
    { rank: 3, name: "Lasanha à Bolonhesa", repeat: "48%", badge: "Consistente", buyers: 210, repeatBuyers: 101, cadence: "Pede a cada 14 dias", tip: "Forte recompra no jantar de sábado" },
    { rank: 4, name: "Escondidinho de Carne", repeat: "42%", badge: "Regular", buyers: 180, repeatBuyers: 76, cadence: "Pede a cada 15 dias", tip: "Excelente giro em dias de semana" },
    { rank: 5, name: "Salada Caesar", repeat: "35%", badge: "Acompanhamento", buyers: 150, repeatBuyers: 52, cadence: "Pede a cada 8 dias", tip: "Cliente fit pede junto com grelhados" },
  ]

  return (
    <div className="space-y-3.5">
      {/* 3 Executive Retention Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Clientes Cadastrados</span>
          <span className="font-bold text-[#1F2E22] text-sm sm:text-base">1.239 únicos</span>
          <span className="text-[9px] text-[#15803D] font-bold block mt-0.5">100% WhatsApp ID</span>
        </div>
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Clientes Fiéis (Recompra)</span>
          <span className="font-bold text-[#CB5A3C] text-sm sm:text-base">389 clientes</span>
          <span className="text-[9px] text-[#CB5A3C] font-bold block mt-0.5">31,4% de retenção</span>
        </div>
        <div className="bg-[#FAF8F0] p-2.5 rounded-xl border border-[#E9E4D4]">
          <span className="text-[10px] text-[#525B4E] block">Ciclo Médio de Retorno</span>
          <span className="font-bold text-[#2E4233] text-sm sm:text-base">11 dias</span>
          <span className="text-[9px] text-[#525B4E] font-medium block mt-0.5">Entre um pedido e outro</span>
        </div>
      </div>

      {/* Product Loyalty Cards */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loyaltyItems.map((item) => (
          <div
            key={item.rank}
            className={`p-2.5 rounded-xl border transition-all ${
              item.rank === 1 ? "bg-[#FDF0E9]/60 border-[#F4D6C7]" : "bg-white border-[#E9E4D4]"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    item.rank === 1 ? "bg-[#CB5A3C] text-white" : "bg-[#2E4233]/10 text-[#2E4233]"
                  }`}
                >
                  {item.rank}
                </span>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-[#111827] block truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-[#525B4E] block">
                    {item.cadence} • {item.repeatBuyers} de {item.buyers} clientes repetiram
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-[#CB5A3C] block leading-none">
                  {item.repeat}
                </span>
                <span className="text-[9px] font-semibold text-[#15803D] bg-[#DCFCE7] px-2 py-0.2 rounded-full inline-block mt-1">
                  {item.badge}
                </span>
              </div>
            </div>

            {/* Loyalty Bar: 2 Colors (Repeat Buyers vs Single Buyers) */}
            <div className="w-full bg-[#EFECE3] h-2 rounded-full overflow-hidden mt-2 flex">
              <div
                className="h-full bg-[#CB5A3C] rounded-l-full"
                style={{ width: item.repeat }}
              />
              <div
                className="h-full bg-[#2E4233]/30 rounded-r-full"
                style={{ width: `${100 - parseInt(item.repeat, 10)}%` }}
              />
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#525B4E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0" />
              <span>{item.tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface DetailModalState {
  isOpen: boolean
  title: string
  subtitle?: string
  content: React.ReactNode
  actionIdea?: string
}

export function ReportsView() {
  const [selectedDateLabel, setSelectedDateLabel] = useState("01 Mai - 31 Mai, 2026")
  const [startDate, setStartDate] = useState("2026-05-01")
  const [endDate, setEndDate] = useState("2026-05-31")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)

  const [selectedDay, setSelectedDay] = useState<DayFilter>("todos")
  const [hoveredHourIndex, setHoveredHourIndex] = useState<number | null>(null)
  const [selectedHourIndex, setSelectedHourIndex] = useState<number | null>(null)
  const [modal, setModal] = useState<DetailModalState>({
    isOpen: false,
    title: "",
    content: null,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  // Close calendar popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isCalendarOpen])

  // Coordinates for the 31-day Sales Line Chart (SVG viewBox 0 0 600 240)
  const chartLeft = 65
  const chartRight = 585
  const chartTop = 26
  const chartBottom = 195
  const chartPoints = SALES_TIMELINE.map((pt, i) => {
    const x = chartLeft + (i / 30) * (chartRight - chartLeft)
    const y = chartBottom - (pt.value / 2500) * (chartBottom - chartTop)
    return { x, y }
  })
  const splineLineD = getSplinePath(chartPoints)
  const areaPathD = `${splineLineD} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${chartBottom} L ${chartPoints[0].x.toFixed(1)} ${chartBottom} Z`

  // Real PDF generator using jsPDF
  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const { default: jsPDF } = await import("jspdf")
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF()

      // Header
      doc.setFillColor(74, 88, 55)
      doc.rect(0, 0, 210, 24, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("DELIPLUS — Relatório Gerencial de Performance", 14, 16)

      // Subheader
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(`Período: Maio/2026 | Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 34)

      // Summary KPIs
      autoTable(doc, {
        startY: 40,
        head: [["Indicador Principal", "Resultado", "Variação vs Mês Anterior", "Diagnóstico"]],
        body: [
          ["Vendas Totais", "R$ 28.756,40", "+18,6%", "Crescimento acelerado"],
          ["Total de Pedidos", "1.248 pedidos", "+15,2%", "Meta superada"],
          ["Novos Clientes (WhatsApp)", "342 clientes", "+22,1%", "Excelente aquisição"],
          ["Taxa de Recompra (WhatsApp)", "31,4% (389 clientes fiéis)", "+4,3% de aumento", "Fidelização sólida"],
        ],
        theme: "grid",
        headStyles: { fillColor: [74, 88, 55], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 4 },
      })

      // Channels breakdown (Delivery vs Retirada)
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 85

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(40, 40, 40)
      doc.text("Canais de Venda: Delivery vs Retirada no Local", 14, finalY + 12)

      autoTable(doc, {
        startY: finalY + 16,
        head: [["Canal de Entrega", "Faturamento", "Participação", "Qtd Pedidos", "Ticket Médio"]],
        body: [
          ["Delivery (Entrega a Domicílio)", "R$ 22.142,40", "77,0%", "961 pedidos", "R$ 23,04"],
          ["Retirada no Local (Balcão)", "R$ 6.614,00", "23,0%", "287 pedidos", "R$ 23,04"],
        ],
        theme: "striped",
        headStyles: { fillColor: [188, 90, 54], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3.5 },
      })

      // Repurchase & Repeat Products
      const finalY2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || 135

      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(40, 40, 40)
      doc.text("Produtos com Maior Taxa de Repetição pelos Clientes (WhatsApp)", 14, finalY2 + 12)

      autoTable(doc, {
        startY: finalY2 + 16,
        head: [["#", "Produto", "Taxa de Repetição", "Total Vendido", "Comportamento do Cliente"]],
        body: [
          ["1", "Bowl Frango Oriental", "68%", "456 unidades", "Cliente pede o mesmo produto de novo"],
          ["2", "Moqueca de Camarão", "54%", "352 unidades", "Alta fidelidade ao prato"],
          ["3", "Lasanha à Bolonhesa", "48%", "298 unidades", "Forte recompra no jantar"],
          ["4", "Escondidinho de Carne", "42%", "274 unidades", "Consistente no almoço"],
          ["5", "Salada Caesar", "35%", "241 unidades", "Excelente giro semanal"],
        ],
        theme: "grid",
        headStyles: { fillColor: [74, 88, 55], textColor: [255, 255, 255], fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3.5 },
      })

      doc.save("Relatorio-Gerencial-DeliPlus-Maio.pdf")
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 3500)
    } catch (err) {
      console.error("Erro ao gerar PDF:", err)
    } finally {
      setIsExporting(false)
    }
  }

  const openDetail = (title: string, content: React.ReactNode, subtitle?: string, actionIdea?: string) => {
    setModal({ isOpen: true, title, subtitle, content, actionIdea })
  }

  // Active day data for hourly chart
  const activeDayData = HOURLY_BY_DAY[selectedDay]
  const activeHour = hoveredHourIndex !== null ? hoveredHourIndex : selectedHourIndex

  return (
    <div className="w-full flex-1 flex flex-col bg-[#FAF8F0] text-[#2E4233] px-3 sm:px-6 py-2.5 sm:py-3.5 font-sans overflow-y-auto lg:overflow-hidden min-h-0">
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col min-h-0 gap-2.5 sm:gap-3">

        {/* Top Header: Standardized to Cardápio, Pedidos, Estoque (3xl md:4xl font-serif text-[#CB5A3C]) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2.5">
              <h1 className="text-3xl md:text-4xl font-serif text-[#CB5A3C] tracking-tight">
                Relatórios
              </h1>

              {/* Tooltip Icon & Popover (Identical to Cardápio & Pedidos) */}
              <div className="relative group inline-block">
                <div className="w-5 h-5 rounded-full bg-[#2E4233] text-white flex items-center justify-center text-[12px] font-extrabold leading-none shadow-sm cursor-help hover:scale-105 transition-transform">
                  ?
                </div>
                <div className="absolute top-full left-0 mt-2 w-80 p-4 bg-[#2E4233] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                  <p className="text-[13px] text-white mb-2 leading-relaxed">
                    <span className="font-extrabold text-white">Dica:</span> Acompanhe métricas consolidadas de vendas, horários de maior fluxo e taxa de repetição da sua loja.
                  </p>
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/10 text-[12px] text-white">
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span>Filtre dados por períodos ou selecione dias específicos no calendário.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span>Analise a curva de vendas diárias e os produtos mais comprados da cozinha.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CB5A3C] shrink-0 mt-1.5" />
                      <span>Exporte relatórios gerenciais em PDF prontos com um clique.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[#2E4233] text-xs sm:text-sm font-medium mt-0.5">
              Inteligência de vendas, recorrência de clientes e horários de pico.
            </p>
          </div>

          <div className="flex items-center gap-2 relative shrink-0" ref={calendarRef}>
            {/* Date Selector Pill */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E9E4D4] hover:border-[#2E4233] text-[#2E4233] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
              title="Abrir calendário e selecionar dias"
            >
              <Calendar className="w-3.5 h-3.5 text-[#CB5A3C]" />
              <span>{selectedDateLabel}</span>
              <ChevronDown className={`w-3 h-3 text-[#717A6D] transition-transform ${isCalendarOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Export button */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#CB5A3C] hover:bg-[#B34D33] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-70"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Baixado!</span>
                </>
              ) : isExporting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </>
              )}
            </button>

            {/* Interactive Calendar Dropdown / Popover */}
            {isCalendarOpen && (
              <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-[#E9E4D4] rounded-2xl shadow-xl p-3.5 w-[330px] sm:w-[440px] animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F0ECE1]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#CB5A3C]" />
                    <span className="text-sm font-bold text-[#2E4233]">Selecionar Período ou Dia</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-[#F5F3ED] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5">
                  {/* Quick presets list */}
                  <div className="sm:col-span-4 space-y-1 sm:border-r sm:border-[#F0ECE1] sm:pr-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Atalhos rápidos
                    </span>
                    {[
                      { id: "hoje", label: "Hoje (17 Mai)", start: "2026-05-17", end: "2026-05-17" },
                      { id: "ontem", label: "Ontem (16 Mai)", start: "2026-05-16", end: "2026-05-16" },
                      { id: "ultimos7", label: "Últimos 7 dias", start: "2026-05-11", end: "2026-05-17" },
                      { id: "semana", label: "Esta semana", start: "2026-05-11", end: "2026-05-17" },
                      { id: "mes", label: "Este mês (Maio)", start: "2026-05-01", end: "2026-05-31" },
                      { id: "mes_ant", label: "Mês anterior (Abril)", start: "2026-04-01", end: "2026-04-30" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedDateLabel(item.label)
                          setStartDate(item.start)
                          setEndDate(item.end)
                          setIsCalendarOpen(false)
                        }}
                        className="w-full text-left px-2 py-1 rounded-lg text-xs font-medium text-gray-700 hover:bg-[#FAF8F0] hover:text-[#2E4233] transition-colors cursor-pointer"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Visual Mini Calendar for Maio 2026 */}
                  <div className="sm:col-span-8">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#2E4233]">Maio de 2026</span>
                      <span className="text-[10px] font-semibold text-[#CB5A3C] bg-[#FDF0E9] px-2 py-0.2 rounded-full">
                        Clique em qualquer dia
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
                      <span>D</span>
                      <span>S</span>
                      <span>T</span>
                      <span>Q</span>
                      <span>Q</span>
                      <span>S</span>
                      <span>S</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                      <div className="h-6" />
                      <div className="h-6" />
                      <div className="h-6" />
                      <div className="h-6" />
                      <div className="h-6" />

                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                        const dayStr = day < 10 ? `0${day}` : `${day}`
                        const isSelected = startDate === `2026-05-${dayStr}`
                        const isPeak = day === 25

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setSelectedDateLabel(`Dia ${dayStr} de Maio, 2026`)
                              setStartDate(`2026-05-${dayStr}`)
                              setEndDate(`2026-05-${dayStr}`)
                              setIsCalendarOpen(false)
                            }}
                            className={`h-6 w-full rounded-md text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer relative ${
                              isSelected
                                ? "bg-[#2E4233] text-white font-bold"
                                : isPeak
                                ? "bg-[#FDF0E9] text-[#CB5A3C] font-bold hover:bg-[#FCE3D6]"
                                : "text-gray-700 hover:bg-[#FAF8F0]"
                            }`}
                            title={isPeak ? `Dia 25 (Pico de Vendas: R$ 2.350)` : `Selecionar dia ${dayStr}/05`}
                          >
                            {day}
                            {isPeak && !isSelected && (
                              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#CB5A3C]" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Date range inputs */}
                    <div className="mt-2.5 pt-2 border-t border-[#F0ECE1] grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-semibold text-gray-500 mb-0.5">De</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full text-xs px-2 py-0.5 rounded-md border border-[#E9E4D4] bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-gray-500 mb-0.5">Até</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full text-xs px-2 py-0.5 rounded-md border border-[#E9E4D4] bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCalendarOpen(false)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateLabel(`${startDate.split("-").reverse().slice(0, 2).join("/")} a ${endDate.split("-").reverse().slice(0, 2).join("/")}`)
                          setIsCalendarOpen(false)
                        }}
                        className="px-3 py-1 bg-[#2E4233] hover:bg-[#1E2D22] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 1: 3 Balanced Metric Cards (Shrink-0: Crisp & Stable) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
          {/* Card 1: Vendas */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#CB5A3C] uppercase tracking-wider">Vendas</span>
              <span className="text-xs text-[#525B4E]">Ticket Médio: <strong className="text-[#1F2E22] font-semibold">R$ 23,04</strong></span>
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-medium text-[#1F2E22] tracking-tight">
                R$ 28.756,40
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-[#15803D] font-semibold bg-[#DCFCE7] px-2 py-0.2 rounded-full flex items-center gap-0.5">
                  ↑ 18,6%
                </span>
                <span className="text-[#525B4E]">vs. mês anterior</span>
              </div>
            </div>
          </div>

          {/* Card 2: Pedidos */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#CB5A3C] uppercase tracking-wider">Pedidos</span>
              <span className="text-xs text-[#525B4E]">Média / Dia: <strong className="text-[#CB5A3C] font-semibold">40,2</strong></span>
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-medium text-[#1F2E22] tracking-tight">
                1.248
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-[#15803D] font-semibold bg-[#DCFCE7] px-2 py-0.2 rounded-full flex items-center gap-0.5">
                  ↑ 15,2%
                </span>
                <span className="text-[#525B4E]">vs. mês anterior</span>
              </div>
            </div>
          </div>

          {/* Card 3: Novos clientes via WhatsApp */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#CB5A3C] uppercase tracking-wider">Novos clientes</span>
              <span className="text-[11px] font-semibold text-[#15803D] bg-[#DCFCE7] px-2 py-0.2 rounded-full">
                WhatsApp 100% ID
              </span>
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-medium text-[#1F2E22] tracking-tight">
                342
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs">
                <span className="text-[#15803D] font-semibold bg-[#DCFCE7] px-2 py-0.2 rounded-full flex items-center gap-0.5">
                  ↑ 22,1%
                </span>
                <span className="text-[#525B4E]">vs. mês anterior</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: 3 Main Cards (Fills Available Height Flexibly) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 sm:gap-3 flex-[1.35] min-h-0">

          {/* Card 1: Vendas ao longo do tempo */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between min-h-0 h-full">
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-[#CB5A3C] truncate">Vendas ao longo do tempo</h3>
                  <CardHelpTooltip
                    title="Vendas ao longo do tempo"
                    description="Acompanhe a curva diária de faturamento da sua loja no mês. Identifique picos de vendas e períodos de menor movimento para programar promoções."
                    tip="Passe o cursor sobre os pontos da curva para inspecionar os valores e pedidos de cada dia."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openDetail(
                    "Detalhamento Completo de Vendas",
                    (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-3 gap-2 bg-[#F9F8F5] p-2.5 rounded-lg border border-[#EDEAE3]">
                          <div>
                            <span className="text-[#717A6D] block">Melhor Dia</span>
                            <span className="font-bold text-[#2E4233] text-sm">25/Mai: R$ 2.350</span>
                          </div>
                          <div>
                            <span className="text-[#717A6D] block">Média Diária</span>
                            <span className="font-bold text-[#111827] text-sm">R$ 927,60</span>
                          </div>
                          <div>
                            <span className="text-[#717A6D] block">Dia Mais Calmo</span>
                            <span className="font-bold text-[#CB5A3C] text-sm">06/Mai: R$ 368</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between py-1.5 border-b border-[#F0ECE1] font-medium">
                            <span>Semana 4 (22 a 28 mai) — Pico</span>
                            <span className="font-bold text-[#2E4233]">R$ 9.100,80 (32%)</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-[#F0ECE1]">
                            <span>Semana 3 (15 a 21 mai)</span>
                            <span>R$ 7.189,12 (25%)</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-[#F0ECE1]">
                            <span>Semana 2 (08 a 14 mai)</span>
                            <span>R$ 6.566,40 (23%)</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-[#F0ECE1]">
                            <span>Semana 1 (01 a 07 mai)</span>
                            <span>R$ 5.900,08 (20%)</span>
                          </div>
                        </div>
                      </div>
                    ),
                    "Faturamento consolidado por semanas e picos",
                    "A última semana do mês concentra o maior volume graças aos pagamentos salariais. Crie campanhas de combos família nessa semana para maximizar o ticket médio."
                  )}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  Ver detalhes &gt;
                </button>
              </div>

              {/* Status Strip: Clear un-abbreviated labels */}
              <div className="mt-1.5 min-h-[30px] flex items-center justify-between rounded-lg px-2.5 py-1 text-xs transition-all border border-[#E9E4D4] bg-[#FAF8F0]">
                {hoveredPointIndex !== null ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#CB5A3C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {SALES_TIMELINE[hoveredPointIndex].dateStr}
                      </span>
                      <span className="font-semibold text-[#1F2E22] text-[11px] truncate">
                        {SALES_TIMELINE[hoveredPointIndex].fullDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-[#CB5A3C]">
                        R$ {SALES_TIMELINE[hoveredPointIndex].value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-medium text-[#1F2E22] bg-white px-2 py-0.5 rounded-full border border-[#E9E4D4]">
                        {SALES_TIMELINE[hoveredPointIndex].orders} pedidos
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-[#525B4E]">Total:</span>
                      <strong className="text-[#1F2E22] font-bold text-xs sm:text-sm">R$ 28.756,40</strong>
                    </div>
                    <div className="h-3 w-px bg-[#E9E4D4]" />
                    <div className="flex items-center gap-1">
                      <span className="text-[#525B4E]">Pico:</span>
                      <strong className="text-[#CB5A3C] font-bold text-xs sm:text-sm">25/Mai (R$ 2.350)</strong>
                    </div>
                    <div className="h-3 w-px bg-[#E9E4D4] hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="text-[#525B4E]">Média:</span>
                      <strong className="text-[#1F2E22] font-semibold text-xs sm:text-sm">R$ 927/dia</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SVG Line / Area chart: Flexible to Card Height */}
            <div className="flex-1 min-h-0 relative w-full mt-2 flex items-center justify-center">
              <svg
                viewBox="0 0 600 240"
                className="w-full h-full max-h-full select-none cursor-crosshair overflow-visible"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const svgX = ((e.clientX - rect.left) / rect.width) * 600
                  let closestIdx = 0
                  let minDiff = 9999
                  chartPoints.forEach((pt, idx) => {
                    const diff = Math.abs(pt.x - svgX)
                    if (diff < minDiff) {
                      minDiff = diff
                      closestIdx = idx
                    }
                  })
                  setHoveredPointIndex(closestIdx)
                }}
                onMouseLeave={() => setHoveredPointIndex(null)}
              >
                <defs>
                  <linearGradient id="modernVendasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#CB5A3C" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#CB5A3C" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Y-axis Grid lines & High-contrast readable values */}
                {[
                  { label: "R$ 2.500", y: 26 },
                  { label: "R$ 2.000", y: 60 },
                  { label: "R$ 1.500", y: 94 },
                  { label: "R$ 1.000", y: 127 },
                  { label: "R$ 500", y: 161 },
                  { label: "R$ 0", y: 195 },
                ].map((grid, idx) => (
                  <g key={idx}>
                    <text
                      x="58"
                      y={grid.y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill="#1F2E22"
                      fontFamily="sans-serif"
                    >
                      {grid.label}
                    </text>
                    <line
                      x1="65"
                      y1={grid.y}
                      x2="585"
                      y2={grid.y}
                      stroke={idx === 5 ? "#CEC7B6" : "#E2DCD0"}
                      strokeWidth={idx === 5 ? "1.5" : "1"}
                      strokeDasharray={idx === 5 ? "0" : "4 4"}
                    />
                  </g>
                ))}

                {/* Translucent Area Gradient */}
                <path
                  d={areaPathD}
                  fill="url(#modernVendasGrad)"
                />

                {/* Main Spline Stroke */}
                <path
                  d={splineLineD}
                  fill="none"
                  stroke="#2E4233"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Peak Dot & Elevated Pill Badge on Day 25 */}
                <g transform={`translate(${chartPoints[24].x}, ${chartPoints[24].y})`}>
                  <circle cx="0" cy="0" r="7" fill="#CB5A3C" opacity="0.25" />
                  <circle cx="0" cy="0" r="4.5" fill="#CB5A3C" stroke="#FFFFFF" strokeWidth="2" />
                  <g transform="translate(0, -25)">
                    <rect x="-36" y="-12" width="72" height="22" rx="11" fill="#CB5A3C" />
                    <polygon points="-4,10 4,10 0,14" fill="#CB5A3C" />
                    <text x="0" y="3" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                      R$ 2.350
                    </text>
                  </g>
                </g>

                {/* Latest Day Dot on Day 31 */}
                <circle cx={chartPoints[30].x} cy={chartPoints[30].y} r="4" fill="#2E4233" stroke="#FFFFFF" strokeWidth="2" />

                {/* Interactive Scrubbing Cursor Line & Active Point */}
                {hoveredPointIndex !== null && (
                  <g>
                    <line
                      x1={chartPoints[hoveredPointIndex].x}
                      y1="26"
                      x2={chartPoints[hoveredPointIndex].x}
                      y2="195"
                      stroke="#CB5A3C"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={chartPoints[hoveredPointIndex].x}
                      cy={chartPoints[hoveredPointIndex].y}
                      r="6"
                      fill="#CB5A3C"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                    />
                  </g>
                )}

                {/* X-axis Baseline & High-contrast Date labels */}
                {(
                  [
                    { dayIdx: 0, label: "01 Mai", anchor: "start" },
                    { dayIdx: 4, label: "05 Mai", anchor: "middle" },
                    { dayIdx: 9, label: "10 Mai", anchor: "middle" },
                    { dayIdx: 14, label: "15 Mai", anchor: "middle" },
                    { dayIdx: 19, label: "20 Mai", anchor: "middle" },
                    { dayIdx: 24, label: "25 Mai (Pico)", anchor: "middle" },
                    { dayIdx: 30, label: "31 Mai", anchor: "end" },
                  ] as const
                ).map((item, idx) => (
                  <g key={idx}>
                    <line
                      x1={chartPoints[item.dayIdx].x}
                      y1="195"
                      x2={chartPoints[item.dayIdx].x}
                      y2="201"
                      stroke="#717A6D"
                      strokeWidth="1.5"
                    />
                    <text
                      x={chartPoints[item.dayIdx].x}
                      y="222"
                      textAnchor={item.anchor}
                      fontSize="12"
                      fontWeight={item.dayIdx === 24 ? "700" : "600"}
                      fill={item.dayIdx === 24 ? "#CB5A3C" : "#1F2E22"}
                      fontFamily="sans-serif"
                    >
                      {item.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Card 2: Produtos mais vendidos */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between min-h-0 h-full">
            <div className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#CB5A3C]">Produtos mais vendidos</h3>
                  <CardHelpTooltip
                    title="Produtos mais vendidos"
                    description="Ranking dos itens mais pedidos da cozinha e seu volume total de saída no período (Curva ABC)."
                    tip="Os 2 itens mais vendidos concentram quase 50% de todo o faturamento da sua loja."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openDetail(
                    "Curva ABC e Rentabilidade de Produtos",
                    <CurvaAbcModalContent />,
                    "Engenharia de cardápio e margem de contribuição",
                    "Crie um 'Combo Campeão' juntando o Bowl Frango Oriental com a Salada Caesar e uma bebida por R$ 49,90. Isso aumenta o ticket médio sem queimar margem bruta."
                  )}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Ver detalhes &gt;
                </button>
              </div>
            </div>

            {/* Top Products: Evenly Distributed Vertically */}
            <div className="flex-1 min-h-0 flex flex-col justify-between my-2 gap-1">
              {[
                { rank: 1, name: "Bowl Frango Oriental", category: "Prato Principal", count: 456, revenue: "R$ 14.592", percent: 100 },
                { rank: 2, name: "Moqueca de Camarão", category: "Prato Principal", count: 352, revenue: "R$ 13.728", percent: 77 },
                { rank: 3, name: "Lasanha à Bolonhesa", category: "Massas", count: 298, revenue: "R$ 8.940", percent: 65 },
                { rank: 4, name: "Escondidinho de Carne", category: "Tradicionais", count: 274, revenue: "R$ 7.672", percent: 60 },
                { rank: 5, name: "Salada Caesar", category: "Entradas/Fit", count: 241, revenue: "R$ 5.784", percent: 53 },
              ].map((item) => (
                <div
                  key={item.rank}
                  className="p-1 sm:p-1.5 rounded-lg hover:bg-[#FAF8F0] transition-colors border border-transparent hover:border-[#E9E4D4] flex flex-col justify-center"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-4.5 h-4.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          item.rank === 1
                            ? "bg-[#CB5A3C] text-white shadow-2xs"
                            : "bg-[#2E4233]/10 text-[#2E4233]"
                        }`}
                      >
                        {item.rank}
                      </span>
                      <span className="font-semibold text-xs sm:text-sm text-[#111827] truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-[#525B4E] bg-[#F3EFE3] px-1.5 py-0.2 rounded shrink-0 hidden sm:inline">
                        {item.category}
                      </span>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1">
                      <span className="text-xs sm:text-sm font-bold text-[#1F2E22]">
                        {item.revenue}
                      </span>
                      <span className="text-[10px] text-[#525B4E] font-medium">
                        • {item.count} unidades
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-[#EFECE3] h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.rank === 1 ? "bg-[#CB5A3C]" : "bg-[#2E4233]"
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => openDetail(
                "Catálogo de Todos os Produtos",
                (
                  <div className="space-y-2 text-xs">
                    <p className="text-[#717A6D]">Exibindo os itens ativos no cardápio ordenados por volume:</p>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {[
                        { name: "Bowl Frango Oriental", cat: "Prato", vendas: 456, receita: "R$ 14.592" },
                        { name: "Moqueca de Camarão", cat: "Prato", vendas: 352, receita: "R$ 13.728" },
                        { name: "Lasanha à Bolonhesa", cat: "Prato", vendas: 298, receita: "R$ 8.940" },
                        { name: "Escondidinho de Carne", cat: "Prato", vendas: 274, receita: "R$ 7.672" },
                        { name: "Salada Caesar", cat: "Salada", vendas: 241, receita: "R$ 5.784" },
                        { name: "Suco Natural de Laranja 500ml", cat: "Bebida", vendas: 210, receita: "R$ 2.100" },
                        { name: "Pudim de Leite Condensado", cat: "Sobremesa", vendas: 185, receita: "R$ 2.220" },
                        { name: "Refrigerante Lata 350ml", cat: "Bebida", vendas: 172, receita: "R$ 1.204" },
                      ].map((prod, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[#F0ECE1]">
                          <div>
                            <span className="font-semibold text-[#111827]">{idx + 1}. {prod.name}</span>
                            <span className="text-[10px] text-[#717A6D] block">{prod.cat}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#2E4233]">{prod.vendas} unidades ({prod.receita})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
                "Desempenho geral de vendas por item",
                "Pratos com menos de 10 vendas no mês devem ser avaliados: ajuste a foto/descrição ou substitua por novidades sazonais para reduzir estoque parado."
              )}
              className="shrink-0 text-xs font-semibold text-[#CB5A3C] hover:underline mt-1 text-left cursor-pointer"
            >
              Ver todos os produtos &gt;
            </button>
          </div>

          {/* Card 3: Pedidos por horário */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-2.5 sm:p-3.5 shadow-xs flex flex-col justify-between min-h-0 h-full">
            <div className="shrink-0">
              {/* Header */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#CB5A3C] whitespace-nowrap">
                    Pedidos por horário
                  </h3>
                  <CardHelpTooltip
                    title="Pedidos por horário"
                    description="Mapeia a distribuição de pedidos por faixa de horário ao longo do dia, revelando com precisão os momentos de pico de almoço e jantar."
                    tip="Alterne entre os dias da semana (ex: Sáb ou Ter) para dimensionar a escala da cozinha e dos entregadores."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openDetail(
                    "Matriz Comparativa: Dia da Semana x Horário",
                    <MatrizComparativaModalContent />,
                    "Filtro consolidado por Mês de Maio ou Semanas específicas",
                    "Como Terça-feira é o dia com menor volume (84 pedidos), faça promoções no WhatsApp de 'Frete Grátis na Terça' para preencher a ociosidade da equipe."
                  )}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline flex items-center gap-0.5 cursor-pointer shrink-0"
                >
                  Ver detalhes &gt;
                </button>
              </div>

              {/* Day Selector Pills */}
              <div className="flex items-center gap-1 bg-[#F3EFE3]/80 p-0.5 rounded-full border border-[#E9E4D4] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(
                  [
                    { id: "todos", label: "Média" },
                    { id: "seg", label: "Seg" },
                    { id: "ter", label: "Ter" },
                    { id: "qua", label: "Qua" },
                    { id: "qui", label: "Qui" },
                    { id: "sex", label: "Sex" },
                    { id: "sab", label: "Sáb" },
                    { id: "dom", label: "Dom" },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setSelectedDay(d.id)
                      setSelectedHourIndex(null)
                    }}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                      selectedDay === d.id
                        ? "bg-[#CB5A3C] text-white shadow-xs"
                        : "text-gray-700 hover:text-[#CB5A3C] hover:bg-white/80"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Interactive Hour Status Bar */}
              <div className="mt-1.5 min-h-[30px] flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-[#FAF8F0] border border-[#E9E4D4] transition-all">
                {activeHour !== null ? (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#CB5A3C] text-white text-[10px] font-bold px-1.5 py-0.2 rounded">
                        {activeHour < 10 ? `0${activeHour}` : activeHour}h às {activeHour < 9 ? `0${activeHour + 1}` : activeHour + 1}h
                      </span>
                      <span className="font-bold text-[#1F2E22] text-xs">
                        {activeDayData.hours[activeHour]} {activeDayData.hours[activeHour] === 1 ? "pedido" : "pedidos"}
                      </span>
                      {activeDayData.hours[activeHour] === Math.max(...activeDayData.hours) && activeDayData.hours[activeHour] > 0 && (
                        <span className="bg-[#CB5A3C] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          Pico
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#525B4E] font-medium">
                      {activeDayData.totalOrders > 0
                        ? `${((activeDayData.hours[activeHour] / activeDayData.totalOrders) * 100).toFixed(1)}% do dia`
                        : "0%"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-[#525B4E] text-xs">
                    <span>Passe o mouse ou toque nas barras</span>
                    <span className="font-semibold text-[#1F2E22]">{activeDayData.totalOrders} pedidos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic SVG Bar Chart: Adapts to Card Height */}
            <div className="flex-1 min-h-0 relative w-full mt-2 flex flex-col justify-between">
              <div className="flex-1 min-h-0 relative w-full flex items-center justify-center">
                <svg viewBox="0 0 340 170" className="w-full h-full max-h-full overflow-visible">
                  {[
                    { val: activeDayData.yMax, y: 16 },
                    { val: Math.round(activeDayData.yMax * 0.66), y: 56 },
                    { val: Math.round(activeDayData.yMax * 0.33), y: 96 },
                    { val: 0, y: 136 },
                  ].map((grid, idx) => (
                    <g key={idx}>
                      <text x="0" y={grid.y + 4} fontSize="11" fontWeight="600" fill="#1F2E22" fontFamily="sans-serif">
                        {grid.val}
                      </text>
                      <line x1="26" y1={grid.y} x2="340" y2={grid.y} stroke="#E2DCD0" strokeWidth="1" />
                    </g>
                  ))}

                  {/* Bars - 23 hourly intervals */}
                  {activeDayData.hours.map((val, i) => {
                    const barW = 8
                    const startX = 32
                    const availWidth = 296
                    const step = availWidth / 22
                    const x = startX + (i * step)
                    const barHeight = val > 0 ? (val / activeDayData.yMax) * 120 : 0
                    const y = 136 - barHeight
                    const isPeak = val === Math.max(...activeDayData.hours) && val > 0
                    const isCurrentActive = activeHour === i

                    return (
                      <g key={i}>
                        <rect
                          x={x - 2.5}
                          y={8}
                          width={barW + 5}
                          height={130}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredHourIndex(i)}
                          onMouseLeave={() => setHoveredHourIndex(null)}
                          onClick={() => setSelectedHourIndex(selectedHourIndex === i ? null : i)}
                        />
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={Math.max(barHeight, 2)}
                          rx="3"
                          fill={isCurrentActive || isPeak ? "#CB5A3C" : "#2E4233"}
                          opacity={activeHour !== null ? (isCurrentActive ? 1 : 0.4) : 1}
                          className="transition-all duration-200 pointer-events-none"
                        />
                        {isCurrentActive && val > 0 && (
                          <g className="pointer-events-none">
                            <rect
                              x={x - 10}
                              y={Math.max(y - 18, 2)}
                              width={barW + 20}
                              height={15}
                              rx="4"
                              fill="#CB5A3C"
                            />
                            <text
                              x={x + barW / 2}
                              y={Math.max(y - 7, 13)}
                              fill="#FFFFFF"
                              fontSize="9"
                              fontWeight="bold"
                              textAnchor="middle"
                              fontFamily="sans-serif"
                            >
                              {val}
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}
                </svg>
              </div>

              <div className="shrink-0 flex justify-between pl-8 pr-1 text-[11px] font-semibold text-[#1F2E22] mt-0.5">
                <span>00h</span>
                <span>03h</span>
                <span>06h</span>
                <span>09h</span>
                <span className="font-bold text-[#CB5A3C]">12h</span>
                <span>15h</span>
                <span>18h</span>
                <span className="font-bold text-[#CB5A3C]">21h</span>
              </div>
            </div>
          </div>

        </div>

        {/* Row 3: 2 Balanced Cards (Generous space, No Abbreviations, Rich Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 flex-1 min-h-0">

          {/* Card 1: Canais de venda */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between min-h-0 h-full">
            <div className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#CB5A3C]">Canais de venda</h3>
                  <CardHelpTooltip
                    title="Canais de venda"
                    description="Mostra a divisão do faturamento entre pedidos entregues a domicílio (Delivery) e pedidos retirados presencialmente no balcão da sua loja."
                    tip="Pedidos de retirada no balcão não têm custo com motoboys, gerando maior margem líquida por pedido."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openDetail(
                    "Comparativo: Delivery vs Retirada no Local",
                    (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-[#FAF8F0] p-3 rounded-xl border border-[#E9E4D4]">
                            <div className="flex items-center gap-1.5 text-[#2E4233] font-bold">
                              <Truck className="w-4 h-4 text-[#2E4233]" />
                              <span>Delivery (Entrega)</span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <span className="text-lg font-bold text-[#111827] block">R$ 22.142,40</span>
                              <span className="text-xs text-[#717A6D] block">77% do faturamento total</span>
                              <div className="pt-1 text-xs text-[#717A6D]">
                                <strong>961</strong> pedidos entregues<br />
                                Ticket médio: <strong>R$ 23,04</strong>
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#FDF0E9] p-3 rounded-xl border border-[#F4D6C7]">
                            <div className="flex items-center gap-1.5 text-[#CB5A3C] font-bold">
                              <Store className="w-4 h-4 text-[#CB5A3C]" />
                              <span>Retirada no Local</span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <span className="text-lg font-bold text-[#111827] block">R$ 6.614,00</span>
                              <span className="text-xs text-[#717A6D] block">23% do faturamento total</span>
                              <div className="pt-1 text-xs text-[#717A6D]">
                                <strong>287</strong> pedidos no balcão<br />
                                Ticket médio: <strong>R$ 23,04</strong>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#FAF8F0] border border-[#E9E4D4] space-y-1 text-[#2E4233]">
                          <span className="font-bold text-[#111827] block">Vantagem da Retirada no Balcão:</span>
                          <p className="text-xs text-[#717A6D]">
                            Cada pedido de retirada economiza cerca de R$ 6,00 a R$ 8,00 em taxas de motoboy e não sofre com atrasos em dias de chuva.
                          </p>
                        </div>
                      </div>
                    ),
                    "Estratégia de distribuição e custos logísticos",
                    "Crie uma promoção 'Retire no Balcão e ganhe uma Coca-Cola ou 10% de desconto'. Isso atrai vizinhos da loja, reduz a fila de despacho dos motoboys e aumenta sua margem limpa."
                  )}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Ver detalhes &gt;
                </button>
              </div>
            </div>

            {/* Donut and Legend: Clear, un-abbreviated labels */}
            <div className="flex-1 min-h-0 flex items-center gap-5 sm:gap-7 my-auto py-2">
              {/* SVG Donut */}
              <div className="relative w-[125px] h-[125px] sm:w-[135px] sm:h-[135px] shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 160 160" className="w-full h-full">
                  <g transform="rotate(-90 80 80)">
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="transparent"
                      stroke="#2E4233"
                      strokeWidth="24"
                      strokeDasharray="261 340"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="54"
                      fill="transparent"
                      stroke="#CB5A3C"
                      strokeWidth="24"
                      strokeDasharray="78 340"
                      strokeDashoffset="-261"
                    />
                  </g>

                  <text
                    x="116"
                    y="121"
                    fill="#FFFFFF"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    77%
                  </text>
                  <text
                    x="44"
                    y="40"
                    fill="#FFFFFF"
                    fontSize="12"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                  >
                    23%
                  </text>
                </svg>
              </div>

              {/* Legend list */}
              <div className="space-y-3 text-xs flex-1 min-w-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#2E4233] shrink-0" />
                    <span className="text-[#111827] font-semibold text-xs sm:text-sm truncate">Delivery (Entrega a Domicílio)</span>
                  </div>
                  <span className="text-[#1F2E22] font-bold text-sm sm:text-base pl-5 block mt-0.5">
                    R$ 22.142,40 <span className="font-normal text-[#525B4E] text-xs">(77,0% do faturamento total)</span>
                  </span>
                  <span className="text-[#525B4E] text-xs pl-5 block mt-0.5">
                    961 pedidos entregues
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#CB5A3C] shrink-0" />
                    <span className="text-[#111827] font-semibold text-xs sm:text-sm truncate">Retirada no Local (Balcão)</span>
                  </div>
                  <span className="text-[#CB5A3C] font-bold text-sm sm:text-base pl-5 block mt-0.5">
                    R$ 6.614,00 <span className="font-normal text-[#525B4E] text-xs">(23,0% do faturamento total)</span>
                  </span>
                  <span className="text-[#525B4E] text-xs pl-5 block mt-0.5">
                    287 pedidos retirados no balcão
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openDetail(
                "Configurações de Entrega & Balcão",
                (
                  <p className="text-xs text-[#717A6D]">
                    Você pode alterar taxas de entrega, raio de alcance ou habilitar retirada rápida no balcão diretamente nas configurações da sua loja.
                  </p>
                ),
                "Canais de venda",
                "Divulgue fotos da sua fachada e do balcão no WhatsApp/Instagram para encorajar a retirada presencial."
              )}
              className="shrink-0 text-xs font-semibold text-[#CB5A3C] hover:underline mt-1.5 text-left cursor-pointer"
            >
              Ver detalhes por canal &gt;
            </button>
          </div>

          {/* Card 2: Taxa de recompra */}
          <div className="bg-white border border-[#E9E4D4] rounded-xl p-3 sm:p-4 shadow-xs flex flex-col justify-between min-h-0 h-full">
            <div className="shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-[#CB5A3C]">Taxa de recompra</h3>
                  <CardHelpTooltip
                    title="Taxa de recompra"
                    description="Percentual de clientes cadastrados pelo WhatsApp que voltam a comprar os mesmos produtos favoritos na sua loja."
                    tip="O WhatsApp funciona como identificador único da sua clientela em qualquer compra na loja."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openDetail(
                    "Repetição de Clientes nos Mesmos Produtos",
                    <RepeticaoModalContent />,
                    "Rastreamento de repetição de produtos via WhatsApp",
                    "Como o cliente do Bowl Frango Oriental tem 68% de chance de pedir o mesmo prato de novo, programe um disparo no WhatsApp após 10 dias do último pedido oferecendo o Bowl favorito com entrega grátis. A taxa de conversão passa de 40%!"
                  )}
                  className="text-xs font-semibold text-[#CB5A3C] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  Ver detalhes &gt;
                </button>
              </div>
            </div>

            {/* Gauge and Stats: Fully spelled out without abbreviations */}
            <div className="flex-1 min-h-0 flex items-center gap-5 sm:gap-7 my-auto py-2">
              {/* SVG Progress Ring */}
              <div className="relative w-[125px] h-[125px] sm:w-[135px] sm:h-[135px] shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="#F0ECE1"
                    strokeWidth="13"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="#2E4233"
                    strokeWidth="13"
                    strokeDasharray="91 289"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#1F2E22] leading-none">
                    31,4%
                  </span>
                  <span className="text-xs text-[#525B4E] mt-1 font-medium leading-tight">
                    Taxa de recompra
                  </span>
                </div>
              </div>

              {/* Right stats: Clean, rich, un-abbreviated */}
              <div className="space-y-2 flex-1 min-w-0">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-[#DCFCE7] px-2.5 py-1 rounded-full inline-flex">
                    <span>↑ +4,3% de aumento</span>
                  </div>
                  <span className="text-xs text-[#525B4E] block mt-1">comparado ao mês anterior</span>
                </div>

                <div>
                  <span className="text-xs text-[#525B4E] block">Clientes que retornaram (Recompra)</span>
                  <span className="text-lg sm:text-xl font-bold text-[#1F2E22] leading-tight">
                    389 clientes
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#525B4E] block">Total de clientes cadastrados no WhatsApp</span>
                  <span className="text-lg sm:text-xl font-bold text-[#1F2E22] leading-tight">
                    1.239 clientes
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => openDetail(
                "Métricas Detalhadas de Retenção",
                (
                  <p className="text-xs text-[#717A6D]">
                    A taxa de recompra reflete clientes que realizaram 2 ou mais compras nos últimos 30 dias identificados pelo WhatsApp.
                  </p>
                ),
                "Taxa de recompra",
                "Clientes fiéis costumam comprar em dias de semana com menor movimentação. Recompense-os com pequenos mimos ou sobremesas cortesia."
              )}
              className="shrink-0 text-xs font-semibold text-[#CB5A3C] hover:underline mt-1.5 text-left cursor-pointer"
            >
              Ver detalhes de fidelidade &gt;
            </button>
          </div>

        </div>

      </div>

      {/* Rich Detail Slideover / Modal with Next Action Ideas */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E9E4D4] p-5 sm:p-6 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-start justify-between pb-3 border-b border-[#F0ECE1] mb-3.5">
              <div>
                <h3 className="text-lg sm:text-xl font-serif text-[#CB5A3C] tracking-tight">
                  {modal.title}
                </h3>
                {modal.subtitle && (
                  <span className="text-xs sm:text-sm font-semibold text-black block mt-1">
                    {modal.subtitle}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModal({ isOpen: false, title: "", content: null })}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-[#FAF8F0] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-[#2E4233]">
              {modal.content}
            </div>

            {/* Strategic Next Action Idea Box */}
            {modal.actionIdea && (
              <div className="mt-4 p-3 bg-[#FAF8F0] border border-[#E9E4D4] rounded-xl flex items-start gap-2.5">
                <Lightbulb className="w-4.5 h-4.5 text-[#CB5A3C] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold text-[#CB5A3C] block mb-0.5">
                    💡 Ideia para próxima ação:
                  </span>
                  <p className="text-[#2E4233] leading-relaxed">
                    {modal.actionIdea}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setModal({ isOpen: false, title: "", content: null })}
                className="bg-[#2E4233] hover:bg-[#1E2D22] text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-xs"
              >
                Fechar detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
