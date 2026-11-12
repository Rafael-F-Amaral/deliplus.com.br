import React from "react"

/**
 * Ícone Oficial do Pix (Banco Central do Brasil)
 * Cor oficial: #32BCAD
 */
export function PixOfficialIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
    >
      <path
        fill="#32BCAD"
        d="M112.57 391.19c-44.66-44.66-44.66-117.08 0-161.74l48.3-48.3 35.83 35.83-48.3 48.3c-24.36 24.36-24.36 63.85 0 88.21 24.36 24.36 63.85 24.36 88.21 0l48.3-48.3 35.83 35.83-48.3 48.3c-44.66 44.66-117.08 44.66-161.74 0zm286.86-270.32c44.66 44.66 44.66 117.08 0 161.74l-48.3 48.3-35.83-35.83 48.3-48.3c24.36-24.36 24.36-63.85 0-88.21-24.36-24.36-63.85-24.36-88.21 0l-48.3 48.3-35.83-35.83 48.3-48.3c44.66-44.66 117.08-44.66 161.74 0z"
      />
    </svg>
  )
}

/**
 * Ícones Oficiais Coloridos de Bandeiras de Cartão (Visa, Mastercard, Elo, Hipercard)
 */
export function VisaLogo({ className = "h-4 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#1A1F71" />
      <path
        d="M14.2 16.5L16.3 7.5H18.7L16.6 16.5H14.2ZM24.6 7.7C24.1 7.5 23.3 7.3 22.4 7.3C19.8 7.3 18 8.6 18 10.5C18 11.9 19.3 12.7 20.2 13.2C21.2 13.7 21.5 14 21.5 14.5C21.5 15.2 20.6 15.5 19.8 15.5C18.8 15.5 18.2 15.3 17.5 15L17.1 14.8L16.8 16.6C17.4 16.9 18.5 17.2 19.6 17.2C22.3 17.2 24.1 15.9 24.1 13.9C24.1 12.3 23 11.4 21.6 10.7C20.8 10.3 20.3 10 20.3 9.4C20.3 8.9 20.9 8.4 22 8.4C22.8 8.4 23.4 8.6 23.9 8.8L24.1 8.9L24.6 7.7ZM29.2 7.5H27.3C26.7 7.5 26.2 7.7 26 8.3L22.2 16.5H24.7L25.2 15.1H28.3L28.6 16.5H30.8L29.2 7.5ZM25.9 13.3L27.2 9.6L28 13.3H25.9ZM12.7 7.5L10.3 13.7L10 12.2C9.5 10.6 8.1 8.8 6.5 7.9L8.6 16.5H11.2L15.3 7.5H12.7Z"
        fill="white"
      />
      <path
        d="M8.4 7.5H5.2L5 7.7C7.5 8.3 9.6 10.2 10.2 12.2L9.4 7.9C9.2 7.6 8.9 7.5 8.4 7.5Z"
        fill="#F7B600"
      />
    </svg>
  )
}

export function MastercardLogo({ className = "h-4 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#0A0A0A" />
      <circle cx="14" cy="12" r="6.5" fill="#EB001B" />
      <circle cx="22" cy="12" r="6.5" fill="#F79E1B" />
      <path
        d="M18 7.3A6.47 6.47 0 0015.5 12 6.47 6.47 0 0018 16.7 6.47 6.47 0 0020.5 12 6.47 6.47 0 0018 7.3z"
        fill="#FF5F00"
      />
    </svg>
  )
}

export function EloLogo({ className = "h-4 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#000000" />
      <circle cx="12" cy="12" r="3.2" fill="#EF4123" />
      <circle cx="18" cy="12" r="3.2" fill="#FFD100" />
      <circle cx="24" cy="12" r="3.2" fill="#00A4E8" />
    </svg>
  )
}

export function HipercardLogo({ className = "h-4 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="36" height="24" rx="4" fill="#B71C1C" />
      <path
        d="M8 8h2.2v3.2h3.2V8h2.2v8h-2.2v-3H10.2v3H8V8zm9.5 0h2.2v8h-2.2V8zm4 0h3.5c1.8 0 2.8 1 2.8 2.6 0 1.2-.6 2-1.6 2.4l1.8 3h-2.4l-1.5-2.6h-.6V16h-2V8zm2.2 3.6h1.2c.5 0 .8-.3.8-.8s-.3-.8-.8-.8h-1.2v1.6z"
        fill="white"
      />
    </svg>
  )
}

export function CardBrandsGroup() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <VisaLogo className="h-4 w-6 shadow-xs rounded" />
      <MastercardLogo className="h-4 w-6 shadow-xs rounded" />
      <EloLogo className="h-4 w-6 shadow-xs rounded" />
      <HipercardLogo className="h-4 w-6 shadow-xs rounded" />
    </div>
  )
}
