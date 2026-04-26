/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLAR_ORG_ID?: string;
  readonly VITE_POLAR_PRODUCT_ID?: string;
  readonly VITE_POLAR_CHECKOUT_URL?: string;
  readonly VITE_POLAR_PORTAL_URL?: string;
  readonly VITE_POLAR_PRICE_LABEL?: string;
  /** Override Polar API host (default `https://api.polar.sh`; use sandbox when testing). */
  readonly VITE_POLAR_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
