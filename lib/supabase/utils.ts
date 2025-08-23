export function getSupabaseAssetUrl(filename: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
  }

  return `${supabaseUrl}/storage/v1/object/public/assets/${filename}`;
}

export function getNabostylistenLogoUrl(format: "svg" | "png" = "png"): string {
  const filename = format === "svg"
    ? "nabostylisten_logo.svg"
    : "nabostylisten_logo.png";
  return getSupabaseAssetUrl(filename);
}