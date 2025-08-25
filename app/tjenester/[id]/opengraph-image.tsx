import { ImageResponse } from 'next/og'
import { brandColors, companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { createServiceClient } from '@/lib/supabase/service'

export const alt = `Tjeneste på ${companyConfig.name}`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface Props {
  params: {
    id: string
  }
}

export default async function Image({ params }: Props) {
  const supabase = createServiceClient()
  
  // Fetch service details
  const { data: service } = await supabase
    .from('services')
    .select(`
      title,
      description,
      price,
      currency,
      duration_minutes,
      profiles!stylist_id (
        full_name
      )
    `)
    .eq('id', params.id)
    .eq('is_published', true)
    .single()

  const title = service?.title || 'Tjeneste'
  const stylistName = service?.profiles?.full_name || 'Stylist'
  const price = service?.price ? `${service.price} ${service.currency || 'NOK'}` : ''
  const duration = service?.duration_minutes ? `${service.duration_minutes} min` : ''
  
  const fonts = await loadFonts(`${title}${stylistName}${price}${duration}`)

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
          backgroundImage: `linear-gradient(135deg, ${brandColors.light.background} 0%, ${brandColors.light.muted} 100%)`,
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
            background: `radial-gradient(circle at 25% 75%, ${brandColors.light.primary}15 0%, transparent 50%), radial-gradient(circle at 75% 25%, ${brandColors.light.accent}20 0%, transparent 50%)`,
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
            maxWidth: '900px',
          }}
        >
          <h1
            style={{
              fontFamily: 'Fraunces',
              fontSize: '56px',
              fontWeight: 700,
              color: brandColors.light.foreground,
              margin: '0 0 16px 0',
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {title}
          </h1>
          
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: '28px',
              fontWeight: 400,
              color: brandColors.light.primary,
              margin: '0 0 24px 0',
            }}
          >
            med {stylistName}
          </p>
          
          <div
            style={{
              display: 'flex',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            {price && (
              <p
                style={{
                  fontFamily: 'Inter',
                  fontSize: '24px',
                  fontWeight: 400,
                  color: brandColors.light.foreground,
                  margin: 0,
                  padding: '12px 24px',
                  backgroundColor: brandColors.light.accent,
                  borderRadius: '12px',
                }}
              >
                {price}
              </p>
            )}
            
            {duration && (
              <p
                style={{
                  fontFamily: 'Inter',
                  fontSize: '24px',
                  fontWeight: 400,
                  color: brandColors.light.foreground,
                  margin: 0,
                  padding: '12px 24px',
                  backgroundColor: brandColors.light.secondary,
                  borderRadius: '12px',
                }}
              >
                {duration}
              </p>
            )}
          </div>
          
          {/* Brand name in corner */}
          <p
            style={{
              position: 'absolute',
              bottom: '40px',
              right: '80px',
              fontFamily: 'Fraunces',
              fontSize: '20px',
              fontWeight: 700,
              color: brandColors.light.primary,
              margin: 0,
              opacity: 0.7,
            }}
          >
            {companyConfig.name}
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