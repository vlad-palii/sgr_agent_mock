/**
 * LLMAgent.ts - LLM Service Simulation for Resume Screening
 *
 * This module demonstrates the complete flow of:
 * 1. Converting a Zod schema to JSON Schema for LLM consumption
 * 2. Simulating LLM API calls with structured output enforcement
 * 3. Validating and parsing LLM responses back to typed objects
 *
 * In production, this would integrate with OpenAI/Anthropic/Gemini SDKs
 * that support the `response_format: { type: "json_schema", ... }` parameter.
 *
 * Key Concept: Constrained Decoding
 * When strict=true is set, the LLM's token generation is constrained
 * at inference time to ONLY produce valid JSON matching the schema.
 * This is not post-hoc validation - it's guaranteed valid output.
 */

import { z, ZodError } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  ResumeScreeningSchema,
  ResumeScreening
} from './SGRSchema.js';
import { simulationConfig } from './config.js';
import { Resume, formatResumeAsText } from './examples/resumes.js';
import { JobDescription } from './examples/jobDescriptions.js';

/**
 * Converts a Zod schema to JSON Schema format
 *
 * This JSON Schema string is what gets sent to the LLM API.
 * Modern LLM providers accept this in their API request to enforce output structure.
 *
 * @param schema - Any Zod schema
 * @param name - Name for the schema (used in JSON Schema $ref)
 * @returns JSON Schema as a string (ready for API injection)
 */
export function zodToJsonSchemaString<T extends z.ZodType>(
  schema: T,
  name: string
): string {
  // Convert Zod schema to JSON Schema object
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    // Include descriptions from .describe() calls
    errorMessages: true
  });

  // Return as formatted JSON string for API consumption
  return JSON.stringify(jsonSchema, null, 2);
}


/**
 * LLMResponse - Simulated API response structure
 */
interface LLMResponse {
  success: boolean;
  rawContent: string;
  metadata: {
    model: string;
    tokensUsed: number;
  };
}

// Simulation state to toggle between success and failure scenarios
let simulationCallCount = 0;

// Store the candidate type for generating appropriate responses
type CandidateType = 'strong_match' | 'potential_fit' | 'not_qualified';
let currentCandidateType: CandidateType = 'strong_match';

/**
 * Set the candidate type for simulation
 * This affects what kind of response is generated
 */
export function setCandidateType(type: CandidateType): void {
  currentCandidateType = type;
}

/**
 * Generate a simulated resume screening result based on candidate type
 */
function generateScreeningResult(candidateId: string, jobId: string): ResumeScreening {
  switch (currentCandidateType) {
    case 'strong_match':
      return {
        candidate_id: candidateId,
        job_id: jobId,
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
            evidence: 'Total of 7 years professional experience, including 3 years as Senior Engineer with team leadership responsibilities. Exceeds the 5+ years requirement.'
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
            { skill_name: 'TypeScript', proficiency_level: 'expert', years_experience: 5, evidence_source: 'Used across all three positions' },
            { skill_name: 'Python', proficiency_level: 'advanced', years_experience: 7, evidence_source: 'Built data pipeline at StartupXYZ' },
            { skill_name: 'AWS', proficiency_level: 'advanced', years_experience: 4, evidence_source: 'AWS Solutions Architect certification' },
            { skill_name: 'Kubernetes', proficiency_level: 'advanced', years_experience: 3, evidence_source: 'CKA certified' }
          ],
          soft_skills: ['Leadership', 'Mentorship', 'Technical Communication'],
          certifications: ['AWS Solutions Architect Professional', 'CKA'],
          required_skills_matched: ['TypeScript', 'Python', 'AWS', 'Distributed Systems', 'Cloud Platforms'],
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
              key_achievements: ['Led microservices migration', 'Mentored 3 engineers'],
              skills_demonstrated: ['TypeScript', 'Kubernetes', 'Leadership']
            }
          ]
        },
        education_analysis: {
          highest_degree: 'bachelor',
          education_history: [
            { institution: 'UC Berkeley', degree: 'B.S. Computer Science', field_of_study: 'Computer Science', graduation_year: 2016, relevance: 'highly_relevant' }
          ],
          meets_education_requirement: true
        },
        fit_score: 92,
        strengths: [
          'Exceeds experience requirement with 7 years in relevant roles',
          'Has all required technical skills plus preferred Kubernetes experience',
          'Proven leadership and mentorship track record'
        ],
        concerns: [],
        recommended_action: 'advance_to_interview',
        interview_focus_areas: ['Architecture decisions', 'Team leadership style', 'Career goals']
      };

    case 'potential_fit':
      return {
        candidate_id: candidateId,
        job_id: jobId,
        overall_fit: 'potential_fit',
        screening_steps: [
          {
            step_number: 1,
            evaluation_category: 'technical_skills',
            requirement_met: false,
            evidence: 'Candidate has Python and JavaScript/TypeScript skills from bootcamp and data analyst role. Built full-stack projects but lacks production experience.',
            gap_identified: 'No production experience with distributed systems or cloud platforms'
          },
          {
            step_number: 2,
            evaluation_category: 'experience_level',
            requirement_met: false,
            evidence: 'Total 4 years professional experience, but only in data analyst roles. Software development experience limited to bootcamp projects.',
            gap_identified: 'Does not meet 5+ years software development requirement'
          },
          {
            step_number: 3,
            evaluation_category: 'education',
            requirement_met: false,
            evidence: 'B.A. Economics plus bootcamp certificate. No formal CS education.',
            gap_identified: 'Does not have CS degree, though bootcamp provides relevant training'
          }
        ],
        skills_analysis: {
          technical_skills: [
            { skill_name: 'Python', proficiency_level: 'intermediate', years_experience: 2, evidence_source: 'Automation scripts at Analytics Co.' },
            { skill_name: 'JavaScript', proficiency_level: 'intermediate', years_experience: 1, evidence_source: 'Bootcamp projects' },
            { skill_name: 'React', proficiency_level: 'beginner', years_experience: 1, evidence_source: 'E-commerce portfolio project' },
            { skill_name: 'SQL', proficiency_level: 'advanced', years_experience: 4, evidence_source: 'Daily use as data analyst' }
          ],
          soft_skills: ['Analytical Thinking', 'Problem Solving', 'Cross-team Collaboration'],
          certifications: [],
          required_skills_matched: ['Python', 'TypeScript/JavaScript'],
          missing_required_skills: ['Cloud Platforms', 'Distributed Systems']
        },
        experience_analysis: {
          total_years: 4,
          relevant_years: 1,
          experience_level: 'entry',
          career_progression: 'mixed',
          work_history: [
            {
              company: 'Analytics Co.',
              role: 'Senior Data Analyst',
              duration_months: 42,
              relevance: 'somewhat_relevant',
              key_achievements: ['Built Python automation', 'Created SQL dashboards'],
              skills_demonstrated: ['Python', 'SQL', 'Data Analysis']
            }
          ]
        },
        education_analysis: {
          highest_degree: 'bachelor',
          education_history: [
            { institution: 'State University', degree: 'B.A. Economics', field_of_study: 'Economics', graduation_year: 2018, relevance: 'not_relevant' },
            { institution: 'CodeCamp Bootcamp', degree: 'Certificate', field_of_study: 'Full Stack Development', graduation_year: 2023, relevance: 'highly_relevant' }
          ],
          meets_education_requirement: false
        },
        fit_score: 45,
        strengths: [
          'Strong analytical background from data analyst experience',
          'Self-motivated learner who completed bootcamp while working',
          'Has working knowledge of core technologies'
        ],
        concerns: [
          'Lacks production software engineering experience',
          'No cloud or distributed systems experience',
          'May need significant ramp-up time'
        ],
        recommended_action: 'phone_screen_first',
        interview_focus_areas: ['Transferable skills', 'Learning velocity', 'Technical project deep-dive']
      };

    case 'not_qualified':
    default:
      return {
        candidate_id: candidateId,
        job_id: jobId,
        overall_fit: 'not_qualified',
        screening_steps: [
          {
            step_number: 1,
            evaluation_category: 'technical_skills',
            requirement_met: false,
            evidence: 'Candidate lists only HTML, CSS, and basic JavaScript. No experience with required technologies (TypeScript, Python, cloud platforms).',
            gap_identified: 'Missing all required technical skills for senior role'
          },
          {
            step_number: 2,
            evaluation_category: 'experience_level',
            requirement_met: false,
            evidence: 'Only 9 months of student worker experience in IT help desk. No professional software development experience.',
            gap_identified: 'Requires 5+ years experience, candidate has less than 1 year in non-engineering role'
          },
          {
            step_number: 3,
            evaluation_category: 'education',
            requirement_met: false,
            evidence: 'A.S. General Studies from Community College. No CS education or relevant technical certifications.',
            gap_identified: 'Does not meet education requirement'
          }
        ],
        skills_analysis: {
          technical_skills: [
            { skill_name: 'HTML', proficiency_level: 'beginner', evidence_source: 'Personal portfolio' },
            { skill_name: 'CSS', proficiency_level: 'beginner', evidence_source: 'Personal portfolio' },
            { skill_name: 'JavaScript', proficiency_level: 'beginner', evidence_source: 'Listed as "basic"' }
          ],
          soft_skills: ['Customer Service', 'Communication'],
          certifications: [],
          required_skills_matched: [],
          missing_required_skills: ['TypeScript', 'Python', 'Cloud Platforms', 'Distributed Systems']
        },
        experience_analysis: {
          total_years: 0.75,
          relevant_years: 0,
          experience_level: 'entry',
          career_progression: 'early_career',
          work_history: [
            {
              company: 'Campus IT Help Desk',
              role: 'Student Worker',
              duration_months: 9,
              relevance: 'not_relevant',
              key_achievements: ['Technical support', 'Documentation'],
              skills_demonstrated: ['Customer Service', 'Troubleshooting']
            }
          ]
        },
        education_analysis: {
          highest_degree: 'associate',
          education_history: [
            { institution: 'Community College', degree: 'A.S. General Studies', field_of_study: 'General Studies', graduation_year: 2023, relevance: 'not_relevant' }
          ],
          meets_education_requirement: false
        },
        fit_score: 15,
        strengths: [
          'Shows enthusiasm and eagerness to learn'
        ],
        concerns: [
          'No professional software development experience',
          'Missing all required technical skills',
          'Education does not meet requirements',
          'This is a senior role requiring 5+ years experience'
        ],
        recommended_action: 'reject',
        interview_focus_areas: []
      };
  }
}

/**
 * simulateLLMCall - Mock LLM API call
 *
 * This function simulates the behavior of an LLM API with Structured Outputs.
 * It can return valid or malformed responses for testing.
 *
 * In production, this would be replaced with actual SDK calls:
 * ```typescript
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4o",
 *   messages: [{ role: "user", content: prompt }],
 *   response_format: {
 *     type: "json_schema",
 *     json_schema: { name: "resume_screening", schema: jsonSchema, strict: true }
 *   }
 * });
 * ```
 */
export function simulateLLMCall(
  schema: string,
  prompt: string,
  candidateId: string,
  jobId: string,
  forceFailure: boolean = false
): LLMResponse {
  simulationCallCount++;

  console.log('[LLM Simulation] Request received');
  console.log(`[LLM Simulation] Prompt length: ${prompt.length} chars`);
  console.log(`[LLM Simulation] Schema provided: ${schema.length} chars`);
  console.log(`[LLM Simulation] Candidate type: ${currentCandidateType}`);

  if (forceFailure) {
    console.log('[LLM Simulation] Returning MALFORMED response (for testing)');

    // Return malformed data - missing required fields, wrong types
    const malformedResponse = {
      candidate_id: candidateId,
      job_id: jobId,
      overall_fit: 'maybe_qualified', // Invalid enum value
      screening_steps: [
        {
          step_number: 'one', // Wrong type: string instead of number
          evaluation_category: 'skills', // Invalid category
          requirement_met: 'yes', // Wrong type
          evidence: 'Short' // Too short
        }
      ],
      fit_score: 150, // Out of range (max is 100)
      // Missing many required fields
    };

    return {
      success: true, // API call "succeeded" but data is malformed
      rawContent: JSON.stringify(malformedResponse),
      metadata: {
        model: simulationConfig.modelVersion,
        tokensUsed: simulationConfig.tokenCounts.failure
      }
    };
  }

  console.log('[LLM Simulation] Returning VALID response');

  // Generate appropriate response based on candidate type
  const validResponse = generateScreeningResult(candidateId, jobId);

  return {
    success: true,
    rawContent: JSON.stringify(validResponse),
    metadata: {
      model: simulationConfig.modelVersion,
      tokensUsed: simulationConfig.tokenCounts.success
    }
  };
}

/**
 * Reset the simulation call counter
 * Useful for testing to ensure predictable behavior
 */
export function resetSimulationState(): void {
  simulationCallCount = 0;
  currentCandidateType = 'strong_match';
}

/**
 * LLMAgentResult - Result of the agent processing
 */
export interface LLMAgentResult {
  success: boolean;
  data?: ResumeScreening;
  error?: {
    type: 'parse_error' | 'validation_error';
    message: string;
    details?: z.ZodIssue[];
  };
  rawResponse: string;
}

/**
 * runResumeScreening - Main agent function
 *
 * This is the primary interface for running a resume screening.
 * It demonstrates the full Structured Outputs workflow:
 *
 * 1. Generate JSON Schema from Zod definition
 * 2. Call LLM with schema constraint
 * 3. Parse and validate response
 * 4. Return typed result or detailed error
 *
 * @param resume - Candidate resume to analyze
 * @param job - Job description to match against
 * @param forceFailure - For testing: force malformed response
 * @returns Validated ResumeScreening or error details
 */
export async function runResumeScreening(
  resume: Resume,
  job: JobDescription,
  forceFailure: boolean = false
): Promise<LLMAgentResult> {
  // Step 1: Convert Zod schema to JSON Schema string
  // This is what gets sent to the LLM API for Constrained Decoding
  const jsonSchemaString = zodToJsonSchemaString(
    ResumeScreeningSchema,
    'ResumeScreening'
  );

  console.log('\n=== JSON Schema Generated for LLM ===');
  console.log(jsonSchemaString.substring(0, 500) + '...\n[truncated]');
  console.log('=====================================\n');

  // Step 2: Format resume and job for the prompt
  const resumeText = formatResumeAsText(resume);
  const jobRequirements = [
    'Required:',
    ...job.requirements.required.map(r => `  - ${r}`),
    'Preferred:',
    ...job.requirements.preferred.map(r => `  - ${r}`)
  ].join('\n');

  // Step 3: Construct prompt with SGR instructions
  const prompt = `
You are an expert HR recruiter screening resumes. Analyze the following resume
against the job requirements and provide a structured screening assessment.

IMPORTANT: Your response MUST follow the Schema-Guided Reasoning process:
1. Evaluate technical skills against requirements
2. Assess experience level and relevance
3. Review education background
4. Provide an overall fit assessment with evidence
5. Recommend a specific next action

## Job: ${job.title}
${job.description}

## Requirements:
${jobRequirements}

## Resume:
${resumeText}

---
Provide your screening analysis as a JSON object matching the required schema.
`;

  // Step 4: Call simulated LLM with schema enforcement
  const llmResponse = simulateLLMCall(
    jsonSchemaString,
    prompt,
    resume.candidateId,
    job.jobId,
    forceFailure
  );

  if (!llmResponse.success) {
    return {
      success: false,
      error: {
        type: 'parse_error',
        message: 'LLM API call failed'
      },
      rawResponse: llmResponse.rawContent
    };
  }

  // Step 5: Parse JSON from raw response
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(llmResponse.rawContent);
  } catch (e) {
    return {
      success: false,
      error: {
        type: 'parse_error',
        message: `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
      },
      rawResponse: llmResponse.rawContent
    };
  }

  // Step 6: Validate against Zod schema
  // This is the critical validation step that catches any schema violations
  // With true Constrained Decoding (strict=true), this should never fail
  try {
    const validatedData = ResumeScreeningSchema.parse(parsedJson);

    console.log('[Validation] SUCCESS - Data matches ResumeScreeningSchema');

    return {
      success: true,
      data: validatedData,
      rawResponse: llmResponse.rawContent
    };
  } catch (e) {
    if (e instanceof ZodError) {
      console.log('[Validation] FAILED - Schema violations detected');
      console.log('[Validation] Issues:', JSON.stringify(e.issues, null, 2));

      return {
        success: false,
        error: {
          type: 'validation_error',
          message: e.message,
          details: e.issues
        },
        rawResponse: llmResponse.rawContent
      };
    }

    // Re-throw unexpected errors
    throw e;
  }
}

/**
 * Demonstration of schema generation
 * Shows the JSON Schema that would be sent to an LLM API
 */
export function demonstrateSchemaGeneration(): void {
  console.log('\n=== Schema-Guided Reasoning: Schema Generation Demo ===\n');

  const jsonSchema = zodToJsonSchemaString(
    ResumeScreeningSchema,
    'ResumeScreening'
  );

  console.log('The following JSON Schema is generated from the Zod definition:');
  console.log('This schema would be sent to the LLM API with strict=true\n');
  console.log(jsonSchema);

  console.log('\n=== How This Enables SGR ===');
  console.log('1. The schema REQUIRES screening_steps array (min 3 items)');
  console.log('2. Each step MUST evaluate a specific category with evidence');
  console.log('3. This forces the LLM to systematically review the resume');
  console.log('4. The overall_fit enum prevents vague assessments');
  console.log('5. The fit_score constraint (0-100) ensures quantifiable output');
  console.log('6. recommended_action enum enforces clear next steps');
  console.log('============================================\n');
}
