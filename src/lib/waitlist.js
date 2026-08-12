// src/lib/waitlist.js
// All reads/writes go through the backend (no browser Firebase access).

import { SUBJECTS, BADGE_SEATS_PER_SUBJECT } from './subjects';
import { getFromBackend, postToBackend } from './backend.js';

const CACHE_BOOTSTRAP_KEY = 'padhai-cache-bootstrap-v3';
const CACHE_BOOTSTRAP_KEY_LEGACY = 'padhai-cache-bootstrap-v2';
const CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

function clearPersistedBootstrapCache() {
  try {
    localStorage.removeItem(CACHE_BOOTSTRAP_KEY);
    localStorage.removeItem(CACHE_BOOTSTRAP_KEY_LEGACY);
  } catch {
    // ignore
  }
}

function readBootstrapCache() {
  try {
    const raw = localStorage.getItem(CACHE_BOOTSTRAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      clearPersistedBootstrapCache();
      return null;
    }
    if (!parsed.savedAt || (Date.now() - parsed.savedAt) > CACHE_MAX_AGE_MS) {
      clearPersistedBootstrapCache();
      return null;
    }
    return parsed.value ?? null;
  } catch {
    clearPersistedBootstrapCache();
    return null;
  }
}

function writeBootstrapCache(value) {
  try {
    localStorage.setItem(CACHE_BOOTSTRAP_KEY, JSON.stringify({ savedAt: Date.now(), value }));
  } catch {
    // ignore cache failures (private mode / quota)
  }
}

function normalizeSubject(s) {
  return {
    id: s.id,
    name: s.name,
    category: s.category || 'Uncategorized',
    badgeSeatsFilled: Number(s.badgeSeatsFilled) || 0,
    badgeSeatsMax: Number(s.badgeSeatsMax) || BADGE_SEATS_PER_SUBJECT,
  };
}

function fallbackSubjects() {
  return SUBJECTS.map((s) => ({
    ...s,
    badgeSeatsFilled: 0,
    badgeSeatsMax: BADGE_SEATS_PER_SUBJECT,
  }));
}

/** Backend PostgreSQL is the source of truth; hardcoded SUBJECTS is offline fallback only. */
function mergeSubjects(bootstrapSubjects) {
  if (Array.isArray(bootstrapSubjects) && bootstrapSubjects.length > 0) {
    return bootstrapSubjects.map(normalizeSubject);
  }
  return fallbackSubjects();
}

const DEFAULT_STATS = { studentsCount: 0, teachersNormalCount: 0, teachersBadgeCount: 0 };

let bootstrapPromise = null;

async function fetchBootstrapFromNetwork() {
  return getFromBackend('/bootstrap');
}

/** Always revalidates from the network; uses local cache only as a fast fallback. */
function fetchBootstrapFresh() {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchBootstrapFromNetwork()
      .then((data) => {
        writeBootstrapCache(data);
        return data;
      })
      .finally(() => {
        bootstrapPromise = null;
      });
  }
  return bootstrapPromise;
}

function getBootstrap({ allowNetwork = true } = {}) {
  if (!allowNetwork) {
    const cached = readBootstrapCache();
    return Promise.resolve(cached || { subjects: [], stats: DEFAULT_STATS });
  }

  return fetchBootstrapFresh().catch(() => {
    const cached = readBootstrapCache();
    if (cached) return cached;
    return { subjects: [], stats: DEFAULT_STATS };
  });
}

function applyBootstrap(boot, { subjectsCb, statsCb, stopped }) {
  const list = mergeSubjects(boot?.subjects);
  const stats = boot?.stats || DEFAULT_STATS;
  if (!stopped) {
    if (subjectsCb) subjectsCb(list);
    if (statsCb) statsCb(stats);
  }
}

function shouldUsePersistedCache() {
  const nav = performance.getEntriesByType('navigation')[0];
  // Hard/soft reload should always revalidate — don't paint stale localStorage first.
  if (nav?.type === 'reload') return false;
  return true;
}

async function loadBootstrapData({ subjectsCb, statsCb, isStopped }) {
  if (isStopped()) return;

  const cached = shouldUsePersistedCache() ? readBootstrapCache() : null;
  if (cached) {
    applyBootstrap(cached, { subjectsCb, statsCb, stopped: isStopped() });
  }

  try {
    const boot = await getBootstrap();
    if (!isStopped()) applyBootstrap(boot, { subjectsCb, statsCb, stopped: false });
  } catch {
    if (!cached && !isStopped()) {
      applyBootstrap(null, { subjectsCb, statsCb, stopped: false });
    }
  }
}

function subscribeBootstrap({ onSubjects, onStats } = {}) {
  let stopped = false;
  const isStopped = () => stopped;

  loadBootstrapData({ subjectsCb: onSubjects, statsCb: onStats, isStopped });

  const refreshTimer = window.setInterval(() => {
    loadBootstrapData({ subjectsCb: onSubjects, statsCb: onStats, isStopped });
  }, CACHE_MAX_AGE_MS);

  return () => {
    stopped = true;
    window.clearInterval(refreshTimer);
  };
}

export function listenToSubjects(callback) {
  return subscribeBootstrap({ onSubjects: callback });
}

export function listenToStats(callback) {
  return subscribeBootstrap({ onStats: callback });
}

/** One shared bootstrap load for pages that need both subjects and stats. */
export function listenToBootstrap({ onSubjects, onStats } = {}) {
  return subscribeBootstrap({ onSubjects, onStats });
}

export async function joinStudentWaitlist(formData) {
  return postToBackend('/students', {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    country: formData.country || '',
    city: formData.city || '',
    subjects: formData.subjects || [],
  });
}

export async function joinTeacherNormalWaitlist(formData) {
  return postToBackend('/teachers', {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    country: formData.country || '',
    city: formData.city || '',
    subjects: formData.subjects || [],
    experience: formData.experience || '',
  });
}

export async function joinTeacherBadgeWaitlist(formData) {
  return postToBackend('/badge-application', {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    country: formData.country || '',
    city: formData.city || '',
    cnicNumber: formData.cnicNumber || '',
    subjectIds: formData.subjectIds || [],
    qualification: formData.qualification || '',
    institution: formData.institution || '',
    experience: formData.experience || '',
    bio: formData.bio || '',
    introVideoLink: formData.introVideoLink || '',
    documents: formData.documents || {},
    policiesAccepted: formData.policiesAccepted || false,
  });
}

export async function markShared({ collectionName, id, shareToken, platform }) {
  return postToBackend('/mark-shared', { collection: collectionName, id, shareToken, platform });
}
