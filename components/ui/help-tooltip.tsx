"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface HelpTooltipProps {
  /** Título exibido no topo do popover */
  title?: string
  /** Descrição principal da dica (obrigatória) */
  description: React.ReactNode
  /** Lista de pontos ou instruções detalhadas */
  items?: string[]
  /** Alias legado para compatibilidade com módulos existentes */
  bullets?: string[]
  /** Nota destacada de dica no rodapé (ex.: CardHelpTooltip) */
  tip?: string
  /** Alinhamento preferencial em relação ao botão `?` (sempre limitado à viewport) */
  align?: "left" | "center" | "right"
  /** Tamanho visual do ícone `?` (área de toque mínima >= 36px preservada) */
  size?: "sm" | "md" | "lg"
  /** Rótulo de acessibilidade personalizado */
  ariaLabel?: string
  /** Classes adicionais no wrapper do botão */
  className?: string
  /** Classes adicionais no popover */
  popoverClassName?: string
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/**
 * Popover de ajuda acessível por toque/clique, teclado (Tab/Enter/Escape)
 * e hover opcional apenas em dispositivos com ponteiro fino (`pointer: fine`).
 */
export function HelpTooltip({
  title,
  description,
  items,
  bullets,
  tip,
  align = "left",
  size = "md",
  ariaLabel,
  className,
  popoverClassName,
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [coords, setCoords] = React.useState<{
    top: number
    left: number
    ready: boolean
  }>({ top: 0, left: 0, ready: false })

  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const closeTimeoutRef = React.useRef<number | null>(null)
  const popoverId = React.useId()

  const resolvedItems = items && items.length > 0 ? items : bullets

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }, [])

  const isFinePointer = React.useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false
    }
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches
  }, [])

  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || typeof window === "undefined") return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const margin = 16
    const maxWidth = Math.min(320, Math.max(220, window.innerWidth - margin * 2))
    const measuredWidth = popoverRef.current?.offsetWidth || maxWidth
    const popoverWidth = Math.min(measuredWidth, window.innerWidth - margin * 2)
    const popoverHeight = popoverRef.current?.offsetHeight || 160

    let desiredLeft = triggerRect.left
    if (align === "right") {
      desiredLeft = triggerRect.right - popoverWidth
    } else if (align === "center") {
      desiredLeft = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2
    }

    const clampedLeft = Math.max(
      margin,
      Math.min(desiredLeft, window.innerWidth - popoverWidth - margin)
    )

    const gap = 8
    const spaceBelow = window.innerHeight - triggerRect.bottom - margin
    const spaceAbove = triggerRect.top - margin

    let top = triggerRect.bottom + gap
    if (spaceBelow < popoverHeight + gap && spaceAbove > spaceBelow) {
      top = Math.max(margin, triggerRect.top - popoverHeight - gap)
    } else if (top + popoverHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - popoverHeight - margin)
    }

    setCoords({ top, left: clampedLeft, ready: true })
  }, [align])

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      setCoords((prev) => (prev.ready ? { ...prev, ready: false } : prev))
      return
    }
    updatePosition()
  }, [isOpen, updatePosition])

  React.useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (triggerRef.current?.contains(target)) return
      if (popoverRef.current?.contains(target)) return
      setIsOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handleViewportChange = () => {
      updatePosition()
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [isOpen, updatePosition])

  React.useEffect(() => clearCloseTimer, [clearCloseTimer])

  const badgeSizeClasses =
    size === "lg"
      ? "w-5 h-5 text-[11px]"
      : size === "sm"
        ? "w-4 h-4 text-[10px]"
        : "w-[18px] h-[18px] text-[10.5px]"

  return (
    <span className={cn("relative inline-flex items-center align-middle", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel || (title ? `Ajuda: ${title}` : "Ajuda e informações")}
        aria-expanded={isOpen}
        aria-controls={isOpen ? popoverId : undefined}
        onClick={(event) => {
          event.stopPropagation()
          clearCloseTimer()
          setIsOpen((prev) => !prev)
        }}
        onMouseEnter={() => {
          if (!isFinePointer()) return
          clearCloseTimer()
          setIsOpen(true)
        }}
        onMouseLeave={() => {
          if (!isFinePointer()) return
          clearCloseTimer()
          closeTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false)
          }, 120)
        }}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-[#2E4233] text-white dark:bg-[#25332A] dark:text-[#F2EFE9] dark:border dark:border-[#3D5444] font-extrabold leading-none shadow-xs cursor-pointer transition-transform hover:scale-105 shrink-0 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#B4482D] dark:focus-visible:ring-[#FF7D4F] focus-visible:ring-offset-2 focus-visible:ring-offset-background after:content-[''] after:absolute after:-inset-2.5",
          badgeSizeClasses
        )}
      >
        ?
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="tooltip"
            onMouseEnter={() => {
              if (!isFinePointer()) return
              clearCloseTimer()
            }}
            onMouseLeave={() => {
              if (!isFinePointer()) return
              clearCloseTimer()
              closeTimeoutRef.current = window.setTimeout(() => {
                setIsOpen(false)
              }, 120)
            }}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={cn(
              "fixed z-[120] w-[min(20rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-y-auto p-3.5 rounded-2xl shadow-2xl border text-left transition-opacity duration-150",
              "bg-[#2E4233] text-white border-white/15 dark:bg-[#222C25] dark:text-[#F2EFE9] dark:border-[#384A3E]",
              coords.ready ? "opacity-100" : "opacity-0 pointer-events-none",
              popoverClassName
            )}
          >
            {title && (
              <p className="text-[12.5px] font-bold text-white dark:text-[#F2EFE9] mb-1.5 flex items-center gap-1.5 leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7D4F] shrink-0" />
                <span>{title}</span>
              </p>
            )}

            <div className="text-[11.5px] text-white/95 dark:text-[#E2DFD7] leading-relaxed font-normal">
              {description}
            </div>

            {resolvedItems && resolvedItems.length > 0 && (
              <ul className="flex flex-col gap-1.5 pt-2 mt-2 border-t border-white/15 dark:border-[#35463A] text-[11px] text-white/90 dark:text-[#E2DFD7] leading-snug">
                {resolvedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF7D4F] shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {tip && (
              <div className="mt-2 pt-2 border-t border-white/15 dark:border-[#35463A] flex items-start gap-1.5 text-[11px] text-white/90 dark:text-[#E2DFD7] leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7D4F] shrink-0 mt-1" />
                <span>{tip}</span>
              </div>
            )}
          </div>,
          document.body
        )}
    </span>
  )
}
