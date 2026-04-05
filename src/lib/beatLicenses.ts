import { LICENSE_CONFIG, type LicenseType } from "@/config/licenses";

type LicenseSource = {
  id: string;
  price: number;
  hasStems?: boolean;
  sold?: boolean;
  exclusive_available?: boolean;
  exclusiveAvailable?: boolean;
};

export type BeatLicenseOption = {
  type: LicenseType;
  label: string;
  price: number;
  available: boolean;
  description: string;
  featured?: boolean;
};

function isSold(source: LicenseSource) {
  return source.sold === true;
}

function isUnlimitedAvailable(source: LicenseSource) {
  return !isSold(source) && source.hasStems !== false;
}

function isExclusiveAvailable(source: LicenseSource) {
  if (isSold(source)) return false;
  if (String(source.id) === "37") return false;
  return (
    source.exclusive_available !== false && source.exclusiveAvailable !== false
  );
}

export function getLicenseDisplayLabel(type: LicenseType) {
  if (type === "exclusive") return "Exclusive";
  return LICENSE_CONFIG[type].label;
}

export function getLicensePriceUsd(source: LicenseSource, type: LicenseType) {
  if (type === "exclusive") return source.price;
  return LICENSE_CONFIG[type].priceCents / 100;
}

export function getBeatLicenseOptions(source: LicenseSource): BeatLicenseOption[] {
  return [
    {
      type: "starter",
      label: LICENSE_CONFIG.starter.label,
      price: getLicensePriceUsd(source, "starter"),
      available: !isSold(source),
      description: LICENSE_CONFIG.starter.description,
    },
    {
      type: "premium",
      label: LICENSE_CONFIG.premium.label,
      price: getLicensePriceUsd(source, "premium"),
      available: !isSold(source),
      description: LICENSE_CONFIG.premium.description,
      featured: true,
    },
    {
      type: "unlimited",
      label: LICENSE_CONFIG.unlimited.label,
      price: getLicensePriceUsd(source, "unlimited"),
      available: isUnlimitedAvailable(source),
      description:
        source.hasStems === false
          ? "Trackout stems not available"
          : LICENSE_CONFIG.unlimited.description,
    },
    {
      type: "exclusive",
      label: "Exclusive",
      price: getLicensePriceUsd(source, "exclusive"),
      available: isExclusiveAvailable(source),
      description: isSold(source)
        ? "Already sold"
        : isExclusiveAvailable(source)
          ? "Full ownership • Beat removed from store"
          : "No longer available",
    },
  ];
}

export function isLicenseAvailable(source: LicenseSource, type: LicenseType) {
  return getBeatLicenseOptions(source).some(
    (option) => option.type === type && option.available
  );
}

export function normalizeLicenseType(
  source: LicenseSource,
  requested: string | null | undefined
): LicenseType | null {
  const options = getBeatLicenseOptions(source);
  if (
    requested &&
    options.some(
      (option) => option.type === requested && option.available
    )
  ) {
    return requested as LicenseType;
  }

  const preferredOrder: LicenseType[] = [
    "premium",
    "starter",
    "unlimited",
    "exclusive",
  ];
  for (const type of preferredOrder) {
    if (options.some((option) => option.type === type && option.available)) {
      return type;
    }
  }

  return null;
}
