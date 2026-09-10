// Shared “How did you hear about us?” options for waitlist + ambassador forms.
export const HEARD_ABOUT_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'whatsapp', label: 'WhatsApp / group chat' },
  { value: 'friend', label: 'Friend or classmate' },
  { value: 'ambassador', label: 'Student Ambassador' },
  { value: 'teacher', label: 'Teacher or tutor' },
  { value: 'school', label: 'School / college / university' },
  { value: 'google', label: 'Google / search' },
  { value: 'other', label: 'Other' },
];

export const HEARD_ABOUT_VALUES = HEARD_ABOUT_OPTIONS.map((o) => o.value);

export function heardAboutLabel(value) {
  if (!value) return '';
  return HEARD_ABOUT_OPTIONS.find((o) => o.value === value)?.label || value;
}
