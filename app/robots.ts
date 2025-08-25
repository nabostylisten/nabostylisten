import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/bli-stylist',
        '/kontakt', 
        '/om-oss',
        '/tjenester',
        '/tjenester/*',
        '/profiler/*',
        '/privacy',
        '/terms-of-service',
        '/faq',
        '/handlekurv',
        '/auth/*'
      ],
      disallow: [
        '/admin/*',
        '/bookinger/*',
        '/checkout/*',
        '/bestilling',
        '/stylist/*',
        '/profiler/*/chat',
        '/profiler/*/mine-bookinger',
        '/profiler/*/mine-tjenester',
        '/profiler/*/inntekter',
        '/profiler/*/preferanser',
        '/profiler/*/tilgjengelighet',
        '/api/*'
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nabostylisten.no'}/sitemap.xml`,
  }
}