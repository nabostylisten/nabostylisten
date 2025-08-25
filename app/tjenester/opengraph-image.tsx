import { ImageResponse } from 'next/og'
import { brandColors, companyConfig, createPageMetadata } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import type { Metadata } from 'next'

export const alt = companyConfig.pages.tjenester.title
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export const metadata: Metadata = createPageMetadata('tjenester', { url: '/tjenester' })

export default async function Image() {
  const { ogTitle: title, ogSubtitle: subtitle, ogDescription: description } = companyConfig.pages.tjenester
  
  const fonts = await loadFonts(`${title}${subtitle}${description}`)

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: brandColors.light.accent,
          backgroundImage: `linear-gradient(135deg, ${brandColors.light.accent} 0%, ${brandColors.light.background} 100%)`,
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 40%, ${brandColors.light.primary}20 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${brandColors.light.secondary}25 0%, transparent 50%)`,
          }}
        />
        
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Brand name at top */}
          <p
            style={{
              fontFamily: 'Fraunces',
              fontSize: '32px',
              fontWeight: 700,
              color: brandColors.light.primary,
              margin: '0 0 32px 0',
              opacity: 0.9,
            }}
          >
            {companyConfig.name}
          </p>
          
          <h1
            style={{
              fontFamily: 'Fraunces',
              fontSize: '96px',
              fontWeight: 700,
              color: brandColors.light.foreground,
              margin: '0 0 24px 0',
              lineHeight: 1.1,
            }}
          >
            {title}
          </h1>
          
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: '40px',
              fontWeight: 400,
              color: brandColors.light.primary,
              margin: '0 0 32px 0',
            }}
          >
            {subtitle}
          </p>
          
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: '28px',
              fontWeight: 400,
              color: brandColors.light.foreground,
              opacity: 0.8,
              margin: 0,
            }}
          >
            {description}
          </p>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    }
  )
}