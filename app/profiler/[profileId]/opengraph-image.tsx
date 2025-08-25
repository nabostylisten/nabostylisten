import { ImageResponse } from 'next/og'
import { brandColors, companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { createServiceClient } from '@/lib/supabase/service'

export const alt = `Stylist på ${companyConfig.name}`
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

interface Props {
  params: {
    profileId: string
  }
}

export default async function Image({ params }: Props) {
  const supabase = createServiceClient()
  
  // Fetch stylist profile and details
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      full_name,
      stylist_details (
        bio,
        can_travel,
        has_own_place
      ),
      services (
        id,
        title
      )
    `)
    .eq('id', params.profileId)
    .eq('role', 'stylist')
    .single()

  const name = profile?.full_name || 'Stylist'
  const serviceCount = profile?.services?.length || 0
  const canTravel = profile?.stylist_details?.can_travel
  const hasOwnPlace = profile?.stylist_details?.has_own_place
  
  // Create location text
  let locationText = ''
  if (canTravel && hasOwnPlace) {
    locationText = 'Hjemme hos deg eller på salong'
  } else if (canTravel) {
    locationText = 'Hjemme hos deg'
  } else if (hasOwnPlace) {
    locationText = 'På salong'
  }
  
  const fonts = await loadFonts(`${name}${locationText}${serviceCount} tjenester`)

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
          backgroundColor: brandColors.light.muted,
          backgroundImage: `linear-gradient(135deg, ${brandColors.light.muted} 0%, ${brandColors.light.background} 100%)`,
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
            background: `radial-gradient(circle at 40% 30%, ${brandColors.light.primary}20 0%, transparent 50%), radial-gradient(circle at 60% 70%, ${brandColors.light.secondary}25 0%, transparent 50%)`,
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
              fontSize: '64px',
              fontWeight: 700,
              color: brandColors.light.foreground,
              margin: '0 0 24px 0',
              lineHeight: 1.1,
            }}
          >
            {name}
          </h1>
          
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: '28px',
              fontWeight: 400,
              color: brandColors.light.primary,
              margin: '0 0 32px 0',
            }}
          >
            Profesjonell stylist
          </p>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontFamily: 'Inter',
                fontSize: '22px',
                fontWeight: 400,
                color: brandColors.light.foreground,
                margin: 0,
                opacity: 0.9,
              }}
            >
              {serviceCount} {serviceCount === 1 ? 'tjeneste' : 'tjenester'} tilgjengelig
            </p>
            
            {locationText && (
              <p
                style={{
                  fontFamily: 'Inter',
                  fontSize: '20px',
                  fontWeight: 400,
                  color: brandColors.light.primary,
                  margin: 0,
                  padding: '12px 24px',
                  backgroundColor: brandColors.light.accent,
                  borderRadius: '12px',
                }}
              >
                {locationText}
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