/**
 * LLMAgent.ts - LLM Service Simulation with Structured Outputs
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
  ComplianceReviewSchema,
  ComplianceReview,
  exampleComplianceReview
} from './SGRSchema.js';

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
 * LLMRequestPayload - Simulates what would be sent to an LLM API
 *
 * In real implementations (e.g., OpenAI), this would map to:
 * - messages: array of conversation messages
 * - response_format: { type: "json_schema", json_schema: { ... } }
 * - strict: true (enables Constrained Decoding)
 */
interface LLMRequestPayload {
  prompt: string;
  jsonSchema: string;
  strict: boolean;
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

/**
 * simulateLLMCall - Mock LLM API call
 *
 * This function simulates the behavior of an LLM API with Structured Outputs.
 * It alternates between:
 * - Success: Returns valid JSON matching ComplianceReviewSchema
 * - Failure: Returns malformed data (for testing validation)
 *
 * In production, this would be replaced with actual SDK calls:
 * ```typescript
 * const response = await openai.chat.completions.create({
 *   model: "gpt-4o",
 *   messages: [{ role: "user", content: prompt }],
 *   response_format: {
 *     type: "json_schema",
 *     json_schema: { name: "compliance_review", schema: jsonSchema, strict: true }
 *   }
 * });
 * ```
 *
 * @param schema - JSON Schema string defining expected output structure
 * @param prompt - User prompt for the LLM
 * @param forceFailure - If true, always return malformed data
 * @returns Simulated LLM response
 */
export function simulateLLMCall(
  schema: string,
  prompt: string,
  forceFailure: boolean = false
): LLMResponse {
  simulationCallCount++;

  console.log('[LLM Simulation] Request received');
  console.log(`[LLM Simulation] Prompt: "${prompt.substring(0, 50)}..."`);
  console.log(`[LLM Simulation] Schema provided: ${schema.length} chars`);
  console.log(`[LLM Simulation] Call count: ${simulationCallCount}`);

  // Simulate failure on even calls or when forced
  const shouldFail = forceFailure || (simulationCallCount % 2 === 0);

  if (shouldFail) {
    console.log('[LLM Simulation] Returning MALFORMED response (for testing)');

    // Return malformed data - missing required fields, wrong types
    const malformedResponse = {
      document_id: 'DOC-FAIL-001',
      preliminary_finding: 'invalid_status', // Invalid enum value
      reasoning_steps: [
        {
          step_number: 'one', // Wrong type: string instead of number
          focus_area: 'Test',
          intermediate_conclusion: 'This will fail validation'
        }
      ],
      final_risk_score: 15, // Out of range (max is 10)
      // action_required is missing entirely
    };

    return {
      success: true, // API call "succeeded" but data is malformed
      rawContent: JSON.stringify(malformedResponse),
      metadata: {
        model: 'simulated-model-v1',
        tokensUsed: 150
      }
    };
  }

  console.log('[LLM Simulation] Returning VALID response');

  // Return valid data matching the schema
  const validResponse: ComplianceReview = {
    document_id: `DOC-${Date.now()}`,
    preliminary_finding: 'needs_revision',
    reasoning_steps: [
      {
        step_number: 1,
        focus_area: 'Regulatory Compliance',
        intermediate_conclusion: 'Document references outdated regulations from 2019'
      },
      {
        step_number: 2,
        focus_area: 'Data Handling Procedures',
        intermediate_conclusion: 'Data retention policy meets current GDPR requirements'
      },
      {
        step_number: 3,
        focus_area: 'Access Control Documentation',
        intermediate_conclusion: 'Role-based access control properly documented'
      }
    ],
    final_risk_score: 4,
    action_required: [
      'Update regulatory references to 2024 standards',
      'Schedule follow-up review in 6 months'
    ]
  };

  return {
    success: true,
    rawContent: JSON.stringify(validResponse),
    metadata: {
      model: 'simulated-model-v1',
      tokensUsed: 280
    }
  };
}

/**
 * Reset the simulation call counter
 * Useful for testing to ensure predictable behavior
 */
export function resetSimulationState(): void {
  simulationCallCount = 0;
}

/**
 * LLMAgentResult - Result of the agent processing
 */
export interface LLMAgentResult {
  success: boolean;
  data?: ComplianceReview;
  error?: {
    type: 'parse_error' | 'validation_error';
    message: string;
    details?: z.ZodIssue[];
  };
  rawResponse: string;
}

/**
 * runComplianceReview - Main agent function
 *
 * This is the primary interface for running a compliance review.
 * It demonstrates the full Structured Outputs workflow:
 *
 * 1. Generate JSON Schema from Zod definition
 * 2. Call LLM with schema constraint
 * 3. Parse and validate response
 * 4. Return typed result or detailed error
 *
 * @param documentContent - Content to analyze
 * @param forceFailure - For testing: force malformed response
 * @returns Validated ComplianceReview or error details
 */
export async function runComplianceReview(
  documentContent: string,
  forceFailure: boolean = false
): Promise<LLMAgentResult> {
  // Step 1: Convert Zod schema to JSON Schema string
  // This is what gets sent to the LLM API for Constrained Decoding
  const jsonSchemaString = zodToJsonSchemaString(
    ComplianceReviewSchema,
    'ComplianceReview'
  );

  console.log('\n=== JSON Schema Generated for LLM ===');
  console.log(jsonSchemaString);
  console.log('=====================================\n');

  // Step 2: Construct prompt with SGR instructions
  // The prompt explains the schema structure to guide the model
  const prompt = `
You are a compliance review assistant. Analyze the following document
and provide a structured compliance review.

IMPORTANT: Your response MUST follow the Schema-Guided Reasoning process:
1. Start with a preliminary finding (compliant/needs_revision/non_compliant)
2. Work through AT LEAST 2 reasoning steps, each examining a different aspect
3. Assign a risk score from 1-10 based on your analysis
4. List specific actions required

Document to analyze:
---
${documentContent}
---

Provide your analysis as a JSON object matching the required schema.
`;

  // Step 3: Call simulated LLM with schema enforcement
  // In production: This would use OpenAI/Anthropic SDK with strict=true
  const llmResponse = simulateLLMCall(jsonSchemaString, prompt, forceFailure);

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

  // Step 4: Parse JSON from raw response
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

  // Step 5: Validate against Zod schema
  // This is the critical validation step that catches any schema violations
  // With true Constrained Decoding (strict=true), this should never fail
  // But it's essential for:
  // - APIs without strict mode
  // - Defense in depth
  // - Catching edge cases
  try {
    const validatedData = ComplianceReviewSchema.parse(parsedJson);

    console.log('[Validation] SUCCESS - Data matches ComplianceReviewSchema');

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
    ComplianceReviewSchema,
    'ComplianceReview'
  );

  console.log('The following JSON Schema is generated from the Zod definition:');
  console.log('This schema would be sent to the LLM API with strict=true\n');
  console.log(jsonSchema);

  console.log('\n=== How This Enables SGR ===');
  console.log('1. The schema REQUIRES reasoning_steps array (min 2 items)');
  console.log('2. Each step MUST have step_number, focus_area, intermediate_conclusion');
  console.log('3. This forces the LLM to "show its work" step by step');
  console.log('4. The preliminary_finding enum prevents vague assessments');
  console.log('5. The risk_score constraints (1-10) ensure quantifiable output');
  console.log('============================================\n');
}
