"use client"

import React, { useEffect, useRef, useState } from "react"
import { CupSoda, Store, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

interface StorefrontImageProps {
  src?: string | null
  alt: string
  className?: string
  fallbackClassName?: string
  iconClassName?: string
  loading?: "eager" | "lazy"
  variant?: "food" | "drink" | "logo"
}

function StorefrontImageFallback({
  alt,
  className,
  iconClassName,
  variant = "food",
}: {
  alt: string
  className?: string
  iconClassName?: string
  variant?: "food" | "drink" | "logo"
}) {
  const Icon =
    variant === "drink" ? CupSoda : variant === "logo" ? Store : UtensilsCrossed

  return (
    <div
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        "flex items-center justify-center bg-[#F3EFE6] dark:bg-[#1E2B22] text-[#6E776F] dark:text-[#86A08C]",
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} aria-hidden="true" />
    </div>
  )
}

function StorefrontImageInner({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
  loading,
  variant = "food",
}: Omit<StorefrontImageProps, "src"> & { src: string }) {
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Catch images that already failed during SSR before client hydration attached onError
  useEffect(() => {
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth !== 0) return
    const frameId = requestAnimationFrame(() => {
      setHasError(true)
    })
    return () => cancelAnimationFrame(frameId)
  }, [])

  if (hasError) {
    return (
      <StorefrontImageFallback
        alt={alt}
        className={fallbackClassName || className}
        iconClassName={iconClassName}
        variant={variant}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setHasError(true)}
    />
  )
}

/**
 * Resilient storefront image that replaces missing or failed external URLs
 * with a clean theme-aware icon placeholder (avoiding broken img icons).
 */
export function StorefrontImage({
  src,
  alt,
  className,
  fallbackClassName,
  iconClassName,
  loading,
  variant = "food",
}: StorefrontImageProps) {
  const normalizedSrc = typeof src === "string" ? src.trim() : ""

  if (!normalizedSrc) {
    return (
      <StorefrontImageFallback
        alt={alt}
        className={fallbackClassName || className}
        iconClassName={iconClassName}
        variant={variant}
      />
    )
  }

  return (
    <StorefrontImageInner
      key={normalizedSrc}
      src={normalizedSrc}
      alt={alt}
      className={className}
      fallbackClassName={fallbackClassName}
      iconClassName={iconClassName}
      loading={loading}
      variant={variant}
    />
  )
}
