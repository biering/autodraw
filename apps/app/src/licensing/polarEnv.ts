function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export type PolarPublicConfig = {
  organizationId: string;
  checkoutUrl: string;
  portalUrl: string | null;
  priceLabel: string | null;
  productId: string | null;
};

/** Required for license gate + API calls. */
export function getPolarPublicConfig(): PolarPublicConfig | null {
  const organizationId = trimOrNull(import.meta.env.VITE_POLAR_ORG_ID);
  const checkoutUrl = trimOrNull(import.meta.env.VITE_POLAR_CHECKOUT_URL);
  if (!organizationId || !checkoutUrl) return null;
  return {
    organizationId,
    checkoutUrl,
    portalUrl: trimOrNull(import.meta.env.VITE_POLAR_PORTAL_URL),
    priceLabel: trimOrNull(import.meta.env.VITE_POLAR_PRICE_LABEL),
    productId: trimOrNull(import.meta.env.VITE_POLAR_PRODUCT_ID),
  };
}
