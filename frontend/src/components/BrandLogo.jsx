import React from "react";
import clsx from "clsx";

/** Public asset — keep filename in sync with `frontend/public/`. */
export const SMART_WATER_LOGO_SRC = "/Smart water Logo.png";

/**
 * App mark: transparent background, `object-contain` so only the artwork shows
 * (no colored box behind the image).
 */
export function BrandLogo({ className, alt = "Smart Water" }) {
  return (
    <img
      src={SMART_WATER_LOGO_SRC}
      alt={alt}
      className={clsx("object-contain", className)}
      decoding="async"
    />
  );
}
