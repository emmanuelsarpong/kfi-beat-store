export const LICENSE_CONFIG = {
  starter: {
    key: "starter" as const,
    label: "Starter License",
    // $49
    priceCents: 49_00,
    description: "WAV download • Ideal for demos and small releases",
  },
  premium: {
    key: "premium" as const,
    label: "Premium License",
    // $99
    priceCents: 99_00,
    description: "WAV download • Monetization and commercial streaming",
  },
  unlimited: {
    key: "unlimited" as const,
    label: "Unlimited License",
    // $199
    priceCents: 199_00,
    description: "WAV + trackout stems • Full mixing control",
  },
} as const;

export type LeaseLicenseType = keyof typeof LICENSE_CONFIG;

export type LicenseType = LeaseLicenseType | "exclusive";

export const MIN_LICENSE_PRICE_DISPLAY =
  Math.min(
    LICENSE_CONFIG.starter.priceCents,
    LICENSE_CONFIG.premium.priceCents,
    LICENSE_CONFIG.unlimited.priceCents
  ) / 100;

