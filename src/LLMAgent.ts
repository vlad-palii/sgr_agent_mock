/**
 * LLMAgent.ts - LLM Service for Resume Screening
 *
 * This module demonstrates the complete flow of:
 * 1. Converting a Zod schema to JSON Schema for LLM consumption
 * 2. Calling OpenAI API with structured output enforcement
 * 3. Validating and parsing LLM responses back to typed objects
 *
 * Key Concept: Constrained Decoding
 * When strict=true is set, the LLM's token generation is constrained
 * at inference time to ONLY produce valid JSON matching the schema.
 * This is not post-hoc validation - it's guaranteed valid output.
 */

import { z, ZodError } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import OpenAI from 'openai';
import {
  ResumeScreeningSchema,
  ResumeScreening
} from './SGRSchema.js';
import { openaiConfig, modelConfig } from './config.js';
import { Resume, formatResumeAsText } from './examples/resumes.js';
import { JobDescription } from './examples/jobDescriptions.js';

// ============================================================================
// OpenAI Client Setup
// ============================================================================

let openaiClient: OpenAI | null = null;

/**
 * Get or create the OpenAI client
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!openaiConfig.apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is not set. ' +
        'Set it with: export OPENAI_API_KEY=your-api-key'
      );
    }
    openaiClient = new OpenAI({
      apiKey: openaiConfig.apiKey,
      baseURL: openaiConfig.baseURL
    });
  }
  return openaiClient;
}

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
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    errorMessages: true
  });
  return JSON.stringify(jsonSchema, null, 2);
}

/**
 * LLMAgentResult - Result of the agent processing
 */
export interface LLMAgentResult {
  success: boolean;
  data?: ResumeScreening;
  error?: {
    type: 'api_error' | 'parse_error' | 'validation_error';
    message: string;
    details?: z.ZodIssue[];
  };
  metadata?: {
    model: string;
    tokensUsed: number;
  };
  rawResponse?: string;
}

/**
 * runResumeScreening - Main agent function
 *
 * This is the primary interface for running a resume screening.
 * It demonstrates the full Structured Outputs workflow:
 *
 * 1. Generate JSON Schema from Zod definition
 * 2. Call OpenAI API with schema constraint
 * 3. Parse and validate response
 * 4. Return typed result or detailed error
 *
 * @param resume - Candidate resume to analyze
 * @param job - Job description to match against
 * @returns Validated ResumeScreening or error details
 */
export async function runResumeScreening(
  resume: Resume,
  job: JobDescription
): Promise<LLMAgentResult> {
  const modelToUse = openaiConfig.model || modelConfig.primaryModel;

  // Format resume and job for the prompt
  const resumeText = formatResumeAsText(resume);
  const jobRequirements = [
    'Required:',
    ...job.requirements.required.map(r => `  - ${r}`),
    'Preferred:',
    ...job.requirements.preferred.map(r => `  - ${r}`)
  ].join('\n');

  const prompt = `
Analyze the following resume against the job requirements.

## Job: ${job.title}
${job.description}

## Requirements:
${jobRequirements}

## Resume:
${resumeText}

---
Candidate ID: ${resume.candidateId}
Job ID: ${job.jobId}

Provide your screening analysis as a JSON object. Be thorough and cite specific evidence from the resume.
`;

  console.log('[OpenAI API] Making API call...');
  console.log(`[OpenAI API] Model: ${modelToUse}`);
  console.log(`[OpenAI API] Prompt length: ${prompt.length} chars`);

  try {
    const client = getOpenAIClient();

    // Build the JSON schema for Structured Outputs
    // Use $refStrategy: 'none' to inline all definitions (OpenAI requires flat schema)
    const jsonSchema = zodToJsonSchema(ResumeScreeningSchema, {
      $refStrategy: 'none',
      errorMessages: true
    });

    const response = await client.chat.completions.create({
      model: modelToUse,
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      messages: [
        {
          role: 'system',
          content: `You are an expert HR recruiter screening resumes. You must analyze resumes against job requirements and provide structured screening assessments.

Your response MUST follow Schema-Guided Reasoning:
1. Evaluate technical skills against requirements (with specific evidence)
2. Assess experience level and relevance (with specific evidence)
3. Review education background (with specific evidence)
4. Identify at least 3 screening steps with detailed evidence from the resume
5. Provide an overall fit assessment
6. Recommend a specific next action

Be thorough and cite specific details from the resume as evidence.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ResumeScreening',
          strict: true,
          schema: jsonSchema
        }
      }
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        error: {
          type: 'api_error',
          message: 'No content in OpenAI response'
        }
      };
    }

    console.log('[OpenAI API] Response received successfully');
    console.log(`[OpenAI API] Tokens used: ${response.usage?.total_tokens || 'unknown'}`);

    // Parse JSON from response
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch (e) {
      return {
        success: false,
        error: {
          type: 'parse_error',
          message: `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`
        },
        rawResponse: content,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.total_tokens || 0
        }
      };
    }

    // Validate against Zod schema
    // With Constrained Decoding (strict=true), this should never fail
    try {
      const validatedData = ResumeScreeningSchema.parse(parsedJson);

      console.log('[Validation] SUCCESS - Data matches ResumeScreeningSchema');

      return {
        success: true,
        data: validatedData,
        rawResponse: content,
        metadata: {
          model: response.model,
          tokensUsed: response.usage?.total_tokens || 0
        }
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
          rawResponse: content,
          metadata: {
            model: response.model,
            tokensUsed: response.usage?.total_tokens || 0
          }
        };
      }
      throw e;
    }
  } catch (error) {
    console.error('[OpenAI API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: {
        type: 'api_error',
        message: errorMessage
      }
    };
  }
}

