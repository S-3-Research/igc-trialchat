import type { IntakeData } from "@/lib/types/intake";

/**
 * Maps intake form data to appropriate iframe URLs
 * 
 * Role determines the base URL, and intent/response_style are passed as URL parameters.
 */

// Base URLs mapped by role
const BASE_URL_MAP: Record<string, string> = {
  'user': 'https://www.stack-ai.com/chat/680972a82d4d99f4d0d5ed9a-6l9P2RWj4FhGToCtW9jvqo',
  'caregiver': 'https://www.stack-ai.com/chat/698cfd7ab7c2fcb1d3dcd210-6l9P2RWj4FhGToCtW9jvqo',
  'default': 'https://www.stack-ai.com/chat/680972a82d4d99f4d0d5ed9a-6l9P2RWj4FhGToCtW9jvqo',
};

/**
 * Selects the appropriate iframe URL based on intake data
 * 
 * @param intakeData - User's intake form responses
 * @returns URL string for the iframe src with query parameters
 */
export function selectIframeUrl(intakeData: IntakeData | null): string {
  if (!intakeData) {
    return BASE_URL_MAP['default'];
  }

  // Get base URL from role
  const baseUrl = BASE_URL_MAP[intakeData.role ?? 'default'] || BASE_URL_MAP['default'];

  // Build URL with query parameters
  const url = new URL(baseUrl);
  if (intakeData.intent) url.searchParams.set('intent', intakeData.intent);
  if (intakeData.response_style) url.searchParams.set('style', intakeData.response_style);

  return url.toString();
}

/**
 * Gets a display name for the current iframe content
 * Useful for UI labels or debugging
 */
export function getIframeContentName(intakeData: IntakeData | null): string {
  if (!intakeData) {
    return 'General Chat';
  }

  const roleLabel = intakeData.role === 'user' ? 'Patient' : 'Caregiver';
  const intentLabel = intakeData.intent === 'trial_matching' 
    ? 'Trial Matching' 
    : 'Learn About Trials';
  
  return `${roleLabel} - ${intentLabel}`;
}
