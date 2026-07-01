// Mirrors supabase/migrations/0001_init.sql. Keep in sync.

export const CATEGORIES = ['Wellness', 'F&B', 'Beauty'] as const;
export const SOURCES = ['Warm intro', 'Referral', 'Content engagement', 'Cold'] as const;
export const WARMTHS = ['Cold', 'Warm-adjacent', 'Warm'] as const;
export const STAGES = [
  'To Research',
  'Ready to Reach',
  'Contacted',
  'In Conversation',
  'Call Booked',
  'Won',
  'Passed',
] as const;
export const ACTIVITY_TYPES = [
  'Note',
  'Email drafted',
  'Email sent',
  'Reply received',
  'Call booked',
  'Follow-up done',
] as const;
export const FOLLOWUP_STATUSES = ['Pending', 'Done', 'Snoozed', 'Cancelled'] as const;

export type Category = (typeof CATEGORIES)[number];
export type Source = (typeof SOURCES)[number];
export type Warmth = (typeof WARMTHS)[number];
export type Stage = (typeof STAGES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

// Stages that graduate a prospect → fire the webhook stub.
export const GRADUATION_STAGES: Stage[] = ['Call Booked', 'Won'];

export interface Prospect {
  id: string;
  brand_name: string;
  category: Category | null;
  country: string | null;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  website: string | null;
  source: Source | null;
  signal: string | null;
  warmth: Warmth | null;
  stage: Stage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  prospect_id: string;
  type: ActivityType;
  body: string | null;
  created_at: string;
}

export interface Followup {
  id: string;
  prospect_id: string;
  due_date: string; // 'YYYY-MM-DD'
  status: FollowupStatus;
  sequence_step: number;
  reason: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface CadenceStep {
  days_after: number;
  note: string;
}

export interface Icp {
  target_categories?: string[];
  target_regions?: string[];
  company_stage?: string;
  company_size?: string;
  decision_maker_roles?: string;
  buying_signals?: string;
  disqualifiers?: string;
  notes?: string;
}

export type DraftModel = 'claude-haiku' | 'openrouter' | 'gemini-flash' | 'groq-llama';

export interface Settings {
  id: string;
  my_voice: string | null;
  my_offer: string | null;
  credibility: string | null;
  icp: Icp;
  draft_model: DraftModel;
  openrouter_model: string;
  followup_cadence: CadenceStep[];
  webhook_url: string | null;
  updated_at: string;
}

// A prospect joined with its single active pending/snoozed follow-up (if any).
export interface ProspectWithFollowup extends Prospect {
  followup: Followup | null;
}
