"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked: boolean
  onCheckedChange?: (checked: boolean) => void
  activeTrackColor?: string
  inactiveTrackColor?: string
}

/**
 * DeliPlus standard toggle switch:
 * - Active (available / right): Deli logo green track (#2E4233)
 * - Inactive (paused / left): Deli logo orange track (#CB5A3C)
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      onCheckedChange,
      className,
      disabled,
      onClick,
      activeTrackColor = "bg-[#2E4233]",
      inactiveTrackColor = "bg-[#CB5A3C]",
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          if (onClick) {
            onClick(e)
          } else if (onCheckedChange) {
            onCheckedChange(!checked)
          }
        }}
        className={cn(
          "w-9 h-5 rounded-full relative p-0.5 flex items-center cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
          checked ? activeTrackColor : inactiveTrackColor,
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 pointer-events-none block",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"
