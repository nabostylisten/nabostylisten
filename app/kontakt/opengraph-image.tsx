import { ImageResponse } from 'next/og'
import { companyConfig, createPageMetadata } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { OpenGraphTemplate } from '@/components/open-graph/open-graph-template'
import type { Metadata } from 'next'

export const alt = companyConfig.pages.kontakt.title
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export const metadata: Metadata = createPageMetadata('kontakt', { url: '/kontakt' })

export default async function Image() {
  const { ogTitle: title, ogSubtitle: subtitle, ogDescription: description } = companyConfig.pages.kontakt
  
  const fonts = await loadFonts(`${title}${subtitle}${description}`)

  return new ImageResponse(
    (
      <OpenGraphTemplate
        title={title}
        subtitle={subtitle}
        description={description}
        backgroundVariant="contact"
        showBrandName={true}
        brandNamePosition="corner"
      />
    ),
    {
      ...size,
      fonts,
    }
  )
}