/**
 * Turning a rendered report into a file the user can hand out: a PNG, or a
 * multi-page PDF.
 *
 * Both rasterise the DOM, so the two things that decide whether the output looks
 * professional are resolution and where the pages break. We render at 3x (the
 * old 2x put roughly 150 DPI on an A4 page, which is where the soft, slightly
 * blurry text came from), and we break pages at element boundaries the caller
 * nominates, instead of slicing the image at a fixed page height and cutting
 * through the middle of a line of text.
 */

/** Render scale. 3x of a ~700px-wide report lands around 260 DPI on A4. */
const SCALE = 3
/** The dark page the reports are designed on; also the PDF page fill. */
export const REPORT_BG = '#11141f'

export async function captureNode(el: HTMLElement, background = REPORT_BG): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import('html2canvas-pro')
  return html2canvas(el, {
    scale: SCALE,
    backgroundColor: background,
    useCORS: true,
    logging: false,
    // The export buttons live inside the thing being exported; leave them out.
    ignoreElements: (node) => node instanceof HTMLElement && node.hasAttribute('data-export-hide'),
  })
}

/**
 * The colour to paint behind a capture: the element's own background, or the
 * page's if it's transparent. Without this, exporting a light-theme card on the
 * reports' dark default would render its dark text on a dark page.
 */
export function nodeBackground(el: HTMLElement): string {
  const own = getComputedStyle(el).backgroundColor
  const opaque = (c: string) => c && !/^rgba?\(0,\s*0,\s*0,\s*0\)$|transparent/.test(c)
  if (opaque(own)) return own
  const body = getComputedStyle(document.body).backgroundColor
  return opaque(body) ? body : REPORT_BG
}

/** `#rrggbb` or `rgb()/rgba()` to the [r, g, b] jsPDF wants. */
function toRgb(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const h = color.slice(1)
    const six = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
    return [0, 2, 4].map((i) => parseInt(six.slice(i, i + 2), 16)) as [number, number, number]
  }
  const nums = color.match(/[\d.]+/g)?.map(Number) ?? []
  return [nums[0] ?? 17, nums[1] ?? 20, nums[2] ?? 31]
}

/**
 * Offsets (in CSS px, relative to `el`) where a page may safely break: the
 * bottom edge of each element matching `selector`, minus any that would cut
 * through a *different* one.
 *
 * That last part is what makes a two-column report work. Sections sit side by
 * side, so the bottom of the left one is usually somewhere in the middle of the
 * right one; breaking there would slice the neighbour in half. A boundary only
 * counts if no section straddles it.
 */
export function breakPoints(el: HTMLElement, selector: string): number[] {
  const top = el.getBoundingClientRect().top
  const boxes = Array.from(el.querySelectorAll(selector)).map((n) => {
    const r = n.getBoundingClientRect()
    return { top: r.top - top, bottom: r.bottom - top }
  })
  return boxes
    .map((b) => b.bottom)
    .filter((y) => !boxes.some((b) => b.top < y - 1 && b.bottom > y + 1))
    .sort((a, b) => a - b)
}

/**
 * Save a rendered node as a multi-page PDF, breaking pages at the nominated
 * boundaries so no row is sliced in half. A section taller than a whole page is
 * cut at the page edge, since there's nowhere better to put it.
 */
export async function downloadPdf(
  el: HTMLElement,
  filename: string,
  opts: { breaks?: number[]; background?: string } = {},
) {
  const background = opts.background ?? REPORT_BG
  const canvas = await captureNode(el, background)
  const { default: jsPDF } = await import('jspdf')
  // Letter, not A4: these reports are handed to US leadership and get printed.
  const pdf = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  // The capture is laid across the full page width, so one CSS pixel of the
  // source is `ptPerCss` points on the page.
  const cssW = canvas.width / SCALE
  const ptPerCss = pageW / cssW
  const pageCss = pageH / ptPerCss // how much of the source fits on one page
  const totalCss = canvas.height / SCALE
  const breaks = (opts.breaks ?? []).filter((b) => b > 0).sort((a, b) => a - b)

  const [r, g, b] = toRgb(background)

  let y = 0
  let first = true
  while (y < totalCss - 1) {
    const limit = y + pageCss
    // The last safe boundary that still fits on this page; if none does, the
    // block is taller than a page, so fall back to a hard cut at the page edge.
    const fits = breaks.filter((bp) => bp > y + 1 && bp <= limit)
    const end = fits.length ? fits[fits.length - 1] : Math.min(limit, totalCss)
    const sliceCss = end - y

    // Copy just this page's band of pixels, so each page carries its own image
    // rather than one tall image shifted off the top of the page.
    const page = document.createElement('canvas')
    page.width = canvas.width
    page.height = Math.round(sliceCss * SCALE)
    const ctx = page.getContext('2d')
    if (!ctx) break
    ctx.fillStyle = background
    ctx.fillRect(0, 0, page.width, page.height)
    ctx.drawImage(canvas, 0, Math.round(y * SCALE), canvas.width, page.height, 0, 0, canvas.width, page.height)

    if (!first) pdf.addPage()
    first = false
    pdf.setFillColor(r, g, b)
    pdf.rect(0, 0, pageW, pageH, 'F')
    pdf.addImage(page.toDataURL('image/png'), 'PNG', 0, 0, pageW, sliceCss * ptPerCss, undefined, 'FAST')

    y = end
  }

  pdf.save(filename)
}
