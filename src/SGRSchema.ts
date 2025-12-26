/**
 * SGRSchema.ts - Schema-Guided Reasoning (SGR) for Resume Screening
 *
 * This module defines Zod schemas that enforce structured reasoning during
 * LLM-powered resume screening. The ResumeScreeningSchema acts as a
 * "mandatory checklist" that forces the LLM to:
 *
 * 1. Evaluate each screening criterion systematically
 * 2. Provide evidence for conclusions from the resume
 * 3. Generate structured, validated output
 * 4. Make auditable hiring recommendations
 *
 * Key SGR Concept: The schema itself becomes the reasoning scaffold.
 * By requiring specific fields (skills analysis, experience breakdown,
 * screening steps), we prevent the LLM from making snap judgments.
 */

import { z } from 'zod';
import { scoringConfig, schemaConfig, enums } from './config.js';

// ============================================================================
// Enums - Constrained Output Categories
// ============================================================================

/**
 * CandidateFitEnum - Overall assessment of candidate fit
 *
 * Using z.enum() ensures the LLM can only output one of these exact values.
 * This is Constrained Decoding - invalid values are impossible.
 */
export const CandidateFitEnum = z.enum(enums.candidateFit);
export type CandidateFit = z.infer<typeof CandidateFitEnum>;

/**
 * ProficiencyLevelEnum - Skill proficiency levels
 */
export const ProficiencyLevelEnum = z.enum(enums.proficiencyLevels);
export type ProficiencyLevel = z.infer<typeof ProficiencyLevelEnum>;

/**
 * RecommendedActionEnum - Next steps for the candidate
 */
export const RecommendedActionEnum = z.enum(enums.recommendedActions);
export type RecommendedAction = z.infer<typeof RecommendedActionEnum>;

/**
 * EvaluationCategoryEnum - Categories for screening steps
 */
export const EvaluationCategoryEnum = z.enum(enums.evaluationCategories);
export type EvaluationCategory = z.infer<typeof EvaluationCategoryEnum>;

/**
 * RelevanceEnum - How relevant experience/education is to the role
 */
export const RelevanceEnum = z.enum(enums.relevanceTypes);
export type Relevance = z.infer<typeof RelevanceEnum>;

/**
 * DegreeTypeEnum - Education level types
 */
export const DegreeTypeEnum = z.enum(enums.degreeTypes);
export type DegreeType = z.infer<typeof DegreeTypeEnum>;

// ============================================================================
// Screening Step Schema - The Heart of SGR
// ============================================================================

/**
 * ScreeningStepSchema - Individual step in the screening process
 *
 * Each step forces the LLM to:
 * 1. Focus on a specific evaluation category
 * 2. Determine if the requirement is met
 * 3. Provide evidence from the resume
 * 4. Identify any gaps
 *
 * This creates an auditable trail and prevents "reasoning shortcuts".
 */
export const ScreeningStepSchema = z.object({
  step_number: z.number()
    .int()
    .min(1)
    .describe('Sequential step number in the screening process'),

  evaluation_category: EvaluationCategoryEnum
    .describe('The specific category being evaluated in this step'),

  requirement_met: z.boolean()
    .describe('Whether the candidate meets the requirement for this category'),

  evidence: z.string()
    .min(schemaConfig.minEvidenceLength)
    .describe('Specific evidence from the resume supporting this conclusion'),

  gap_identified: z.string()
    .optional()
    .describe('If requirement not met, what gap was identified')
});

export type ScreeningStep = z.infer<typeof ScreeningStepSchema>;

// ============================================================================
// Skills Analysis Schema
// ============================================================================

/**
 * ExtractedSkillSchema - A skill identified from the resume
 */
export const ExtractedSkillSchema = z.object({
  skill_name: z.string()
    .min(schemaConfig.minSkillNameLength)
    .describe('Name of the skill'),

  proficiency_level: ProficiencyLevelEnum
    .describe('Estimated proficiency based on resume evidence'),

  years_experience: z.number()
    .min(0)
    .optional()
    .describe('Estimated years of experience with this skill'),

  evidence_source: z.string()
    .describe('Where in the resume this skill was demonstrated')
});

export type ExtractedSkill = z.infer<typeof ExtractedSkillSchema>;

/**
 * SkillsAnalysisSchema - Comprehensive skills breakdown
 */
export const SkillsAnalysisSchema = z.object({
  technical_skills: z.array(ExtractedSkillSchema)
    .describe('Technical/hard skills identified'),

  soft_skills: z.array(z.string().min(1))
    .describe('Soft skills identified (leadership, communication, etc.)'),

  certifications: z.array(z.string())
    .describe('Professional certifications held'),

  required_skills_matched: z.array(z.string())
    .describe('Which required skills from the job posting were found'),

  missing_required_skills: z.array(z.string())
    .describe('Required skills from job posting NOT found in resume')
});

export type SkillsAnalysis = z.infer<typeof SkillsAnalysisSchema>;

// ============================================================================
// Experience Analysis Schema
// ============================================================================

/**
 * WorkExperienceSchema - A single work experience entry
 */
export const WorkExperienceAnalysisSchema = z.object({
  company: z.string()
    .describe('Company name'),

  role: z.string()
    .describe('Job title/role'),

  duration_months: z.number()
    .int()
    .min(0)
    .describe('Duration in months'),

  relevance: RelevanceEnum
    .describe('How relevant this experience is to the target role'),

  key_achievements: z.array(z.string())
    .describe('Notable achievements in this role'),

  skills_demonstrated: z.array(z.string())
    .describe('Skills demonstrated in this role')
});

export type WorkExperienceAnalysis = z.infer<typeof WorkExperienceAnalysisSchema>;

/**
 * ExperienceAnalysisSchema - Overall experience summary
 */
export const ExperienceAnalysisSchema = z.object({
  total_years: z.number()
    .min(0)
    .describe('Total years of professional experience'),

  relevant_years: z.number()
    .min(0)
    .describe('Years of experience relevant to this role'),

  experience_level: z.enum(['entry', 'mid', 'senior', 'lead', 'executive'])
    .describe('Overall experience level assessment'),

  career_progression: z.enum(['ascending', 'lateral', 'mixed', 'early_career'])
    .describe('Pattern of career growth'),

  work_history: z.array(WorkExperienceAnalysisSchema)
    .describe('Analysis of each work experience entry')
});

export type ExperienceAnalysis = z.infer<typeof ExperienceAnalysisSchema>;

// ============================================================================
// Education Analysis Schema
// ============================================================================

/**
 * EducationEntrySchema - A single education entry
 */
export const EducationEntrySchema = z.object({
  institution: z.string()
    .describe('Name of educational institution'),

  degree: z.string()
    .describe('Degree or certification earned'),

  field_of_study: z.string()
    .describe('Major or field of study'),

  graduation_year: z.number()
    .int()
    .optional()
    .describe('Year of graduation'),

  relevance: RelevanceEnum
    .describe('How relevant this education is to the role')
});

export type EducationEntry = z.infer<typeof EducationEntrySchema>;

/**
 * EducationAnalysisSchema - Overall education summary
 */
export const EducationAnalysisSchema = z.object({
  highest_degree: DegreeTypeEnum
    .describe('Highest level of education completed'),

  education_history: z.array(EducationEntrySchema)
    .describe('All education entries'),

  meets_education_requirement: z.boolean()
    .describe('Whether candidate meets the education requirements for the role')
});

export type EducationAnalysis = z.infer<typeof EducationAnalysisSchema>;

// ============================================================================
// Main Resume Screening Schema - The Complete SGR Structure
// ============================================================================

/**
 * ResumeScreeningSchema - Main SGR Schema for Resume Analysis
 *
 * This is the core Schema-Guided Reasoning structure. When sent to an LLM
 * with Structured Outputs enabled (strict=true), the model MUST produce
 * output conforming exactly to this schema.
 *
 * The complexity demonstrates that Constrained Decoding can handle
 * real-world production requirements with nested structures.
 */
export const ResumeScreeningSchema = z.object({
  // Identifiers
  candidate_id: z.string()
    .min(1)
    .describe('Unique identifier for the candidate'),

  job_id: z.string()
    .min(1)
    .describe('Unique identifier for the job posting'),

  // High-level assessment - constrained to enum values
  overall_fit: CandidateFitEnum
    .describe('Overall assessment of candidate fit for the role'),

  /**
   * screening_steps - The Heart of SGR
   *
   * This array is what makes this Schema-Guided Reasoning:
   * - Forces LLM to evaluate each criterion systematically
   * - Each step requires evidence from the resume
   * - Creates an auditable reasoning trail
   * - Prevents jumping to conclusions
   */
  screening_steps: z.array(ScreeningStepSchema)
    .min(schemaConfig.minScreeningSteps)
    .describe('Mandatory screening steps - each evaluates a different criterion'),

  // Detailed analyses
  skills_analysis: SkillsAnalysisSchema
    .describe('Comprehensive breakdown of candidate skills'),

  experience_analysis: ExperienceAnalysisSchema
    .describe('Analysis of work experience'),

  education_analysis: EducationAnalysisSchema
    .describe('Analysis of educational background'),

  /**
   * fit_score - Numeric constraint demonstration
   *
   * The min/max constraints prove that Structured Outputs
   * can enforce numeric ranges. The LLM cannot output
   * values outside 0-100.
   */
  fit_score: z.number()
    .min(scoringConfig.fitScore.min)
    .max(scoringConfig.fitScore.max)
    .describe('Candidate fit score from 0 (no fit) to 100 (perfect fit)'),

  // Key findings
  strengths: z.array(z.string().min(1))
    .min(schemaConfig.minStrengths)
    .describe('Key strengths of the candidate'),

  concerns: z.array(z.string())
    .describe('Potential concerns or gaps to address'),

  // Actionable outputs
  recommended_action: RecommendedActionEnum
    .describe('Recommended next action for this candidate'),

  interview_focus_areas: z.array(z.string())
    .describe('Suggested areas to explore if candidate advances to interview')
});

export type ResumeScreening = z.infer<typeof ResumeScreeningSchema>;

// ============================================================================
// Example Data - Valid ResumeScreening Object
// ============================================================================

/**
 * Example of a valid ResumeScreening object for a strong match candidate
 *
 * This demonstrates the expected structure and can be used for:
 * - Documentation
 * - Test fixtures
 * - LLM few-shot examples
 */
export const exampleResumeScreening: ResumeScreening = {
  candidate_id: 'CAND-001',
  job_id: 'JOB-2024-001',
  overall_fit: 'strong_match',

  screening_steps: [
    {
      step_number: 1,
      evaluation_category: 'technical_skills',
      requirement_met: true,
      evidence: 'Candidate has 7 years of TypeScript and Python experience, with AWS and Kubernetes certifications. Led microservices migration at TechCorp.'
    },
    {
      step_number: 2,
      evaluation_category: 'experience_level',
      requirement_met: true,
      evidence: 'Total of 7 years professional experience, including 3 years as Senior Engineer with team leadership responsibilities.'
    },
    {
      step_number: 3,
      evaluation_category: 'education',
      requirement_met: true,
      evidence: 'B.S. Computer Science from UC Berkeley (GPA 3.7), meeting the degree requirement.'
    }
  ],

  skills_analysis: {
    technical_skills: [
      {
        skill_name: 'TypeScript',
        proficiency_level: 'expert',
        years_experience: 5,
        evidence_source: 'Used across all three positions, led TypeScript migration at TechCorp'
      },
      {
        skill_name: 'Python',
        proficiency_level: 'advanced',
        years_experience: 7,
        evidence_source: 'Built data pipeline processing 10TB monthly at StartupXYZ'
      },
      {
        skill_name: 'Kubernetes',
        proficiency_level: 'advanced',
        years_experience: 3,
        evidence_source: 'CKA certified, used for microservices deployment at TechCorp'
      }
    ],
    soft_skills: ['Leadership', 'Mentorship', 'Technical Communication'],
    certifications: ['AWS Solutions Architect Professional', 'CKA'],
    required_skills_matched: ['TypeScript', 'Python', 'AWS', 'Distributed Systems'],
    missing_required_skills: []
  },

  experience_analysis: {
    total_years: 7,
    relevant_years: 7,
    experience_level: 'senior',
    career_progression: 'ascending',
    work_history: [
      {
        company: 'TechCorp Inc.',
        role: 'Senior Software Engineer',
        duration_months: 36,
        relevance: 'highly_relevant',
        key_achievements: [
          'Led microservices migration serving 2M+ users',
          'Mentored 3 junior engineers to promotion'
        ],
        skills_demonstrated: ['TypeScript', 'Kubernetes', 'System Design', 'Leadership']
      }
    ]
  },

  education_analysis: {
    highest_degree: 'bachelor',
    education_history: [
      {
        institution: 'University of California, Berkeley',
        degree: 'B.S. Computer Science',
        field_of_study: 'Computer Science',
        graduation_year: 2016,
        relevance: 'highly_relevant'
      }
    ],
    meets_education_requirement: true
  },

  fit_score: 92,

  strengths: [
    'Exceeds experience requirement with 7 years in relevant roles',
    'Has all required technical skills plus preferred Kubernetes experience',
    'Proven leadership and mentorship track record',
    'Strong career progression with measurable achievements'
  ],

  concerns: [],

  recommended_action: 'advance_to_interview',

  interview_focus_areas: [
    'Deep dive on microservices architecture decisions',
    'Team leadership philosophy and conflict resolution',
    'Long-term career goals and interest in the role'
  ]
};
