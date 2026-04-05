import type { LicenseType } from "@/config/licenses";
import { beats as allBeats, type BeatData } from "@/data/beats";
import {
  getBeatLicenseOptions,
  getLicensePriceUsd,
  isLicenseAvailable,
  normalizeLicenseType,
} from "@/lib/beatLicenses";
import { getBeatSlug } from "@/lib/beatSlugs";

export type CartLicenseType = LicenseType;

export type CartItem = {
  id: string;
  beatId: string;
  slug: string;
  title: string;
  artworkUrl?: string;
  previewUrl?: string;
  bpm?: number;
  genre?: string;
  key?: string;
  selectedLicense: CartLicenseType;
  unitPrice: number;
  currency: "USD";
  addedAt: string;
  exclusivePrice: number;
  hasStems?: boolean;
  sold?: boolean;
  exclusiveAvailable?: boolean;
  coverVariant?: number;
};

export function makeCartItemId(beatId: string) {
  return String(beatId);
}

export function displayUnitPriceUsd(
  beat: Pick<BeatData, "id" | "price" | "hasStems" | "sold" | "exclusive_available">,
  licenseType: CartLicenseType
): number {
  return getLicensePriceUsd(beat, licenseType);
}

export function beatToCartItem(
  beat: BeatData,
  licenseType: CartLicenseType,
  opts?: { addedAt?: string }
): CartItem {
  const addedAt = new Date().toISOString();
  return {
    id: makeCartItemId(beat.id),
    beatId: beat.id,
    slug: getBeatSlug(beat),
    title: beat.title,
    artworkUrl: beat.coverImage,
    previewUrl: beat.previewUrl || beat.audioUrl,
    bpm: beat.bpm,
    genre: beat.genre,
    key: beat.key,
    selectedLicense: licenseType,
    unitPrice: displayUnitPriceUsd(beat, licenseType),
    currency: "USD",
    addedAt: opts?.addedAt ?? addedAt,
    exclusivePrice: beat.price,
    hasStems: beat.hasStems,
    sold: beat.sold,
    exclusiveAvailable: beat.exclusive_available,
    coverVariant: beat.coverVariant,
  };
}

export function cartItemToLicenseSource(item: CartItem) {
  return {
    id: item.beatId,
    price: item.exclusivePrice,
    hasStems: item.hasStems,
    sold: item.sold,
    exclusiveAvailable: item.exclusiveAvailable,
  };
}

export function updateCartItemLicense(
  item: CartItem,
  licenseType: CartLicenseType
): CartItem {
  const source = cartItemToLicenseSource(item);
  if (!isLicenseAvailable(source, licenseType)) return item;
  return {
    ...item,
    selectedLicense: licenseType,
    unitPrice: getLicensePriceUsd(source, licenseType),
  };
}

function readText(
  value: unknown,
  fallback?: string
): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return undefined;
}

function readNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof fallback === "number" && Number.isFinite(fallback)) return fallback;
  return undefined;
}

export function normalizeStoredCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const beatId =
    typeof item.beatId === "string"
      ? item.beatId
      : typeof item.id === "string"
        ? item.id.split(":")[0]
        : null;
  const requestedLicense =
    typeof item.selectedLicense === "string"
      ? item.selectedLicense
      : typeof item.licenseType === "string"
        ? item.licenseType
        : null;
  if (!beatId) return null;
  const beat = allBeats.find((entry) => entry.id === beatId);
  const source = {
    id: beatId,
    price:
      typeof item.exclusivePrice === "number"
        ? item.exclusivePrice
        : typeof beat?.price === "number"
          ? beat.price
        : typeof item.unitPrice === "number" && requestedLicense === "exclusive"
          ? item.unitPrice
          : 0,
    hasStems:
      typeof item.hasStems === "boolean" ? item.hasStems : beat?.hasStems,
    sold: typeof item.sold === "boolean" ? item.sold : beat?.sold,
    exclusiveAvailable:
      typeof item.exclusiveAvailable === "boolean"
        ? item.exclusiveAvailable
        : beat?.exclusive_available,
  };
  const selectedLicense = normalizeLicenseType(source, requestedLicense);
  if (!selectedLicense) return null;
  const options = getBeatLicenseOptions(source);
  const current = options.find((option) => option.type === selectedLicense);
  if (!current) return null;
  const title = readText(item.title, beat?.title) ?? "Untitled Beat";
  const previewUrl = readText(
    item.previewUrl,
    readText(item.audioUrl, beat?.previewUrl || beat?.audioUrl)
  );
  const genre = readText(item.genre, beat?.genre);
  const key = readText(item.key, beat?.key);
  const artworkUrl = readText(item.artworkUrl, beat?.coverImage);
  return {
    id: makeCartItemId(beatId),
    beatId,
    slug: readText(item.slug, beat ? getBeatSlug(beat) : beatId) ?? beatId,
    title,
    artworkUrl,
    previewUrl,
    bpm: readNumber(item.bpm, beat?.bpm),
    genre,
    key,
    selectedLicense,
    unitPrice: current.price,
    currency: "USD",
    addedAt: readText(item.addedAt, new Date().toISOString()) ?? new Date().toISOString(),
    exclusivePrice: source.price,
    hasStems: source.hasStems,
    sold: source.sold,
    exclusiveAvailable: source.exclusiveAvailable,
    coverVariant: readNumber(item.coverVariant, beat?.coverVariant),
  };
}
