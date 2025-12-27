/**
 * Centralized Configuration for Resume Screening SGR Demo
 *
 * All configurable values are extracted here for easy modification.
 */

// ============================================================================
// OpenAI Configuration
// ============================================================================

export const openaiConfig = {
  // API key loaded from environment variable (required for real API)
  apiKey: process.env.OPENAI_API_KEY || '',

  // Whether to use real API or simulation
  // Set to true to use real OpenAI API, false for simulation
  useRealAPI: process.env.USE_REAL_API === 'true',

  // Model override (optional - defaults to primaryModel in modelConfig)
  // Use this to switch to cheaper models: OPENAI_MODEL=gpt-4o-mini
  model: process.env.OPENAI_MODEL || undefined,

  // Base URL (optional, for proxies or Azure OpenAI)
  baseURL: process.env.OPENAI_BASE_URL || undefined
} as const;

// ============================================================================
// Model Configuration
// ============================================================================

export const modelConfig = {
  primaryModel: 'gpt-4o',
  fallbackModel: 'gpt-4o-mini',
  maxTokens: 4096,
  temperature: 0.1,  // Low for consistent structured output
  maxRetries: 3
} as const;

// ============================================================================
// Scoring Configuration
// ============================================================================

export const scoringConfig = {
  fitScore: {
    min: 0,
    max: 100
  },
  thresholds: {
    strongMatch: 80,   // 80-100: Strong match
    qualified: 60,     // 60-79: Qualified
    potentialFit: 40,  // 40-59: Potential fit
    notQualified: 0    // 0-39: Not qualified
  }
} as const;

// ============================================================================
// Schema Constraints
// ============================================================================

export const schemaConfig = {
  minScreeningSteps: 3,
  minStrengths: 1,
  minSkillNameLength: 1,
  minEvidenceLength: 10
} as const;

// ============================================================================
// Enum Values (used by Zod schemas)
// ============================================================================

export const enums = {
  candidateFit: [
    'strong_match',
    'qualified',
    'potential_fit',
    'not_qualified'
  ] as const,

  proficiencyLevels: [
    'beginner',
    'intermediate',
    'advanced',
    'expert'
  ] as const,

  recommendedActions: [
    'advance_to_interview',
    'phone_screen_first',
    'hold_for_review',
    'reject'
  ] as const,

  evaluationCategories: [
    'technical_skills',
    'experience_level',
    'education',
    'soft_skills',
    'culture_fit'
  ] as const,

  degreeTypes: [
    'high_school',
    'associate',
    'bachelor',
    'master',
    'doctorate',
    'bootcamp',
    'certification'
  ] as const,

  relevanceTypes: [
    'highly_relevant',
    'somewhat_relevant',
    'not_relevant'
  ] as const,

  candidateStatuses: [
    'new_application',
    'screening_complete',
    'phone_screen',
    'interview_scheduled',
    'interview_complete',
    'offer_extended',
    'hired',
    'rejected',
    'withdrawn'
  ] as const,

  emailTypes: [
    'application_received',
    'phone_screen_invite',
    'interview_invite',
    'rejection',
    'offer_letter',
    'request_more_info'
  ] as const,

  interviewTypes: [
    'phone_screen',
    'technical',
    'behavioral',
    'panel',
    'final_round',
    'hiring_manager'
  ] as const,

  flagReasons: [
    'overqualified',
    'underqualified_but_potential',
    'career_changer',
    'internal_candidate',
    'referral',
    'incomplete_information',
    'edge_case'
  ] as const,

  priorityLevels: [
    'low',
    'medium',
    'high',
    'urgent'
  ] as const
} as const;

// ============================================================================
// Simulation Configuration
// ============================================================================

export const simulationConfig = {
  // Token counts for simulated responses
  tokenCounts: {
    success: 350,
    failure: 150
  },
  // Simulated model version
  modelVersion: 'simulated-resume-screener-v1'
} as const;

// ============================================================================
// Type exports for use in other modules
// ============================================================================

export type CandidateFit = typeof enums.candidateFit[number];
export type ProficiencyLevel = typeof enums.proficiencyLevels[number];
export type RecommendedAction = typeof enums.recommendedActions[number];
export type EvaluationCategory = typeof enums.evaluationCategories[number];
export type DegreeType = typeof enums.degreeTypes[number];
export type RelevanceType = typeof enums.relevanceTypes[number];
export type CandidateStatus = typeof enums.candidateStatuses[number];
export type EmailType = typeof enums.emailTypes[number];
export type InterviewType = typeof enums.interviewTypes[number];
export type FlagReason = typeof enums.flagReasons[number];
export type PriorityLevel = typeof enums.priorityLevels[number];
