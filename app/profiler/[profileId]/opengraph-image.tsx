import { ImageResponse } from 'next/og'
import { companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { createServiceClient } from '@/lib/supabase/service'
import { OpenGraphTemplate } from '@/components/open-graph/open-graph-template'

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
  
  // Create location and service info
  let locationText = ''
  if (canTravel && hasOwnPlace) {
    locationText = 'Hjemme hos deg eller på salong'
  } else if (canTravel) {
    locationText = 'Hjemme hos deg'
  } else if (hasOwnPlace) {
    locationText = 'På salong'
  }
  
  const subtitle = 'Profesjonell stylist'
  const serviceInfo = `${serviceCount} ${serviceCount === 1 ? 'tjeneste' : 'tjenester'} tilgjengelig`
  const description = [serviceInfo, locationText].filter(Boolean).join(' • ')
  
  const fonts = await loadFonts(`${name}${subtitle}${description}`)

  return new ImageResponse(
    (
      <OpenGraphTemplate
        title={name}
        subtitle={subtitle}
        description={description}
        backgroundVariant="about"
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