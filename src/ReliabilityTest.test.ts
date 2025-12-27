/**
 * Schema Validation Tests
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

describe('ResumeScreeningSchema', () => {
  it('should accept valid data', () => {
    const validData: ResumeScreening = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has all required skills including TypeScript', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: '7 years of relevant experience', gap_identified: null },
        { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'BS Computer Science', gap_identified: null }
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
  });

  it('should reject invalid enum', () => {
    const invalid = { overall_fit: 'maybe_qualified' };
    expect(() => CandidateFitEnum.parse(invalid.overall_fit)).toThrow(ZodError);
  });

  it('should reject out-of-range fit score', () => {
    expect(() => ResumeScreeningSchema.parse({ fit_score: 150 })).toThrow(ZodError);
  });

  it('should require minimum 3 screening steps', () => {
    const twoSteps = {
      candidate_id: 'CAND-001',
      job_id: 'JOB-001',
      overall_fit: 'strong_match',
      screening_steps: [
        { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has skills', gap_identified: null },
        { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: 'Has exp', gap_identified: null }
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

    expect(() => ResumeScreeningSchema.parse(twoSteps)).toThrow(ZodError);
  });
});

describe('ScreeningStepSchema', () => {
  it('should validate valid step', () => {
    const valid = {
      step_number: 1,
      evaluation_category: 'technical_skills',
      requirement_met: true,
      evidence: 'Has demonstrated expertise in TypeScript',
      gap_identified: null
    };
    expect(() => ScreeningStepSchema.parse(valid)).not.toThrow();
  });

  it('should reject short evidence', () => {
    const invalid = {
      step_number: 1,
      evaluation_category: 'technical_skills',
      requirement_met: true,
      evidence: 'Short',
      gap_identified: null
    };
    expect(() => ScreeningStepSchema.parse(invalid)).toThrow(ZodError);
  });
});

describe('ExtractedSkillSchema', () => {
  it('should validate valid skill', () => {
    const valid = {
      skill_name: 'TypeScript',
      proficiency_level: 'expert',
      years_experience: 5,
      evidence_source: 'Work history'
    };
    expect(() => ExtractedSkillSchema.parse(valid)).not.toThrow();
  });

  it('should reject invalid proficiency', () => {
    const invalid = {
      skill_name: 'TypeScript',
      proficiency_level: 'super_expert',
      years_experience: 5,
      evidence_source: 'Work history'
    };
    expect(() => ExtractedSkillSchema.parse(invalid)).toThrow(ZodError);
  });
});
