import { brandColors, companyConfig } from '@/lib/brand'

export interface OpenGraphTemplateProps {
  title: string
  subtitle?: string
  description?: string
  showBrandName?: boolean
  brandNamePosition?: 'top' | 'corner'
  backgroundVariant?: 'home' | 'services' | 'stylist' | 'contact' | 'about'
  size?: {
    width: number
    height: number
  }
}

export function OpenGraphTemplate({
  title,
  subtitle,
  description,
  showBrandName = false,
  brandNamePosition = 'corner',
  backgroundVariant = 'home',
}: OpenGraphTemplateProps) {
  // Background configurations for different page types
  const backgroundConfigs = {
    home: {
      backgroundColor: brandColors.light.background,
      backgroundImage: `linear-gradient(135deg, ${brandColors.light.background} 0%, ${brandColors.light.accent} 100%)`,
      decoration: `radial-gradient(circle at 25% 25%, ${brandColors.light.primary}20 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${brandColors.light.secondary}30 0%, transparent 50%)`,
    },
    services: {
      backgroundColor: brandColors.light.accent,
      backgroundImage: `linear-gradient(135deg, ${brandColors.light.accent} 0%, ${brandColors.light.background} 100%)`,
      decoration: `radial-gradient(circle at 30% 40%, ${brandColors.light.primary}20 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${brandColors.light.secondary}25 0%, transparent 50%)`,
    },
    stylist: {
      backgroundColor: brandColors.light.secondary,
      backgroundImage: `linear-gradient(135deg, ${brandColors.light.secondary} 0%, ${brandColors.light.background} 100%)`,
      decoration: `radial-gradient(circle at 20% 80%, ${brandColors.light.primary}25 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${brandColors.light.accent}30 0%, transparent 50%)`,
    },
    contact: {
      backgroundColor: brandColors.light.primary,
      backgroundImage: `linear-gradient(135deg, ${brandColors.light.primary} 0%, ${brandColors.light.background} 100%)`,
      decoration: `radial-gradient(circle at 35% 65%, ${brandColors.light.secondary}30 0%, transparent 50%), radial-gradient(circle at 65% 35%, ${brandColors.light.accent}25 0%, transparent 50%)`,
    },
    about: {
      backgroundColor: brandColors.light.background,
      backgroundImage: `linear-gradient(135deg, ${brandColors.light.background} 0%, ${brandColors.light.primary}20 100%)`,
      decoration: `radial-gradient(circle at 15% 85%, ${brandColors.light.accent}25 0%, transparent 50%), radial-gradient(circle at 85% 15%, ${brandColors.light.secondary}30 0%, transparent 50%)`,
    },
  }

  const config = backgroundConfigs[backgroundVariant]
  const isContactVariant = backgroundVariant === 'contact'

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: config.backgroundColor,
        backgroundImage: config.backgroundImage,
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
          background: config.decoration,
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
        {/* Brand name at top (for services variant) */}
        {showBrandName && brandNamePosition === 'top' && (
          <p
            style={{
              fontFamily: 'Fraunces',
              fontSize: '32px',
              fontWeight: 700,
              color: isContactVariant ? brandColors.light.background : brandColors.light.primary,
              margin: '0 0 32px 0',
              opacity: 0.9,
            }}
          >
            {companyConfig.name}
          </p>
        )}
        
        {/* Main title */}
        <h1
          style={{
            fontFamily: 'Fraunces',
            fontSize: showBrandName && brandNamePosition === 'top' ? '96px' : '72px',
            fontWeight: 700,
            color: isContactVariant ? brandColors.light.background : brandColors.light.foreground,
            margin: '0 0 24px 0',
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: showBrandName && brandNamePosition === 'top' ? '40px' : '36px',
              fontWeight: 400,
              color: isContactVariant ? brandColors.light.background : brandColors.light.primary,
              margin: description ? '0 0 16px 0' : '0 0 32px 0',
              opacity: isContactVariant ? 0.9 : 1,
            }}
          >
            {subtitle}
          </p>
        )}
        
        {/* Description */}
        {description && (
          <p
            style={{
              fontFamily: 'Inter',
              fontSize: showBrandName && brandNamePosition === 'top' ? '28px' : '24px',
              fontWeight: 400,
              color: isContactVariant ? brandColors.light.background : brandColors.light.foreground,
              opacity: isContactVariant ? 0.8 : 0.8,
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Brand name in corner */}
      {showBrandName && brandNamePosition === 'corner' && (
        <p
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontFamily: 'Fraunces',
            fontSize: '20px',
            fontWeight: 700,
            color: isContactVariant ? brandColors.light.background : brandColors.light.primary,
            margin: 0,
            opacity: 0.7,
          }}
        >
          {companyConfig.name}
        </p>
      )}
    </div>
  )
}