type BrandColors = {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  muted: string;
  accent: string;
  destructive: string;
}

export const brandColors: Record<"light" | "dark", BrandColors> = {
  light: {
    background: "#f8f6ff",
    foreground: "#453676",
    primary: "#a494c4",
    secondary: "#fdeae3",
    muted: "#eae8f1",
    accent: "#e9fbe4",
    destructive: "#ff3434",
  },
  dark: {
    background: "#1c1723",
    foreground: "#f8f6ff",
    primary: "#a494c4",
    secondary: "#7cb36d",
    muted: "#3a3145",
    accent: "#48405c",
    destructive: "#930909",
  },
}