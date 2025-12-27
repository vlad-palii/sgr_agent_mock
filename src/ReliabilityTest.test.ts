/**
 * ReliabilityTest.test.ts - Testing and Evaluation for Resume Screening
 *
 * This module demonstrates production-grade testing patterns for LLM applications
 * that use Structured Outputs and Schema-Guided Reasoning.
 *
 * Key Testing Concepts:
 * 1. Validation Testing - Ensure Zod schemas catch malformed LLM output
 * 2. Schema Conformance - Verify all SGR steps are present and valid
 * 3. Evals Framework - Production evaluation patterns (e.g., promptfoo)
 * 4. Retry Logic - How to handle and recover from validation failures
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import {
  ResumeScreeningSchema,
  ResumeScreening,
  ScreeningStepSchema,
  CandidateFitEnum,
  ExtractedSkillSchema
} from './SGRSchema.js';
import {
  runResumeScreening,
  resetSimulationState,
  setCandidateType
} from './LLMAgent.js';
import {
  executeAgentFlow,
  UpdateATSArgsSchema,
  FlagForReviewArgsSchema
} from './AgentFlow.js';
import { strongMatchCandidate, potentialFitCandidate } from './examples/resumes.js';
import { defaultJob } from './examples/jobDescriptions.js';

// ============================================================
// VALIDATION TESTS - Core Zod Schema Testing
// ============================================================

describe('ResumeScreeningSchema Validation', () => {
  /**
   * Test 1: Valid data passes validation
   */
  it('should accept valid resume screening data', () => {
    const validData: ResumeScreening = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has all required skills including TypeScript and Python', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: '7 years of relevant experience in software engineering', gap_identified: null },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'BS Computer Science from accredited university', gap_identified: null }
      ],
      skills_analysis: {
        technical_skills: [{ skill_name: 'TypeScript', proficiency_level: 'expert', years_experience: 5, evidence_source: 'Work history' }],
        soft_skills: ['Leadership'],
        certifications: [],
        required_skills_matched: ['TypeScript'],
        missing_required_skills: []
      },
      experience_analysis: {
        total_years: 7,
        relevant_years: 7,
        experience_level: 'senior',
        career_progression: 'ascending',
        work_history: []
      },
      education_analysis: {
        highest_degree: 'bachelor',
        education_history: [],
        meets_education_requirement: true
      },
      fit_score: 90,
      strengths: ['Strong technical background'],
      concerns: [],
      recommended_action: 'advance_to_interview',
      interview_focus_areas: ['System design']
    };

    const result = ResumeScreeningSchema.parse(validData);
    expect(result.candidate_id).toBe('CAND-001');
    expect(result.overall_fit).toBe('strong_match');
  });

  /**
   * Test 2: Invalid enum value throws ZodError
   */
  it('should reject invalid overall_fit enum value', () => {
    const invalidData = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'maybe_qualified', // Invalid enum value
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills' },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience' },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'Has degree' }
      ],
      skills_analysis: { technical_skills: [], soft_skills: [], certifications: [], required_skills_matched: [], missing_required_skills: [] },
      experience_analysis: { total_years: 5, relevant_years: 5, experience_level: 'senior', career_progression: 'ascending', work_history: [] },
      education_analysis: { highest_degree: 'bachelor', education_history: [], meets_education_requirement: true },
      fit_score: 80,
      strengths: ['Good'],
      concerns: [],
      recommended_action: 'advance_to_interview',
      interview_focus_areas: []
    };

    expect(() => ResumeScreeningSchema.parse(invalidData)).toThrow(ZodError);
  });

  /**
   * Test 3: Out-of-range fit score is rejected
   */
  it('should reject fit score outside valid range (0-100)', () => {
    const invalidData = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills' },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience' },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'Has degree' }
      ],
      skills_analysis: { technical_skills: [], soft_skills: [], certifications: [], required_skills_matched: [], missing_required_skills: [] },
      experience_analysis: { total_years: 5, relevant_years: 5, experience_level: 'senior', career_progression: 'ascending', work_history: [] },
      education_analysis: { highest_degree: 'bachelor', education_history: [], meets_education_requirement: true },
      fit_score: 150, // Out of range
      strengths: ['Good'],
      concerns: [],
      recommended_action: 'advance_to_interview',
      interview_focus_areas: []
    };

    expect(() => ResumeScreeningSchema.parse(invalidData)).toThrow(ZodError);
  });

  /**
   * Test 4: Minimum screening steps enforcement
   */
  it('should require minimum 3 screening steps for SGR compliance', () => {
    const insufficientSteps = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills' },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience' }
        // Only 2 steps - should fail (min is 3)
      ],
      skills_analysis: { technical_skills: [], soft_skills: [], certifications: [], required_skills_matched: [], missing_required_skills: [] },
      experience_analysis: { total_years: 5, relevant_years: 5, experience_level: 'senior', career_progression: 'ascending', work_history: [] },
      education_analysis: { highest_degree: 'bachelor', education_history: [], meets_education_requirement: true },
      fit_score: 80,
      strengths: ['Good'],
      concerns: [],
      recommended_action: 'advance_to_interview',
      interview_focus_areas: []
    };

    expect(() => ResumeScreeningSchema.parse(insufficientSteps)).toThrow(ZodError);
  });

  /**
   * Test 5: Missing required field detection
   */
  it('should reject data with missing required fields', () => {
    const missingFields = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match'
      // Missing: screening_steps, skills_analysis, experience_analysis, etc.
    };

    expect(() => ResumeScreeningSchema.parse(missingFields)).toThrow(ZodError);
  });
});

// ============================================================
// LLM AGENT INTEGRATION TESTS
// ============================================================

describe('LLMAgent Validation Handling', () => {
  beforeEach(() => {
    resetSimulationState();
  });

  /**
   * Test 6: Successful validation flow
   */
  it('should successfully parse valid LLM response', async () => {
    setCandidateType('strong_match');
    const result = await runResumeScreening(strongMatchCandidate, defaultJob);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.candidate_id).toBe('CAND-001');
    expect(result.data?.screening_steps.length).toBeGreaterThanOrEqual(3);
  });

  /**
   * Test 7: Catch ZodError on malformed LLM response
   */
  it('should catch and report ZodError for invalid LLM response', async () => {
    const result = await runResumeScreening(strongMatchCandidate, defaultJob, true);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('validation_error');
    expect(result.error?.details).toBeDefined();
    expect(Array.isArray(result.error?.details)).toBe(true);

    const issues = result.error?.details || [];
    expect(issues.length).toBeGreaterThan(0);
    expect(result.rawResponse).toBeDefined();
  });

  /**
   * Test 8: Different candidate types produce appropriate results
   */
  it('should produce different results for different candidate types', async () => {
    setCandidateType('strong_match');
    const strongResult = await runResumeScreening(strongMatchCandidate, defaultJob);

    setCandidateType('potential_fit');
    const potentialResult = await runResumeScreening(potentialFitCandidate, defaultJob);

    expect(strongResult.success).toBe(true);
    expect(potentialResult.success).toBe(true);

    expect(strongResult.data?.overall_fit).toBe('strong_match');
    expect(potentialResult.data?.overall_fit).toBe('potential_fit');

    expect(strongResult.data?.fit_score).toBeGreaterThan(potentialResult.data?.fit_score || 0);
  });
});

// ============================================================
// AGENT FLOW TESTS - Function Calling Validation
// ============================================================

describe('AgentFlow Function Calling Validation', () => {
  const validScreening: ResumeScreening = {
    candidate_id: 'CAND-001',
    job_id: 'JOB-001',
    overall_fit: 'strong_match',
    screening_steps: [
      { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has all required skills' },
      { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: '7 years experience' },
      { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'CS degree' }
    ],
    skills_analysis: {
      technical_skills: [{ skill_name: 'TypeScript', proficiency_level: 'expert', evidence_source: 'Resume' }],
      soft_skills: ['Leadership'],
      certifications: [],
      required_skills_matched: ['TypeScript'],
      missing_required_skills: []
    },
    experience_analysis: { total_years: 7, relevant_years: 7, experience_level: 'senior', career_progression: 'ascending', work_history: [] },
    education_analysis: { highest_degree: 'bachelor', education_history: [], meets_education_requirement: true },
    fit_score: 90,
    strengths: ['Strong technical skills', 'Great experience'],
    concerns: [],
    recommended_action: 'advance_to_interview',
    interview_focus_areas: ['System design', 'Leadership']
  };

  /**
   * Test 9: Valid function call execution
   */
  it('should execute function with valid arguments', async () => {
    const result = await executeAgentFlow(validScreening, false);

    expect(result.success).toBe(true);
    expect(result.functionCalled).toBe('updateATS');
  });

  /**
   * Test 10: Invalid function arguments are caught
   */
  it('should catch validation errors for invalid function arguments', async () => {
    const result = await executeAgentFlow(validScreening, true);

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('validation_error');
    expect(result.error?.details).toBeDefined();
  });
});

// ============================================================
// EVALS FRAMEWORK COMMENT BLOCK
// ============================================================

/**
 * ============================================================
 * LLM EVALUATION (EVALS) SYSTEM DESIGN FOR RESUME SCREENING
 * ============================================================
 *
 * EVAL TYPE 1: is-json (Deterministic Check)
 * -------------------------------------------
 * Purpose: Verify the LLM output is valid JSON.
 *
 * promptfoo configuration example:
 * ```yaml
 * tests:
 *   - vars:
 *       resume: "Alex Chen - Senior Software Engineer..."
 *       job: "Senior Software Engineer position..."
 *     assert:
 *       - type: is-json
 * ```
 *
 * EVAL TYPE 2: schema-conformance (SGR Validation)
 * -------------------------------------------------
 * Purpose: Verify all mandatory SGR fields are present and valid.
 *
 * ```yaml
 * tests:
 *   - assert:
 *       - type: javascript
 *         value: |
 *           const { ResumeScreeningSchema } = require('./SGRSchema');
 *           try {
 *             const parsed = JSON.parse(output);
 *             ResumeScreeningSchema.parse(parsed);
 *             // SGR-specific checks:
 *             if (parsed.screening_steps.length < 3) {
 *               return { pass: false, reason: 'Insufficient screening steps' };
 *             }
 *             // Verify each step has evidence
 *             const missingEvidence = parsed.screening_steps.filter(s => !s.evidence);
 *             if (missingEvidence.length > 0) {
 *               return { pass: false, reason: 'Missing evidence in screening steps' };
 *             }
 *             return { pass: true };
 *           } catch (e) {
 *             return { pass: false, reason: e.message };
 *           }
 * ```
 *
 * EVAL TYPE 3: screening-accuracy (Business Logic)
 * ------------------------------------------------
 * Purpose: Verify screening decisions align with resume content.
 *
 * ```yaml
 * tests:
 *   - vars:
 *       resume: "10 years TypeScript, AWS certified, Stanford CS..."
 *     assert:
 *       - type: javascript
 *         value: |
 *           const parsed = JSON.parse(output);
 *           // Qualified candidate should not be rejected
 *           if (parsed.overall_fit === 'not_qualified') {
 *             return { pass: false, reason: 'Qualified candidate incorrectly rejected' };
 *           }
 *           // Strong candidates should have high scores
 *           if (parsed.overall_fit === 'strong_match' && parsed.fit_score < 80) {
 *             return { pass: false, reason: 'Strong match should have score >= 80' };
 *           }
 *           return { pass: true };
 * ```
 *
 * ============================================================
 */

// ============================================================
// RETRY LOGIC COMMENT BLOCK
// ============================================================

/**
 * ============================================================
 * RETRY LOGIC FOR VALIDATION FAILURES
 * ============================================================
 *
 * Example retry implementation for resume screening:
 *
 * ```typescript
 * const MAX_RETRIES = 3;
 *
 * async function screenWithRetry(resume: Resume, job: JobDescription): Promise<LLMAgentResult> {
 *   let lastError: string | undefined;
 *
 *   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
 *     console.log(`Screening attempt ${attempt}/${MAX_RETRIES}`);
 *
 *     const result = await runResumeScreening(resume, job);
 *
 *     if (result.success) {
 *       console.log(`Success on attempt ${attempt}`);
 *       return result;
 *     }
 *
 *     lastError = result.error?.message;
 *
 *     if (result.error?.details) {
 *       const fieldErrors = result.error.details
 *         .map(issue => `- ${issue.path.join('.')}: ${issue.message}`)
 *         .join('\n');
 *       lastError += `\n\nSpecific errors:\n${fieldErrors}`;
 *     }
 *
 *     console.log(`Attempt ${attempt} failed, will retry...`);
 *   }
 *
 *   return {
 *     success: false,
 *     error: {
 *       type: 'validation_error',
 *       message: `Failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`
 *     },
 *     rawResponse: ''
 *   };
 * }
 * ```
 *
 * ============================================================
 */

// ============================================================
// ADDITIONAL UTILITY TESTS
// ============================================================

describe('Schema Utility Functions', () => {
  /**
   * Test 11: Verify CandidateFit enum values
   */
  it('should only accept defined enum values for overall_fit', () => {
    const validValues = ['strong_match', 'qualified', 'potential_fit', 'not_qualified'];

    validValues.forEach(value => {
      expect(() => CandidateFitEnum.parse(value)).not.toThrow();
    });

    expect(() => CandidateFitEnum.parse('maybe')).toThrow(ZodError);
    expect(() => CandidateFitEnum.parse('')).toThrow(ZodError);
  });

  /**
   * Test 12: Verify ScreeningStep schema validation
   */
  it('should validate individual screening steps correctly', () => {
    const validStep = {
      step_number: 1,
      evaluation_category: 'technical_skills',
      requirement_met: true,
      evidence: 'Candidate has demonstrated expertise in TypeScript and Python',
      gap_identified: null
    };

    expect(() => ScreeningStepSchema.parse(validStep)).not.toThrow();

    // Missing evidence (too short)
    expect(() => ScreeningStepSchema.parse({
      step_number: 1,
      evaluation_category: 'technical_skills',
      requirement_met: true,
      evidence: 'Short', // Less than 10 chars
      gap_identified: null
    })).toThrow(ZodError);

    // Invalid category
    expect(() => ScreeningStepSchema.parse({
      step_number: 1,
      evaluation_category: 'invalid_category',
      requirement_met: true,
      evidence: 'Valid evidence here',
      gap_identified: null
    })).toThrow(ZodError);
  });

  /**
   * Test 13: UpdateATSArgs schema validation
   */
  it('should validate UpdateATSArgs correctly', () => {
    const validArgs = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      status: 'screening_complete'
    };

    expect(() => UpdateATSArgsSchema.parse(validArgs)).not.toThrow();

    // Invalid status enum
    expect(() => UpdateATSArgsSchema.parse({
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      status: 'maybe_hired'
    })).toThrow(ZodError);

    // Empty candidate_id
    expect(() => UpdateATSArgsSchema.parse({
      candidate_id: '',
      job_id: 'JOB-001',
      status: 'screening_complete'
    })).toThrow(ZodError);
  });

  /**
   * Test 14: FlagForReviewArgs schema validation
   */
  it('should validate FlagForReviewArgs correctly', () => {
    const validArgs = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      flag_reason: 'career_changer',
      priority: 'medium',
      reviewer_notes: 'Candidate has transferable skills but needs assessment',
      suggested_questions: ['Ask about transition motivation']
    };

    expect(() => FlagForReviewArgsSchema.parse(validArgs)).not.toThrow();

    // Invalid flag_reason
    expect(() => FlagForReviewArgsSchema.parse({
      ...validArgs,
      flag_reason: 'invalid_reason'
    })).toThrow(ZodError);

    // Empty reviewer_notes
    expect(() => FlagForReviewArgsSchema.parse({
      ...validArgs,
      reviewer_notes: ''
    })).toThrow(ZodError);
  });

  /**
   * Test 15: ExtractedSkill schema validation
   */
  it('should validate ExtractedSkill correctly', () => {
    const validSkill = {
      skill_name: 'TypeScript',
      proficiency_level: 'expert',
      years_experience: 5,
      evidence_source: 'Used across all positions'
    };

    expect(() => ExtractedSkillSchema.parse(validSkill)).not.toThrow();

    // Invalid proficiency level
    expect(() => ExtractedSkillSchema.parse({
      ...validSkill,
      proficiency_level: 'super_expert'
    })).toThrow(ZodError);

    // Negative years
    expect(() => ExtractedSkillSchema.parse({
      ...validSkill,
      years_experience: -1
    })).toThrow(ZodError);
  });
});
