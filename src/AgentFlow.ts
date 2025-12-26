/**
 * AgentFlow.ts - Function Calling & Agent Workflow for Resume Screening
 *
 * This module demonstrates how Structured Outputs enables reliable
 * Function Calling (Tool Use) in LLM applications.
 *
 * Key Concepts:
 * 1. Tool Schema Definition - Zod schemas define function arguments
 * 2. Argument Validation - LLM-generated arguments are validated
 * 3. Safe Execution - Only valid arguments trigger function execution
 *
 * Why This Matters:
 * Traditional LLM function calling can produce malformed arguments.
 * With Structured Outputs (strict=true), the LLM is constrained to
 * produce ONLY valid function arguments, making tool use reliable.
 */

import { z, ZodError } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ResumeScreening } from './SGRSchema.js';
import { enums } from './config.js';

// ============================================================
// TOOL SCHEMAS - Define the contract for function arguments
// ============================================================

/**
 * UpdateATSArgs - Schema for Applicant Tracking System updates
 *
 * This schema defines what arguments the updateATS tool accepts.
 * When sent to an LLM with function calling enabled, the model's
 * output will be constrained to match this schema exactly.
 */
export const UpdateATSArgsSchema = z.object({
  candidate_id: z.string()
    .min(1)
    .describe('Candidate identifier in the ATS'),

  job_id: z.string()
    .min(1)
    .describe('Job posting identifier'),

  status: z.enum(enums.candidateStatuses)
    .describe('New status in the hiring pipeline'),

  fit_score: z.number()
    .min(0)
    .max(100)
    .optional()
    .describe('Candidate fit score from screening'),

  screening_notes: z.string()
    .optional()
    .describe('Notes from the screening process'),

  tags: z.array(z.string())
    .optional()
    .describe('Tags to add to candidate profile')
});

export type UpdateATSArgs = z.infer<typeof UpdateATSArgsSchema>;

/**
 * SendCandidateEmailArgs - Schema for sending emails to candidates
 */
export const SendCandidateEmailArgsSchema = z.object({
  recipient_email: z.string()
    .email()
    .describe('Candidate email address'),

  email_type: z.enum(enums.emailTypes)
    .describe('Type of email template to use'),

  candidate_name: z.string()
    .min(1)
    .describe('Candidate name for personalization'),

  job_title: z.string()
    .min(1)
    .describe('Job title they applied for'),

  custom_message: z.string()
    .optional()
    .describe('Optional personalized message to include'),

  scheduled_time: z.string()
    .optional()
    .describe('For interview invites, the proposed time (ISO 8601)')
});

export type SendCandidateEmailArgs = z.infer<typeof SendCandidateEmailArgsSchema>;

/**
 * ScheduleInterviewArgs - Schema for scheduling interviews
 */
export const ScheduleInterviewArgsSchema = z.object({
  candidate_id: z.string()
    .min(1)
    .describe('Candidate identifier'),

  job_id: z.string()
    .min(1)
    .describe('Job posting identifier'),

  interview_type: z.enum(enums.interviewTypes)
    .describe('Type of interview to schedule'),

  interviewer_ids: z.array(z.string().min(1))
    .min(1)
    .describe('IDs of interviewers to include'),

  proposed_times: z.array(z.string())
    .min(1)
    .describe('Proposed time slots (ISO 8601 format)'),

  duration_minutes: z.number()
    .int()
    .min(15)
    .max(480)
    .describe('Interview duration in minutes'),

  focus_areas: z.array(z.string())
    .describe('Suggested focus areas based on screening')
});

export type ScheduleInterviewArgs = z.infer<typeof ScheduleInterviewArgsSchema>;

/**
 * FlagForReviewArgs - Schema for flagging candidates for human review
 */
export const FlagForReviewArgsSchema = z.object({
  candidate_id: z.string()
    .min(1)
    .describe('Candidate identifier'),

  job_id: z.string()
    .min(1)
    .describe('Job posting identifier'),

  flag_reason: z.enum(enums.flagReasons)
    .describe('Reason for flagging'),

  priority: z.enum(enums.priorityLevels)
    .describe('Priority level for review'),

  reviewer_notes: z.string()
    .min(1)
    .describe('Detailed notes for the human reviewer'),

  suggested_questions: z.array(z.string())
    .describe('Questions the reviewer should consider')
});

export type FlagForReviewArgs = z.infer<typeof FlagForReviewArgsSchema>;

// ============================================================
// TOOL IMPLEMENTATIONS - Actual functions the agent can call
// ============================================================

/**
 * updateATS - Update candidate status in the Applicant Tracking System
 */
export function updateATS(args: UpdateATSArgs): boolean {
  console.log('\n[Tool: updateATS] Updating candidate in ATS:');
  console.log(`  Candidate: ${args.candidate_id}`);
  console.log(`  Job: ${args.job_id}`);
  console.log(`  New Status: ${args.status}`);

  if (args.fit_score !== undefined) {
    console.log(`  Fit Score: ${args.fit_score}/100`);
  }
  if (args.screening_notes) {
    console.log(`  Notes: ${args.screening_notes.substring(0, 50)}...`);
  }
  if (args.tags && args.tags.length > 0) {
    console.log(`  Tags: ${args.tags.join(', ')}`);
  }

  console.log('[Tool: updateATS] ATS updated successfully');
  return true;
}

/**
 * sendCandidateEmail - Send templated email to candidate
 */
export function sendCandidateEmail(args: SendCandidateEmailArgs): boolean {
  console.log('\n[Tool: sendCandidateEmail] Sending email:');
  console.log(`  To: ${args.recipient_email}`);
  console.log(`  Type: ${args.email_type}`);
  console.log(`  Candidate: ${args.candidate_name}`);
  console.log(`  Job: ${args.job_title}`);

  if (args.scheduled_time) {
    console.log(`  Scheduled Time: ${args.scheduled_time}`);
  }
  if (args.custom_message) {
    console.log(`  Custom Message: ${args.custom_message.substring(0, 50)}...`);
  }

  console.log('[Tool: sendCandidateEmail] Email sent successfully');
  return true;
}

/**
 * scheduleInterview - Schedule an interview with the candidate
 */
export function scheduleInterview(args: ScheduleInterviewArgs): boolean {
  console.log('\n[Tool: scheduleInterview] Scheduling interview:');
  console.log(`  Candidate: ${args.candidate_id}`);
  console.log(`  Job: ${args.job_id}`);
  console.log(`  Type: ${args.interview_type}`);
  console.log(`  Duration: ${args.duration_minutes} minutes`);
  console.log(`  Interviewers: ${args.interviewer_ids.join(', ')}`);
  console.log(`  Proposed Times: ${args.proposed_times.length} options`);

  if (args.focus_areas.length > 0) {
    console.log(`  Focus Areas: ${args.focus_areas.join(', ')}`);
  }

  console.log('[Tool: scheduleInterview] Interview scheduled successfully');
  return true;
}

/**
 * flagForReview - Flag candidate for human recruiter review
 */
export function flagForReview(args: FlagForReviewArgs): boolean {
  console.log('\n[Tool: flagForReview] Flagging for human review:');
  console.log(`  Candidate: ${args.candidate_id}`);
  console.log(`  Job: ${args.job_id}`);
  console.log(`  Reason: ${args.flag_reason}`);
  console.log(`  Priority: ${args.priority}`);
  console.log(`  Notes: ${args.reviewer_notes.substring(0, 50)}...`);

  if (args.suggested_questions.length > 0) {
    console.log(`  Suggested Questions: ${args.suggested_questions.length}`);
  }

  console.log('[Tool: flagForReview] Candidate flagged successfully');
  return true;
}

// ============================================================
// TOOL REGISTRY - Maps tool names to schemas and implementations
// ============================================================

/**
 * ToolDefinition - Structure for registering tools
 */
interface ToolDefinition<T extends z.ZodType> {
  name: string;
  description: string;
  schema: T;
  execute: (args: z.infer<T>) => boolean;
}

/**
 * Tool registry containing all available tools
 *
 * This registry would be sent to the LLM as available functions.
 * The schemas are converted to JSON Schema for the API request.
 */
export const toolRegistry = {
  updateATS: {
    name: 'updateATS',
    description: 'Update candidate status and information in the Applicant Tracking System',
    schema: UpdateATSArgsSchema,
    execute: updateATS
  } as ToolDefinition<typeof UpdateATSArgsSchema>,

  sendCandidateEmail: {
    name: 'sendCandidateEmail',
    description: 'Send a templated email to the candidate (application received, interview invite, rejection, etc.)',
    schema: SendCandidateEmailArgsSchema,
    execute: sendCandidateEmail
  } as ToolDefinition<typeof SendCandidateEmailArgsSchema>,

  scheduleInterview: {
    name: 'scheduleInterview',
    description: 'Schedule an interview with the candidate and assigned interviewers',
    schema: ScheduleInterviewArgsSchema,
    execute: scheduleInterview
  } as ToolDefinition<typeof ScheduleInterviewArgsSchema>,

  flagForReview: {
    name: 'flagForReview',
    description: 'Flag a candidate for human recruiter review (for edge cases, career changers, etc.)',
    schema: FlagForReviewArgsSchema,
    execute: flagForReview
  } as ToolDefinition<typeof FlagForReviewArgsSchema>
};

// ============================================================
// SIMULATED LLM FUNCTION CALL - What the model outputs
// ============================================================

/**
 * SimulatedFunctionCall - Represents LLM's decision to call a function
 */
interface SimulatedFunctionCall {
  function_name: string;
  arguments: unknown;
}

/**
 * Simulates the LLM generating a function call based on screening result
 */
function simulateLLMFunctionCall(
  screening: ResumeScreening,
  shouldFail: boolean = false
): SimulatedFunctionCall {
  if (shouldFail) {
    // Return invalid arguments to test validation
    return {
      function_name: 'updateATS',
      arguments: {
        candidate_id: '', // Empty string fails min(1)
        job_id: screening.job_id,
        status: 'maybe_hired', // Not in enum
        fit_score: 150 // Out of range
      }
    };
  }

  // Determine the appropriate action based on screening result
  if (screening.recommended_action === 'advance_to_interview') {
    // Strong candidate - update ATS and schedule interview
    return {
      function_name: 'updateATS',
      arguments: {
        candidate_id: screening.candidate_id,
        job_id: screening.job_id,
        status: 'screening_complete',
        fit_score: screening.fit_score,
        screening_notes: `${screening.overall_fit}: ${screening.strengths.join('; ')}`,
        tags: ['strong_candidate', 'advance_to_interview']
      }
    };
  } else if (screening.recommended_action === 'phone_screen_first') {
    // Potential fit - flag for review with phone screen suggestion
    return {
      function_name: 'flagForReview',
      arguments: {
        candidate_id: screening.candidate_id,
        job_id: screening.job_id,
        flag_reason: 'career_changer',
        priority: 'medium',
        reviewer_notes: `Potential fit with concerns: ${screening.concerns.join('; ')}. Recommend phone screen to assess.`,
        suggested_questions: screening.interview_focus_areas
      }
    };
  } else {
    // Not qualified - update ATS with rejection status
    return {
      function_name: 'updateATS',
      arguments: {
        candidate_id: screening.candidate_id,
        job_id: screening.job_id,
        status: 'rejected',
        fit_score: screening.fit_score,
        screening_notes: `Not qualified: ${screening.concerns.join('; ')}`,
        tags: ['auto_rejected', 'does_not_meet_requirements']
      }
    };
  }
}

// ============================================================
// AGENT FLOW ORCHESTRATION
// ============================================================

/**
 * AgentFlowResult - Result of the agent workflow
 */
interface AgentFlowResult {
  success: boolean;
  functionCalled?: string;
  error?: {
    type: 'validation_error' | 'execution_error' | 'unknown_function';
    message: string;
    details?: z.ZodIssue[];
  };
}

/**
 * executeAgentFlow - Main agent orchestration function
 *
 * This demonstrates the complete flow of an LLM agent using function calling:
 *
 * 1. Receive a ResumeScreening result
 * 2. LLM decides to call a function (simulated)
 * 3. Validate the function arguments against Zod schema
 * 4. Execute the function with validated arguments
 * 5. Return the result
 */
export async function executeAgentFlow(
  screening: ResumeScreening,
  forceInvalidCall: boolean = false
): Promise<AgentFlowResult> {
  console.log('\n=== Agent Flow: Function Calling Demo ===');
  console.log(`Processing screening for candidate: ${screening.candidate_id}`);
  console.log(`Recommended action: ${screening.recommended_action}`);

  // Step 1: LLM generates a function call decision
  const functionCall = simulateLLMFunctionCall(screening, forceInvalidCall);
  console.log(`\nLLM decided to call: ${functionCall.function_name}`);
  console.log('Raw arguments:', JSON.stringify(functionCall.arguments, null, 2));

  // Step 2: Look up the function in the registry
  const tool = toolRegistry[functionCall.function_name as keyof typeof toolRegistry];

  if (!tool) {
    return {
      success: false,
      error: {
        type: 'unknown_function',
        message: `Unknown function: ${functionCall.function_name}`
      }
    };
  }

  // Step 3: Validate arguments against the tool's Zod schema
  console.log('\nValidating arguments against schema...');

  try {
    const validatedArgs = tool.schema.parse(functionCall.arguments);
    console.log('Validation successful!');

    // Step 4: Execute the function with validated arguments
    // Use type assertion since we've validated the args match the schema
    const success = (tool.execute as (args: unknown) => boolean)(validatedArgs);

    return {
      success,
      functionCalled: functionCall.function_name
    };
  } catch (e) {
    if (e instanceof ZodError) {
      console.log('Validation FAILED:');
      console.log(JSON.stringify(e.issues, null, 2));

      return {
        success: false,
        error: {
          type: 'validation_error',
          message: e.message,
          details: e.issues
        }
      };
    }

    return {
      success: false,
      error: {
        type: 'execution_error',
        message: e instanceof Error ? e.message : 'Unknown error'
      }
    };
  }
}

/**
 * Generate tool definitions for LLM API
 *
 * This function converts our Zod-based tool registry into the format
 * expected by LLM APIs (e.g., OpenAI's function calling format).
 */
export function generateToolDefinitionsForLLM(): object[] {
  return Object.values(toolRegistry).map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: zodToJsonSchema(tool.schema),
      // strict: true would be set here in production
    }
  }));
}

/**
 * Demonstration of the agent flow
 */
export async function demonstrateAgentFlow(): Promise<void> {
  console.log('\n========================================');
  console.log('AGENT FLOW DEMONSTRATION');
  console.log('========================================\n');

  // Show tool definitions
  console.log('Available tools for the LLM:');
  const tools = generateToolDefinitionsForLLM();
  console.log(`${tools.length} tools registered: ${tools.map(t => (t as { function: { name: string } }).function.name).join(', ')}`);

  // Create sample screening results for different scenarios
  const strongMatchScreening: ResumeScreening = {
    candidate_id: 'CAND-001',
    job_id: 'JOB-2024-001',
    overall_fit: 'strong_match',
    screening_steps: [
      { step_number: 1, evaluation_category: 'technical_skills', requirement_met: true, evidence: 'Has all required skills' },
      { step_number: 2, evaluation_category: 'experience_level', requirement_met: true, evidence: '7 years experience' },
      { step_number: 3, evaluation_category: 'education', requirement_met: true, evidence: 'CS degree from top university' }
    ],
    skills_analysis: {
      technical_skills: [{ skill_name: 'TypeScript', proficiency_level: 'expert', evidence_source: 'Resume' }],
      soft_skills: ['Leadership'],
      certifications: ['AWS'],
      required_skills_matched: ['TypeScript', 'Python'],
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
    fit_score: 92,
    strengths: ['Exceeds experience requirements', 'Has all required skills'],
    concerns: [],
    recommended_action: 'advance_to_interview',
    interview_focus_areas: ['Architecture decisions', 'Leadership style']
  };

  // Execute with valid arguments (strong match)
  console.log('\n--- Test 1: Strong Match Candidate (Valid Call) ---');
  const result1 = await executeAgentFlow(strongMatchScreening, false);
  console.log('Result:', result1.success ? 'SUCCESS' : 'FAILED');

  // Execute with invalid arguments (to show validation)
  console.log('\n--- Test 2: Invalid Function Call (Validation Test) ---');
  const result2 = await executeAgentFlow(strongMatchScreening, true);
  console.log('Result:', result2.success ? 'SUCCESS' : 'FAILED (expected)');
  if (result2.error) {
    console.log('Error type:', result2.error.type);
  }

  console.log('\n========================================');
  console.log('DEMONSTRATION COMPLETE');
  console.log('========================================\n');
}
