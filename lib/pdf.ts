import puppeteer, { PDFOptions as PuppeteerPDFOptions, PaperFormat } from 'puppeteer'

export interface PDFOptions {
  format?: PaperFormat // e.g., 'A4'
  printBackground?: boolean
}

// Renders provided HTML to a PDF Buffer using Puppeteer.
export async function htmlToPDFBuffer(html: string, options: PDFOptions = {}): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: 'new' })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const buffer = await page.pdf({
      format: options.format ?? 'A4',
      printBackground: options.printBackground ?? true,
      margin: {
        top: '10mm', bottom: '10mm', left: '10mm', right: '10mm'
      }
    })
    return buffer
  } finally {
    await browser.close()
  }
}
