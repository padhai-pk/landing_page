const FIELD_LABELS = {
  name: 'full name',
  email: 'email address',
  phone: 'phone number',
  country: 'country',
  city: 'city',
  university: 'university',
  subjects: 'subjects',
  subjectIds: 'subjects',
  cnicNumber: 'CNIC number',
  qualification: 'qualification',
  institution: 'institution',
  experience: 'years of experience',
  bio: 'bio',
  introVideoLink: 'intro video link',
  policiesAccepted: 'policy agreement',
  documents: 'documents',
  collection: 'entry',
  id: 'entry',
  shareToken: 'share link',
  platform: 'platform',
};

const TECHNICAL_PATTERNS = [
  /firebase/i,
  /firestore/i,
  /google authorization failed/i,
  /refresh token/i,
  /env var/i,
  /misconfigured/i,
  /VITE_/,
  /ECONNREFUSED/i,
  /Traceback/i,
  /Exception/i,
  /HTTP \d{3}/,
  /unexpected server error/i,
  /request failed/i,
];

function looksTechnical(message) {
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(message));
}

function fieldLabel(loc) {
  const field = Array.isArray(loc) ? loc.filter((part) => part !== 'body').pop() : null;
  return FIELD_LABELS[field] || 'required information';
}

function formatValidationDetail(detail) {
  if (typeof detail === 'string') return detail.trim() || null;
  if (!Array.isArray(detail) || detail.length === 0) return null;

  const first = detail[0];
  const label = fieldLabel(first.loc);
  const msg = String(first.msg || '').toLowerCase();

  if (first.type === 'missing' || msg.includes('field required')) {
    return `Please enter your ${label}.`;
  }
  if (msg.includes('valid email')) {
    return 'Please enter a valid email address.';
  }
  if (msg.includes('valid') || first.type?.includes('value_error')) {
    return `Please check your ${label} and try again.`;
  }

  return 'Please check your form and try again.';
}

export function formatBackendError(status, data) {
  const detail = data?.detail ?? data?.error ?? data?.message;
  // Some backend handlers return validation errors in `errors` while putting a
  // human-unfriendly summary string in `detail`.
  const maybeErrorsArray = Array.isArray(data?.errors) ? data.errors : null;

  const validationMessage = formatValidationDetail(maybeErrorsArray || detail);
  if (validationMessage && !looksTechnical(validationMessage)) {
    return validationMessage;
  }

  if (typeof detail === 'string' && detail.trim()) {
    const trimmed = detail.trim();
    if (trimmed.toLowerCase().startsWith('validation failed')) {
      return 'Some fields are missing or invalid. Please review the form and try again.';
    }
    if (trimmed.includes('is not set up yet')) {
      return 'One of the subjects you selected is not available right now. Please refresh the page and try again.';
    }
    if (!looksTechnical(trimmed)) {
      return trimmed;
    }
  }

  switch (status) {
    case 400:
      return 'Please check your details and try again.';
    case 403:
      return 'We could not verify this request. Please submit the form again.';
    case 404:
      return 'We could not find your entry. Please try joining the waitlist again.';
    case 409:
      return 'You have already signed up with this email or phone number.';
    case 413:
      return 'One of your files is too large. Please upload a smaller file and try again.';
    case 422:
      return 'Some fields are missing or invalid. Please review the form and try again.';
    case 429:
      return 'Too many attempts right now. Please wait a minute and try again.';
    case 502:
    case 503:
    case 504:
      return 'Our servers are temporarily unavailable. Please try again in a few minutes.';
    default:
      if (status >= 500) {
        return 'Something went wrong on our end. Please try again in a moment.';
      }
      return 'Something went wrong. Please try again.';
  }
}

const UPLOAD_STAGE_LABELS = {
  cnicFront: 'CNIC front photo',
  cnicBack: 'CNIC back photo',
  qualificationCert: 'qualification certificate',
};

const UPLOAD_STAGES = new Set(Object.keys(UPLOAD_STAGE_LABELS));

export function formatUploadError(message, uploadStage = '') {
  const stageLabel = UPLOAD_STAGE_LABELS[uploadStage];
  const fallback = stageLabel
    ? `We couldn't upload your ${stageLabel}. Please check the file and try again.`
    : 'We could not upload your file. Please check the file and try again.';

  if (!message || looksTechnical(message)) return fallback;

  const normalized = message.toLowerCase();
  if (normalized.includes('too large') || normalized.includes('too many uploads')) {
    return message;
  }
  if (normalized.includes('internet') || normalized.includes('connection')) {
    return message;
  }
  if (
    normalized.includes('only jpg') ||
    normalized.includes('extension') ||
    normalized.includes('no file selected')
  ) {
    return message;
  }

  return fallback;
}

export function getUserFacingError(error, context = {}) {
  if (!error) {
    return 'Something went wrong. Please try again.';
  }

  const message = typeof error === 'string' ? error : error.message;
  const isUploadStage = UPLOAD_STAGES.has(context.uploadStage);

  if (message && !looksTechnical(message)) {
    if (isUploadStage) {
      return formatUploadError(message, context.uploadStage);
    }
    return message;
  }

  if (isUploadStage) {
    return formatUploadError(message, context.uploadStage);
  }

  switch (context.action) {
    case 'student-waitlist':
      return 'We could not add you to the student waitlist. Please try again.';
    case 'teacher-waitlist':
      return 'We could not add you to the teacher waitlist. Please try again.';
    case 'badge-application':
      return 'We could not submit your badge application. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function backendNotConfiguredMessage() {
  return 'Sign-ups are temporarily unavailable. Please try again later or message us on Instagram @padhai.pk.';
}

export function networkErrorMessage() {
  return 'Could not reach our servers. Check your internet connection and try again.';
}
