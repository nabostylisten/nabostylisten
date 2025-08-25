import { ImageResponse } from 'next/og'
import { brandColors, companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'

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
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: brandColors.light.background,
          backgroundImage: `linear-gradient(135deg, ${brandColors.light.background} 0%, ${brandColors.light.accent} 100%)`,
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
            background: `radial-gradient(circle at 25% 25%, ${brandColors.light.primary}20 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${brandColors.light.secondary}30 0%, transparent 50%)`,
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
          <h1
            style={{
              fontFamily: 'Fraunces',
              fontSize: '72px',
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
              fontSize: '36px',
              fontWeight: 400,
              color: brandColors.light.primary,
              margin: '0 0 16px 0',
            }}
          >
            {subtitle}
          </p>
          
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: '24px',
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