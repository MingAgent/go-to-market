// Echo Intake — Configuration
export const VAPI_PUBLIC_KEY = 'ad15e8ef-8ef5-4785-8d0c-5691ab781e5b';

// Phase 1 is the first voice call (Phase 0 handled by onboarding)
export const PHASES = {
  1: { id: '133389ab-f33e-4abb-a0c1-49265f512137', name: 'Identity' },
  2: { id: 'd373966a-1569-4704-8de8-71a7424a07ee', name: 'Revenue & Budget' },
  3: { id: 'ee646ec2-a64c-4299-943f-c0a409aa4c69', name: 'Goals & Context' },
  4: { id: 'ff0808df-7a9e-42f1-ae54-b34d05c11e20', name: 'Sales Process' },
  5: { id: '81bb766e-b3e9-4055-a9fd-1f9a58f06650', name: 'Marketing State' },
  6: { id: 'c2c21a77-753b-4585-a48d-8bc773c55f5f', name: 'Brand & Position' },
  7: { id: '1a70793d-111a-41e0-a494-501bce1fc012', name: 'Target Audience' },
  8: { id: '0a092393-b50f-4e31-a83a-b81460c4e984', name: 'Tech & Ops' },
  9: { id: '7f3f6768-eb91-42a4-b581-8bba61a29af4', name: 'Seasonality & Wrap-Up' },
};

// Typewriter timing
export const TW_SPEED = 28;        // ms per character
export const PAUSE_LINE = 800;     // ms between lines within a step
export const PAUSE_STEP = 1200;    // ms between steps
export const PAUSE_SHORT = 400;    // ms before input fields appear
export const PAUSE_MED = 600;
export const PAUSE_LONG = 1000;
