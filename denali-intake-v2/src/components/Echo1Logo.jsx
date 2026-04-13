/**
 * Echo1 Labs logo — ECHO in cyan, superscript 1 in white, LABS in white
 * Centered layout with all elements balanced.
 */
export default function Echo1Logo({ size = 'lg' }) {
  const sizes = {
    sm: { maxW: 120 },
    md: { maxW: 170 },
    lg: { maxW: 200 },
  };
  const s = sizes[size] || sizes.lg;

  return (
    <svg
      viewBox="0 -6 275 64"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', maxWidth: s.maxW }}
    >
      {/* ECHO — cyan */}
      <text
        x="0"
        y="44"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="600"
        fontSize="50"
        letterSpacing="0.02em"
        fill="#00b4e6"
      >
        ECHO
      </text>

      {/* Superscript 1 — white, larger */}
      <text
        x="146"
        y="16"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="500"
        fontSize="28"
        fill="#ffffff"
        opacity="0.9"
      >
        1
      </text>

      {/* LABS — white, baseline-aligned with ECHO */}
      <text
        x="163"
        y="44"
        fontFamily="'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="500"
        fontSize="24"
        letterSpacing="0.08em"
        fill="#ffffff"
      >
        LABS
      </text>
    </svg>
  );
}
