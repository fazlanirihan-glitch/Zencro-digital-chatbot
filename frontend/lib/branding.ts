// White-Label Branding Configuration System
// All company-specific details are loaded from this single source.
// To deploy for a new client, change ONLY these values.

export interface BrandingConfig {
  companyName: string;
  tagline: string;
  logo: string;
  avatar: string;
  welcomeTitle: string;
  welcomeDescription: string;
  primaryColor: string;
  secondaryColor: string;
  accentGradient: string;
  website: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  socialLinks: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
  };
  suggestedPrompts: SuggestionCategory[];
}

export interface SuggestionCategory {
  label: string;
  icon: string;
  prompts: string[];
}

// Default ZenCro Digital branding - loaded as fallback
const defaultBranding: BrandingConfig = {
  companyName: "ZenCro Digital",
  tagline: "Build. Automate. Grow.",
  logo: "/logo.svg",
  avatar: "/avatar.svg",
  welcomeTitle: "How can I help you today?",
  welcomeDescription:
    "I'm your AI assistant. Ask me about our services, pricing, portfolio, or anything else.",
  primaryColor: "217 91% 53%", // HSL for #2563eb
  secondaryColor: "199 89% 48%", // HSL for #0ea5e9
  accentGradient: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 50%, #7c3aed 100%)",
  website: "https://www.zencrodigital.in",
  email: "zencrodigital@gmail.com",
  phone: "+91 92725 83316",
  whatsappNumber: "+919272583316",
  socialLinks: {
    instagram: "https://instagram.com/zencrodigital",
    linkedin: "https://linkedin.com/company/zencrodigital",
  },
  suggestedPrompts: [
    {
      label: "Websites",
      icon: "globe",
      prompts: [
        "I need a business website",
        "Build me a school website",
        "Create a restaurant website",
      ],
    },
    {
      label: "AI & Automation",
      icon: "bot",
      prompts: [
        "I want an AI chatbot",
        "Automate my business workflows",
        "Build a voice AI assistant",
      ],
    },
    {
      label: "Pricing",
      icon: "credit-card",
      prompts: [
        "What are your pricing packages?",
        "How much does a website cost?",
        "Do you offer monthly plans?",
      ],
    },
    {
      label: "Portfolio",
      icon: "briefcase",
      prompts: [
        "Show me your portfolio",
        "What projects have you built?",
        "Do you have client testimonials?",
      ],
    },
  ],
};

let activeBranding: BrandingConfig = { ...defaultBranding };

export function getBranding(): BrandingConfig {
  return activeBranding;
}

export function setBranding(override: Partial<BrandingConfig>): void {
  activeBranding = { ...activeBranding, ...override };
}

export function resetBranding(): void {
  activeBranding = { ...defaultBranding };
}

// Injects CSS custom properties for dynamic theming
export function applyBrandingTheme(branding: BrandingConfig): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", branding.primaryColor);
  root.style.setProperty("--brand-secondary", branding.secondaryColor);
  root.style.setProperty("--brand-gradient", branding.accentGradient);
}

export { defaultBranding };
