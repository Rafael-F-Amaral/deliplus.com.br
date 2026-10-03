"use client"

import { useState } from 'react'
import { cn } from "@/lib/utils"

function SvgIcon({ path, className }: { path: string, className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  )
}

function SolidPlay({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function ProductionPage() {
  return (
    <div className="flex flex-col h-full w-full p-6 max-w-[1400px]">
      
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-[#111827]">Produção</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-[#CB5A3C] text-[#CB5A3C] rounded-md font-semibold text-sm hover:bg-[#CB5A3C]/5 transition-colors">
              <SvgIcon path="M10 9v6m4-6v6" className="w-4 h-4" />
              Pausar produção
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <div className="w-2.5 h-2.5 rounded-full bg-[#50C878]"></div>
            Cozinha aberta
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer hover:text-gray-900 transition-colors">
            <SvgIcon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" className="w-4 h-4" />
            Hoje, 25 de maio de 2025
            <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8 max-w-[700px]">
        {/* Card 1: Pedidos em preparo */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 shadow-sm items-center">
          <div className="w-12 h-12 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
            <SvgIcon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14h6m-6 4h6m-6-8h.01" className="w-6 h-6 text-[#4B5563]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Pedidos em preparo</span>
            <span className="text-3xl font-bold text-gray-900 leading-tight mt-0.5">12</span>
            <span className="text-xs text-gray-500 mt-0.5 font-medium">Agora na cozinha</span>
          </div>
        </div>
        {/* Card 2: Valor em Andamento */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4 shadow-sm items-center">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center shrink-0">
            <SvgIcon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide">Receita na esteira</span>
            <span className="text-3xl font-bold text-gray-900 leading-tight mt-0.5">R$ 485</span>
            <span className="text-xs text-gray-500 mt-0.5 font-medium">Soma dos pedidos ativos</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 overflow-hidden flex-1 pb-4">
        {/* Kanban Board */}
        <div className="flex gap-6 overflow-hidden flex-1">
          
          {/* Column 1: Em preparo */}
          <div className="flex-1 flex flex-col min-w-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <SvgIcon path="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-[#859585]" />
              <h2 className="text-lg font-bold text-gray-900">Em preparo</h2>
              <span className="text-sm font-medium text-gray-400 ml-1">12</span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-2 custom-scrollbar">
              
              {/* Card #4574 */}
              <div className="bg-white border-y border-r border-l-[3px] border-y-gray-200 border-r-gray-200 border-l-[#CB5A3C] rounded-xl p-5 shadow-sm flex flex-col shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-gray-900">#4574</span>
                    <span className="text-gray-700 font-medium text-[15px]">Juliana Prado</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CB5A3C] text-[15px] font-bold bg-[#CB5A3C]/10 px-2.5 py-1 rounded-md">
                    <SvgIcon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                    8 min
                  </div>
                </div>
                
                <ul className="flex flex-col gap-2.5 mb-6">
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Filé à Parmegiana
                  </li>
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Purê de Batata
                  </li>
                </ul>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Pedido às 12:18</span>
                  <button className="bg-[#2E4233] hover:bg-[#233327] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors">
                    <SvgIcon path="M5 13l4 4L19 7" className="w-4 h-4" />
                    Pronto
                  </button>
                </div>
              </div>

              {/* Card #4571 */}
              <div className="bg-white border-y border-r border-l-[3px] border-y-gray-200 border-r-gray-200 border-l-[#CB5A3C] rounded-xl p-5 shadow-sm flex flex-col shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-gray-900">#4571</span>
                    <span className="text-gray-700 font-medium text-[15px]">Bruno Martins</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#CB5A3C] text-[15px] font-bold bg-[#CB5A3C]/10 px-2.5 py-1 rounded-md">
                    <SvgIcon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                    16 min
                  </div>
                </div>
                
                <ul className="flex flex-col gap-2.5 mb-6">
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Hambúrguer Artesanal
                  </li>
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Batata Rústica
                  </li>
                </ul>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Pedido às 12:10</span>
                  <button className="bg-[#2E4233] hover:bg-[#233327] text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors">
                    <SvgIcon path="M5 13l4 4L19 7" className="w-4 h-4" />
                    Pronto
                  </button>
                </div>
              </div>

              <button className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors mx-auto mt-2 py-2 flex items-center gap-1">
                Ver todos (12) <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Column 2: Prontos para retirada */}
          <div className="flex-1 flex flex-col min-w-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <SvgIcon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-5 h-5 text-[#859585]" />
              <h2 className="text-lg font-bold text-gray-900">Prontos para retirada</h2>
              <span className="text-sm font-medium text-gray-400 ml-1">4</span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto pb-4 pr-2 custom-scrollbar">
              
              {/* Card #4569 */}
              <div className="bg-white border-y border-r border-l-[3px] border-y-gray-200 border-r-gray-200 border-l-[#50C878] rounded-xl p-5 shadow-sm flex flex-col shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-gray-900">#4569</span>
                    <span className="text-gray-700 font-medium text-[15px]">Camila Ferreira</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-[15px] font-bold bg-gray-100 px-2.5 py-1 rounded-md">
                    <SvgIcon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                    2 min
                  </div>
                </div>
                
                <ul className="flex flex-col gap-2.5 mb-6">
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Salada Caesar
                  </li>
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Suco Natural Limão
                  </li>
                </ul>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Pedido às 12:25</span>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
                    Entregar
                  </button>
                </div>
              </div>

              {/* Card #4566 */}
              <div className="bg-white border-y border-r border-l-[3px] border-y-gray-200 border-r-gray-200 border-l-[#50C878] rounded-xl p-5 shadow-sm flex flex-col shrink-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-lg font-bold text-gray-900">#4566</span>
                    <span className="text-gray-700 font-medium text-[15px]">Lucas Almeida</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 text-[15px] font-bold bg-gray-100 px-2.5 py-1 rounded-md">
                    <SvgIcon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                    5 min
                  </div>
                </div>
                
                <ul className="flex flex-col gap-2.5 mb-6">
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Bowl Vegetariano
                  </li>
                  <li className="flex items-start gap-2.5 text-[15px] font-medium text-gray-800">
                    <span className="text-[#50C878] font-bold text-[10px] mt-1.5">•</span>
                    1x Chá Gelado
                  </li>
                </ul>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-[13px] text-gray-500 font-medium">Pedido às 12:20</span>
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
                    Entregar
                  </button>
                </div>
              </div>

              <button className="text-[13px] font-semibold text-gray-500 hover:text-gray-800 transition-colors mx-auto mt-2 py-2 flex items-center gap-1">
                Ver todos (4) <SvgIcon path="M6 9l6 6 6-6" className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Gerencial */}
        <div className="w-[300px] flex flex-col gap-6 shrink-0">
          
          {/* Monitor de Expedição */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <SvgIcon path="M13 10V3L4 14h7v7l9-11h-7z" className="w-5 h-5 text-[#E76F41]" />
              <h3 className="font-bold text-gray-900 text-[15px]">Expedição e Logística</h3>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <SvgIcon path="M5 13l4 4L19 7" className="w-4 h-4 text-green-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Aguardando retirada</span>
                </div>
                <span className="text-lg font-bold text-gray-900">4</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <SvgIcon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" className="w-4 h-4 text-orange-700" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Motoboys na loja</span>
                </div>
                <span className="text-lg font-bold text-gray-900">1</span>
              </div>
            </div>
          </div>

          {/* Itens com Maior Saída */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <SvgIcon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" className="w-5 h-5 text-[#50C878]" />
              <h3 className="font-bold text-gray-900 text-[15px]">Top Produtos (Turno)</h3>
            </div>
            
            <ul className="flex flex-col gap-4">
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">1º</span>
                  <span className="text-sm font-medium text-gray-800">Filé à Parmegiana</span>
                </div>
                <span className="text-sm font-bold text-[#CB5A3C]">24x</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">2º</span>
                  <span className="text-sm font-medium text-gray-800">Suco de Laranja</span>
                </div>
                <span className="text-sm font-bold text-[#CB5A3C]">18x</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">3º</span>
                  <span className="text-sm font-medium text-gray-800">Hambúrguer Duplo</span>
                </div>
                <span className="text-sm font-bold text-[#CB5A3C]">12x</span>
              </li>
              <li className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-sm font-bold text-gray-400">4º</span>
                  <span className="text-sm font-medium text-gray-800">Batata Rústica</span>
                </div>
                <span className="text-sm font-bold text-[#CB5A3C]">9x</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  )
}