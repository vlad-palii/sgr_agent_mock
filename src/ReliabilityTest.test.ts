/**
 * ReliabilityTest.test.ts - Schema Validation Tests for Resume Screening
 *
 * These tests validate the Zod schemas used for structured LLM output.
 * They run without requiring an API key or real LLM calls.
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  ResumeScreeningSchema,
  ResumeScreening,
  ScreeningStepSchema,
  CandidateFitEnum,
  ExtractedSkillSchema
} from './SGRSchema.js';
import {
  executeAgentFlow,
  UpdateATSArgsSchema,
  FlagForReviewArgsSchema
} from './AgentFlow.js';

// ============================================================
// SCHEMA VALIDATION TESTS
// ============================================================

describe('ResumeScreeningSchema Validation', () => {
  /**
   * Test: Valid data passes validation
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
   * Test: Invalid enum value throws ZodError
   */
  it('should reject invalid overall_fit enum value', () => {
    const invalidData = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'maybe_qualified', // Invalid enum value
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience', gap_identified: null },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'Has degree', gap_identified: null }
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
   * Test: Out-of-range fit score is rejected
   */
  it('should reject fit score outside valid range (0-100)', () => {
    const invalidData = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience', gap_identified: null },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'Has degree', gap_identified: null }
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
   * Test: Minimum screening steps enforcement
   */
  it('should require minimum 3 screening steps for SGR compliance', () => {
    const insufficientSteps = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has experience', gap_identified: null }
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
   * Test: Missing required field detection
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
// AGENT FLOW TESTS - Function Calling Validation
// ============================================================

describe('AgentFlow Function Calling Validation', () => {
  const validScreening: ResumeScreening = {
    candidate_id: 'CAND-001',
    job_id: 'JOB-001',
    overall_fit: 'strong_match',
    screening_steps: [
      { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has all required skills', gap_identified: null },
      { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: '7 years experience', gap_identified: null },
      { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'CS degree', gap_identified: null }
    ],
    skills_analysis: {
      technical_skills: [{ skill_name: 'TypeScript', proficiency_level: 'expert', years_experience: 5, evidence_source: 'Resume' }],
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
   * Test: Valid function call execution
   */
  it('should execute function with valid arguments', async () => {
    const result = await executeAgentFlow(validScreening, false);

    expect(result.success).toBe(true);
    expect(result.functionCalled).toBe('updateATS');
  });

  /**
   * Test: Invalid function arguments are caught
   */
  it('should catch validation errors for invalid function arguments', async () => {
    const result = await executeAgentFlow(validScreening, true);

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('validation_error');
    expect(result.error?.details).toBeDefined();
  });
});

// ============================================================
// SCHEMA UTILITY TESTS
// ============================================================

describe('Schema Utility Functions', () => {
  /**
   * Test: Verify CandidateFit enum values
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
   * Test: Verify ScreeningStep schema validation
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
   * Test: UpdateATSArgs schema validation
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
   * Test: FlagForReviewArgs schema validation
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
   * Test: ExtractedSkill schema validation
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
