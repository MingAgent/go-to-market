/**
 * Echo1 Labs logo — renders the REAL SVG brand assets.
 *
 * Variants:
 *   "thumbnail" (default for lg) — full lockup with tagline
 *   "logo" (default for sm/md)   — horizontal wordmark
 *   "favicon"                     — icon-only mark
 */
export default function Echo1Logo({ size = 'lg', variant }) {
  const sizes = {
    sm: { maxW: 120 },
    md: { maxW: 170 },
    lg: { maxW: 200 },
  };
  const s = sizes[size] || sizes.lg;

  const v = variant || (size === 'lg' ? 'thumbnail' : 'logo');

  const srcMap = {
    thumbnail: '/echo1-thumbnail.svg',
    logo: '/echo1-logo.svg',
    favicon: '/echo1-favicon.svg',
  };

  return (
    <img
      src={srcMap[v] || srcMap.logo}
      alt="Echo1 Labs"
      style={{ width: '100%', height: 'auto', maxWidth: s.maxW }}
      draggable={false}
    />
  );
}
