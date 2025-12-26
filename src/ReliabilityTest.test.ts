/**
 * ReliabilityTest.test.ts - Testing and Evaluation for Structured Outputs
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
import { z, ZodError } from 'zod';
import {
  ComplianceReviewSchema,
  ComplianceReview,
  ReasoningStepSchema,
  PreliminaryFindingEnum
} from './SGRSchema.js';
import {
  runComplianceReview,
  resetSimulationState,
  LLMAgentResult
} from './LLMAgent.js';
import {
  executeAgentFlow,
  UpdateDatabaseArgsSchema
} from './AgentFlow.js';

// ============================================================
// VALIDATION TESTS - Core Zod Schema Testing
// ============================================================

describe('ComplianceReviewSchema Validation', () => {
  /**
   * Test 1: Valid data passes validation
   *
   * This confirms our schema correctly accepts well-formed data.
   * In production, this validates that properly configured Structured
   * Outputs will produce parseable results.
   */
  it('should accept valid compliance review data', () => {
    const validData: ComplianceReview = {
      document_id: 'DOC-TEST-001',
      preliminary_finding: 'compliant',
      reasoning_steps: [
        {
          step_number: 1,
          focus_area: 'Data Privacy',
          intermediate_conclusion: 'All privacy requirements met'
        },
        {
          step_number: 2,
          focus_area: 'Security Controls',
          intermediate_conclusion: 'Encryption standards compliant'
        }
      ],
      final_risk_score: 2,
      action_required: ['Schedule annual review']
    };

    const result = ComplianceReviewSchema.parse(validData);
    expect(result).toEqual(validData);
  });

  /**
   * Test 2: Invalid enum value throws ZodError
   *
   * This tests the Constrained Decoding simulation - if an LLM
   * (without strict mode) produces an invalid enum, we catch it.
   */
  it('should reject invalid preliminary_finding enum value', () => {
    const invalidData = {
      document_id: 'DOC-TEST-002',
      preliminary_finding: 'maybe_compliant', // Invalid enum value
      reasoning_steps: [
        { step_number: 1, focus_area: 'Test', intermediate_conclusion: 'Test' },
        { step_number: 2, focus_area: 'Test', intermediate_conclusion: 'Test' }
      ],
      final_risk_score: 5,
      action_required: []
    };

    expect(() => ComplianceReviewSchema.parse(invalidData)).toThrow(ZodError);
  });

  /**
   * Test 3: Out-of-range risk score is rejected
   *
   * Demonstrates numeric constraint enforcement.
   * The LLM cannot output risk_score: 15 when max is 10.
   */
  it('should reject risk score outside valid range (1-10)', () => {
    const invalidData = {
      document_id: 'DOC-TEST-003',
      preliminary_finding: 'compliant',
      reasoning_steps: [
        { step_number: 1, focus_area: 'Test', intermediate_conclusion: 'Test' },
        { step_number: 2, focus_area: 'Test', intermediate_conclusion: 'Test' }
      ],
      final_risk_score: 15, // Out of range
      action_required: []
    };

    expect(() => ComplianceReviewSchema.parse(invalidData)).toThrow(ZodError);
  });

  /**
   * Test 4: Minimum reasoning steps enforcement
   *
   * This is critical for SGR - we require at least 2 reasoning steps
   * to ensure the LLM doesn't skip the structured thinking process.
   */
  it('should require minimum 2 reasoning steps for SGR compliance', () => {
    const insufficientSteps = {
      document_id: 'DOC-TEST-004',
      preliminary_finding: 'compliant',
      reasoning_steps: [
        { step_number: 1, focus_area: 'Test', intermediate_conclusion: 'Test' }
        // Only 1 step - should fail
      ],
      final_risk_score: 5,
      action_required: []
    };

    expect(() => ComplianceReviewSchema.parse(insufficientSteps)).toThrow(ZodError);
  });

  /**
   * Test 5: Missing required field detection
   *
   * Tests that the schema catches missing fields that would cause
   * runtime errors if not validated.
   */
  it('should reject data with missing required fields', () => {
    const missingFields = {
      document_id: 'DOC-TEST-005',
      preliminary_finding: 'compliant'
      // Missing: reasoning_steps, final_risk_score, action_required
    };

    expect(() => ComplianceReviewSchema.parse(missingFields)).toThrow(ZodError);
  });
});

// ============================================================
// LLM AGENT INTEGRATION TESTS
// ============================================================

describe('LLMAgent Validation Handling', () => {
  beforeEach(() => {
    // Reset simulation state before each test for predictable behavior
    resetSimulationState();
  });

  /**
   * Test 6: Successful validation flow
   *
   * Tests the happy path where LLM output is valid.
   */
  it('should successfully parse valid LLM response', async () => {
    // First call returns valid data
    const result = await runComplianceReview('Test document content');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.document_id).toBeDefined();
    expect(result.data?.reasoning_steps.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Test 7: Catch ZodError on malformed LLM response
   *
   * This is the CRITICAL test demonstrating runtime validation.
   * When forceFailure=true, the simulated LLM returns malformed data,
   * and we verify that:
   * 1. The validation catches the error
   * 2. The error contains actionable details
   * 3. The raw response is preserved for debugging
   */
  it('should catch and report ZodError for invalid LLM response', async () => {
    // Force the simulation to return malformed data
    const result = await runComplianceReview('Test document', true);

    // Verify validation failure is properly captured
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe('validation_error');

    // Verify we have detailed error information
    expect(result.error?.details).toBeDefined();
    expect(Array.isArray(result.error?.details)).toBe(true);

    // The error details should indicate specific schema violations
    const issues = result.error?.details || [];
    expect(issues.length).toBeGreaterThan(0);

    // Verify raw response is preserved for debugging
    expect(result.rawResponse).toBeDefined();
    expect(typeof result.rawResponse).toBe('string');
  });

  /**
   * Test 8: Error message extraction for retry loop
   *
   * This test demonstrates how to extract error information
   * that would be fed back to the LLM for a retry attempt.
   */
  it('should provide error details suitable for LLM retry feedback', async () => {
    const result = await runComplianceReview('Test document', true);

    expect(result.success).toBe(false);

    // Extract error message that would be sent back to LLM
    const errorFeedback = result.error?.message;
    expect(errorFeedback).toBeDefined();
    expect(typeof errorFeedback).toBe('string');

    // The error message should be informative for the LLM
    // to understand what went wrong and how to fix it
    expect(errorFeedback!.length).toBeGreaterThan(0);
  });
});

// ============================================================
// AGENT FLOW TESTS - Function Calling Validation
// ============================================================

describe('AgentFlow Function Calling Validation', () => {
  const validReview: ComplianceReview = {
    document_id: 'DOC-FLOW-001',
    preliminary_finding: 'needs_revision',
    reasoning_steps: [
      { step_number: 1, focus_area: 'Test Area 1', intermediate_conclusion: 'Conclusion 1' },
      { step_number: 2, focus_area: 'Test Area 2', intermediate_conclusion: 'Conclusion 2' }
    ],
    final_risk_score: 4,
    action_required: ['Action 1']
  };

  /**
   * Test 9: Valid function call execution
   */
  it('should execute function with valid arguments', async () => {
    const result = await executeAgentFlow(validReview, false);

    expect(result.success).toBe(true);
    expect(result.functionCalled).toBe('updateDatabase');
  });

  /**
   * Test 10: Invalid function arguments are caught
   */
  it('should catch validation errors for invalid function arguments', async () => {
    const result = await executeAgentFlow(validReview, true);

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
 * LLM EVALUATION (EVALS) SYSTEM DESIGN
 * ============================================================
 *
 * In production, LLM outputs must be systematically evaluated.
 * This section outlines how to implement Evals using tools like
 * promptfoo (https://promptfoo.dev) or custom evaluation pipelines.
 *
 * EVAL TYPE 1: is-json (Deterministic Check)
 * -------------------------------------------
 * Purpose: Verify the LLM output is valid JSON before any other processing.
 *
 * promptfoo configuration example:
 * ```yaml
 * tests:
 *   - vars:
 *       document: "Sample compliance document..."
 *     assert:
 *       - type: is-json
 *         # This assertion passes only if the output parses as valid JSON
 * ```
 *
 * Implementation in code:
 * ```typescript
 * function evalIsJson(llmOutput: string): boolean {
 *   try {
 *     JSON.parse(llmOutput);
 *     return true;
 *   } catch {
 *     return false;
 *   }
 * }
 * ```
 *
 * EVAL TYPE 2: schema-conformance (SGR Validation)
 * -------------------------------------------------
 * Purpose: Verify all mandatory SGR fields are present and valid.
 *
 * promptfoo configuration example:
 * ```yaml
 * tests:
 *   - vars:
 *       document: "Sample compliance document..."
 *     assert:
 *       - type: javascript
 *         value: |
 *           const { ComplianceReviewSchema } = require('./SGRSchema');
 *           try {
 *             const parsed = JSON.parse(output);
 *             ComplianceReviewSchema.parse(parsed);
 *             // Additional SGR-specific checks:
 *             if (parsed.reasoning_steps.length < 2) {
 *               return { pass: false, reason: 'Insufficient reasoning steps' };
 *             }
 *             return { pass: true };
 *           } catch (e) {
 *             return { pass: false, reason: e.message };
 *           }
 * ```
 *
 * Implementation in code:
 * ```typescript
 * interface EvalResult {
 *   pass: boolean;
 *   reason?: string;
 *   metrics?: {
 *     reasoningStepsCount: number;
 *     allFocusAreasPresent: boolean;
 *     riskScoreInRange: boolean;
 *   };
 * }
 *
 * function evalSchemaConformance(llmOutput: string): EvalResult {
 *   try {
 *     const parsed = JSON.parse(llmOutput);
 *     const validated = ComplianceReviewSchema.parse(parsed);
 *
 *     // SGR-specific checks
 *     const reasoningStepsCount = validated.reasoning_steps.length;
 *     const allFocusAreasPresent = validated.reasoning_steps.every(
 *       step => step.focus_area.length > 0
 *     );
 *
 *     return {
 *       pass: true,
 *       metrics: {
 *         reasoningStepsCount,
 *         allFocusAreasPresent,
 *         riskScoreInRange: validated.final_risk_score >= 1 && validated.final_risk_score <= 10
 *       }
 *     };
 *   } catch (e) {
 *     return {
 *       pass: false,
 *       reason: e instanceof Error ? e.message : 'Unknown error'
 *     };
 *   }
 * }
 * ```
 *
 * EVAL TYPE 3: semantic-quality (LLM-as-Judge)
 * --------------------------------------------
 * Purpose: Use another LLM to evaluate reasoning quality.
 *
 * ```yaml
 * tests:
 *   - assert:
 *       - type: llm-rubric
 *         value: |
 *           Evaluate if the compliance review reasoning is:
 *           1. Logically coherent
 *           2. Covers relevant compliance areas
 *           3. Provides actionable conclusions
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
 * When a Zod validation error occurs, the error message contains
 * specific information about what went wrong. This can be fed back
 * to the LLM to trigger an automatic retry.
 *
 * RETRY FLOW:
 * 1. Capture the ZodError from failed validation
 * 2. Format the error message for LLM understanding
 * 3. Construct a retry prompt with the error feedback
 * 4. Call the LLM again with the corrective information
 * 5. Repeat until success or max retries reached
 *
 * IMPLEMENTATION EXAMPLE:
 * ```typescript
 * const MAX_RETRIES = 3;
 *
 * async function runWithRetry(documentContent: string): Promise<LLMAgentResult> {
 *   let lastError: string | undefined;
 *
 *   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
 *     console.log(`Attempt ${attempt}/${MAX_RETRIES}`);
 *
 *     // Construct prompt with error feedback if this is a retry
 *     let prompt = `Analyze this document for compliance: ${documentContent}`;
 *
 *     if (lastError) {
 *       // Include the validation error in the retry prompt
 *       // This tells the LLM exactly what to fix
 *       prompt += `\n\nPREVIOUS ATTEMPT FAILED VALIDATION:\n${lastError}`;
 *       prompt += `\n\nPlease correct your response to match the required schema.`;
 *     }
 *
 *     const result = await runComplianceReview(documentContent);
 *
 *     if (result.success) {
 *       console.log(`Success on attempt ${attempt}`);
 *       return result;
 *     }
 *
 *     // Capture error for next retry
 *     lastError = result.error?.message;
 *
 *     // Include specific field errors for targeted feedback
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
 * ERROR FEEDBACK FORMAT:
 * The key to effective retry is providing clear, actionable feedback:
 *
 * ```
 * PREVIOUS ATTEMPT FAILED VALIDATION:
 * - preliminary_finding: Invalid enum value. Expected 'compliant' | 'needs_revision' | 'non_compliant', received 'maybe'
 * - final_risk_score: Number must be less than or equal to 10
 * - reasoning_steps: Array must contain at least 2 element(s)
 *
 * Please correct your response to match the required schema.
 * ```
 *
 * This specific feedback allows the LLM to understand exactly what
 * constraints it violated and how to fix them.
 *
 * ============================================================
 */

// ============================================================
// ADDITIONAL UTILITY TESTS
// ============================================================

describe('Schema Utility Functions', () => {
  /**
   * Test 11: Verify enum values are correctly constrained
   */
  it('should only accept defined enum values for preliminary_finding', () => {
    const validValues = ['compliant', 'needs_revision', 'non_compliant'];

    validValues.forEach(value => {
      expect(() => PreliminaryFindingEnum.parse(value)).not.toThrow();
    });

    expect(() => PreliminaryFindingEnum.parse('invalid')).toThrow(ZodError);
    expect(() => PreliminaryFindingEnum.parse('')).toThrow(ZodError);
    expect(() => PreliminaryFindingEnum.parse(123)).toThrow(ZodError);
  });

  /**
   * Test 12: Verify ReasoningStep schema validation
   */
  it('should validate individual reasoning steps correctly', () => {
    const validStep = {
      step_number: 1,
      focus_area: 'Test Focus',
      intermediate_conclusion: 'Test Conclusion'
    };

    expect(() => ReasoningStepSchema.parse(validStep)).not.toThrow();

    // Missing field
    expect(() => ReasoningStepSchema.parse({
      step_number: 1,
      focus_area: 'Test'
      // missing intermediate_conclusion
    })).toThrow(ZodError);

    // Wrong type
    expect(() => ReasoningStepSchema.parse({
      step_number: 'one', // should be number
      focus_area: 'Test',
      intermediate_conclusion: 'Test'
    })).toThrow(ZodError);
  });

  /**
   * Test 13: UpdateDatabaseArgs schema validation
   */
  it('should validate UpdateDatabaseArgs correctly', () => {
    const validArgs = {
      status: 'completed',
      review_id: 'REV-001'
    };

    expect(() => UpdateDatabaseArgsSchema.parse(validArgs)).not.toThrow();

    // Invalid status enum
    expect(() => UpdateDatabaseArgsSchema.parse({
      status: 'invalid_status',
      review_id: 'REV-001'
    })).toThrow(ZodError);

    // Empty review_id
    expect(() => UpdateDatabaseArgsSchema.parse({
      status: 'completed',
      review_id: ''
    })).toThrow(ZodError);
  });
});
