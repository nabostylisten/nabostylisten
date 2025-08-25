import { ImageResponse } from 'next/og'
import { companyConfig } from '@/lib/brand'
import { loadFonts } from '@/lib/og-fonts'
import { createServiceClient } from '@/lib/supabase/service'
import { OpenGraphTemplate } from '@/components/open-graph/open-graph-template'

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
  const subtitle = `med ${stylistName}`
  const price = service?.price ? `${service.price} ${service.currency || 'NOK'}` : ''
  const duration = service?.duration_minutes ? `${service.duration_minutes} min` : ''
  const description = [price, duration].filter(Boolean).join(' • ')
  
  const fonts = await loadFonts(`${title}${subtitle}${description}`)

  return new ImageResponse(
    (
      <OpenGraphTemplate
        title={title}
        subtitle={subtitle}
        description={description}
        backgroundVariant="home"
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