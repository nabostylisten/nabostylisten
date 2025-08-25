import { ImageResponse } from 'next/og'
import { companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { OpenGraphTemplate } from '@/components/open-graph/open-graph-template'

export const alt = companyConfig.pages.home.title
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const { ogTitle: title, ogSubtitle: subtitle, ogDescription: description } = companyConfig.pages.home
  
  const fonts = await loadFonts(`${title}${subtitle}${description}`)

  return new ImageResponse(
    (
      <OpenGraphTemplate
        title={title}
        subtitle={subtitle}
        description={description}
        backgroundVariant="home"
        showBrandName={false}
      />
    ),
    {
      ...size,
      fonts,
    }
  )
}