// src/lib/waitlist.js
// All reads/writes go through the backend (no browser Firebase access).

import { SUBJECTS, BADGE_SEATS_PER_SUBJECT } from './subjects';
import { getFromBackend, postToBackend } from './backend.js';

const CACHE_BOOTSTRAP_KEY = 'padhai-cache-bootstrap-v1';
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h

function readBootstrapCache() {
  try {
    const raw = localStorage.getItem(CACHE_BOOTSTRAP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.savedAt || (Date.now() - parsed.savedAt) > CACHE_MAX_AGE_MS) return null;
    return parsed.value ?? null;
  } catch {
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

function mergeSubjects(bootstrapSubjects) {
  const byId = Object.fromEntries((bootstrapSubjects || []).map((s) => [s.id, s]));
  return SUBJECTS.map((s) => ({
    ...s,
    badgeSeatsFilled: byId[s.id]?.badgeSeatsFilled ?? 0,
    badgeSeatsMax: byId[s.id]?.badgeSeatsMax ?? BADGE_SEATS_PER_SUBJECT,
  }));
}

const DEFAULT_STATS = { studentsCount: 0, teachersNormalCount: 0, teachersBadgeCount: 0 };

let bootstrapCache = null;
let bootstrapPromise = null;

async function fetchBootstrapFromNetwork() {
  return getFromBackend('/bootstrap');
}

function getBootstrap({ allowNetwork = true } = {}) {
  if (bootstrapCache) {
    return Promise.resolve(bootstrapCache);
  }

  const cached = readBootstrapCache();
  if (cached) {
    bootstrapCache = cached;
    return Promise.resolve(cached);
  }

  if (!allowNetwork) {
    return Promise.resolve({ subjects: [], stats: DEFAULT_STATS });
  }

  if (!bootstrapPromise) {
    bootstrapPromise = fetchBootstrapFromNetwork()
      .then((data) => {
        bootstrapCache = data;
        writeBootstrapCache(data);
        return data;
      })
      .catch((err) => {
        bootstrapPromise = null;
        throw err;
      });
  }
  return bootstrapPromise;
}

function applyBootstrap(boot, { subjectsCb, statsCb, stopped }) {
  const list = mergeSubjects(boot?.subjects);
  const stats = boot?.stats || DEFAULT_STATS;
  if (!stopped) {
    if (subjectsCb) subjectsCb(list);
    if (statsCb) statsCb(stats);
  }
}

export function listenToSubjects(callback) {
  let stopped = false;

  async function loadOnce() {
    try {
      const boot = await getBootstrap();
      if (!stopped) callback(mergeSubjects(boot?.subjects));
    } catch {
      if (!stopped) callback(mergeSubjects([]));
    }
  }

  loadOnce();
  return () => {
    stopped = true;
  };
}

export function listenToStats(callback) {
  let stopped = false;

  async function loadOnce() {
    try {
      const boot = await getBootstrap();
      if (!stopped) callback(boot?.stats || DEFAULT_STATS);
    } catch {
      if (!stopped) callback(DEFAULT_STATS);
    }
  }

  loadOnce();
  return () => {
    stopped = true;
  };
}

/** One shared bootstrap load for pages that need both subjects and stats. */
export function listenToBootstrap({ onSubjects, onStats } = {}) {
  let stopped = false;

  async function loadOnce() {
    try {
      const boot = await getBootstrap();
      applyBootstrap(boot, { subjectsCb: onSubjects, statsCb: onStats, stopped });
    } catch {
      applyBootstrap(null, { subjectsCb: onSubjects, statsCb: onStats, stopped });
    }
  }

  loadOnce();
  return () => {
    stopped = true;
  };
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
