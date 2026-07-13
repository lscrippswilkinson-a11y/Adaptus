import type { CSSProperties } from 'react'
import type { Project } from '@/types'

/**
 * Per-project branding: the user's own logo and accent colour, applied to every
 * report they hand out (the shared brief, the PDF, the deck, the printed report).
 * Both live in `stageData.executive`, so they ride along in the project's JSONB
 * and reach anonymous viewers of a shared brief with no extra DB plumbing.
 */

/** The Adaptus accent, used whenever a project hasn't set its own colour. */
export const DEFAULT_BRAND = '#5B86A3'

/**
 * Parse whatever the user typed into a `#RRGGBB`, or null if it isn't a colour.
 * Accepts `abc`, `#abc`, `AABBCC`, with or without the hash, any case.
 */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '')
  if (!/^[0-9a-fA-F]{3}$/.test(raw) && !/^[0-9a-fA-F]{6}$/.test(raw)) return null
  const six = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  return `#${six.toUpperCase()}`
}

const rgbOf = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Shift a colour towards black (amount < 0) or white (amount > 0), -1..1. */
export function shade(hex: string, amount: number): string {
  const to = amount < 0 ? 0 : 255
  const t = Math.abs(amount)
  const mix = (c: number) => Math.round(c + (to - c) * t)
  const [r, g, b] = rgbOf(hex).map(mix)
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

/**
 * Black or white, whichever stays readable on `hex`. Without this, a user who
 * picks a pale brand colour gets white text on a near-white header.
 */
export function readableOn(hex: string): string {
  const [r, g, b] = rgbOf(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.45 ? '#11141F' : '#FFFFFF'
}

export interface Brand {
  /** #RRGGBB, the project's colour or the Adaptus default. */
  color: string
  /** Black or white, whichever reads on `color`. */
  fg: string
  /** Logo as a data URL, or '' when none was uploaded. */
  logo: string
  /** Logo width ÷ height, so exports can size it without measuring. */
  logoRatio: number
  /** Whether the user set a colour of their own (vs. inheriting the default). */
  custom: boolean
}

export function brandOf(project: Project): Brand {
  const exec = project.stageData.executive
  const color = normalizeHex(exec.brandColor ?? '') ?? DEFAULT_BRAND
  return {
    color,
    fg: readableOn(color),
    logo: exec.brandLogo ?? '',
    logoRatio: exec.brandLogoRatio || 1,
    custom: color !== DEFAULT_BRAND,
  }
}

/** `rgba(r, g, b, a)` for a hex, so alpha tints don't need CSS color-mix. */
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = rgbOf(hex)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

/**
 * CSS custom properties the `.brief-*` rules read, so one inline style on the
 * report wrapper re-skins the whole thing. `--brand-fg` keeps header text
 * readable whatever colour the user picked.
 *
 * Every tint is precomputed here rather than done in CSS with color-mix: the PDF
 * and image exports rasterise the brief through html2canvas, which doesn't
 * reliably implement modern colour functions, and a colour it can't parse comes
 * out transparent or black.
 */
export function brandVars(brand: Brand): CSSProperties {
  const fg = readableOn(brand.color)
  return {
    '--brand': brand.color,
    '--brand-2': shade(brand.color, -0.25),
    // The pale-on-dark accent used for section titles inside the dark report body.
    '--brand-soft': shade(brand.color, 0.45),
    '--brand-line': alpha(brand.color, 0.2),
    '--brand-fill': alpha(brand.color, 0.15),
    '--brand-fg': fg,
    '--brand-fg-72': alpha(fg, 0.72),
    '--brand-fg-25': alpha(fg, 0.25),
    '--brand-fg-15': alpha(fg, 0.15),
  } as CSSProperties
}

/** Bare hex (no '#'), the form pptxgenjs wants. */
export const bare = (hex: string) => hex.replace('#', '').toUpperCase()

/**
 * Shrink an uploaded logo to something a report can carry: max 480px on the long
 * edge, re-encoded. PNG is kept as PNG so a transparent logo stays transparent
 * (a JPEG would give it a white box on the dark brief); everything else becomes
 * JPEG. The result is a data URL, small enough to live in the project JSON.
 */
export function downscaleLogo(file: File, maxEdge = 480): Promise<{ dataUrl: string; ratio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('That file isn’t an image we can read.'))
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Could not process that image.'))
        ctx.drawImage(img, 0, 0, w, h)
        const png = file.type === 'image/png'
        resolve({
          dataUrl: canvas.toDataURL(png ? 'image/png' : 'image/jpeg', png ? undefined : 0.88),
          ratio: w / h,
        })
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
