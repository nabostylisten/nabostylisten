/**
 * Social media platform types supported by the application
 */
export type SocialMediaPlatform = 
  | "instagram" 
  | "facebook" 
  | "tiktok" 
  | "youtube" 
  | "snapchat" 
  | "other";

/**
 * URL patterns for different social media platforms
 */
const SOCIAL_MEDIA_PATTERNS = {
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?instagram\.com\/p\/([^/?#]+)/i, // Post URLs
  ],
  facebook: [
    /^https?:\/\/(www\.)?facebook\.com\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?fb\.com\/([^/?#]+)/i,
  ],
  tiktok: [
    /^https?:\/\/(www\.)?tiktok\.com\/@([^/?#]+)/i,
    /^https?:\/\/(www\.)?tiktok\.com\/([^/@?#]+)/i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/channel\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/c\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/user\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?youtube\.com\/@([^/?#]+)/i,
  ],
  snapchat: [
    /^https?:\/\/(www\.)?snapchat\.com\/add\/([^/?#]+)/i,
    /^https?:\/\/(www\.)?snapchat\.com\/@([^/?#]+)/i,
  ],
} as const;

/**
 * Determines the social media platform from a URL
 */
export function getPlatformFromUrl(url: string): SocialMediaPlatform {
  if (!url) return "other";
  
  for (const [platform, patterns] of Object.entries(SOCIAL_MEDIA_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return platform as SocialMediaPlatform;
      }
    }
  }
  
  return "other";
}

/**
 * Extracts the handle/username from a social media URL
 */
export function getHandleFromSocialMediaPlatform(
  platform: SocialMediaPlatform,
  url: string
): string | null {
  if (!url || platform === "other") return null;
  
  const patterns = SOCIAL_MEDIA_PATTERNS[platform];
  if (!patterns) return null;
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[2]) {
      let handle = match[2];
      
      // Clean up handle for different platforms
      switch (platform) {
        case "instagram":
          // Remove trailing slashes and query params
          handle = handle.split('/')[0].split('?')[0];
          break;
        case "facebook":
          // Remove trailing slashes and query params
          handle = handle.split('/')[0].split('?')[0];
          break;
        case "tiktok":
          // Remove @ if present (some patterns might capture it)
          handle = handle.replace(/^@/, '').split('/')[0].split('?')[0];
          break;
        case "youtube":
          // For YouTube, return the channel name/ID
          handle = handle.split('/')[0].split('?')[0];
          break;
        case "snapchat":
          // Remove @ if present
          handle = handle.replace(/^@/, '').split('/')[0].split('?')[0];
          break;
      }
      
      return handle;
    }
  }
  
  return null;
}

/**
 * Gets a display label for a social media platform
 */
export function getPlatformDisplayLabel(platform: SocialMediaPlatform): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "snapchat":
      return "Snapchat";
    case "other":
      return "Annet";
    default:
      return "Ukjent";
  }
}

/**
 * Validates if a URL is a valid social media URL
 */
export function isValidSocialMediaUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes a social media URL (ensures it starts with https://)
 */
export function normalizeSocialMediaUrl(url: string): string {
  if (!url) return url;
  
  // If it already has a protocol, return as is
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  
  // If it starts with www., add https://
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  
  // If it looks like a domain, add https://www.
  if (url.includes('.com') || url.includes('.no')) {
    return `https://www.${url}`;
  }
  
  return url;
}

/**
 * Gets a platform-specific display name (handle for most, just platform name for YouTube)
 */
export function getSocialMediaDisplayName(
  platform: SocialMediaPlatform, 
  url: string
): string {
  if (platform === "youtube") {
    // For YouTube, just return "YouTube" as the display name
    return "YouTube";
  }
  
  const handle = getHandleFromSocialMediaPlatform(platform, url);
  if (handle) {
    // Add @ for Instagram, TikTok, and Snapchat
    if (platform === "instagram" || platform === "tiktok" || platform === "snapchat") {
      return `@${handle}`;
    }
    return handle;
  }
  
  return getPlatformDisplayLabel(platform);
}

/**
 * Validates and formats social media URLs for storage
 */
export function validateAndFormatSocialMediaUrl(url: string): {
  isValid: boolean;
  formattedUrl: string;
  platform: SocialMediaPlatform;
  error?: string;
} {
  if (!url.trim()) {
    return {
      isValid: false,
      formattedUrl: url,
      platform: "other",
      error: "URL kan ikke være tom"
    };
  }
  
  const normalizedUrl = normalizeSocialMediaUrl(url.trim());
  
  if (!isValidSocialMediaUrl(normalizedUrl)) {
    return {
      isValid: false,
      formattedUrl: normalizedUrl,
      platform: "other",
      error: "Ugyldig URL format"
    };
  }
  
  const platform = getPlatformFromUrl(normalizedUrl);
  
  return {
    isValid: true,
    formattedUrl: normalizedUrl,
    platform
  };
}