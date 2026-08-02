// src/lib/icons.js
// Maps a plain string (as stored in content.json) to a lucide-react icon
// component, so content editors can reference icons by name without
// touching JSX/component code.

import {
  UserRound, Lightbulb, Unlink, FileEdit, Send, Video, Lock, BadgeCheck,
  ArrowLeftRight, PenLine, TrendingUp, Star, Landmark, Wallet,
  BookOpen, GraduationCap, Award, Users, ShieldCheck, PenTool, Sparkles,
  School, Notebook, PencilRuler, MessageCircleQuestion, WalletIcon, Banknote
} from 'lucide-react';

export const ICONS = {
  UserRound, Lightbulb, Unlink, FileEdit, Send, Video, Lock, BadgeCheck, WalletIcon, Banknote,
  ArrowLeftRight, PenLine, TrendingUp, Star, Landmark, Wallet,
  BookOpen, GraduationCap, Award, Users, ShieldCheck, PenTool, Sparkles,
  School, Notebook, PencilRuler, MessageCircleQuestion,
};

// Safe lookup — falls back to Sparkles so a typo'd icon name in the JSON
// never crashes the page, it just renders a generic icon.
export function getIcon(name) {
  return ICONS[name] || Sparkles;
}
