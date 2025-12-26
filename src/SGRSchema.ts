/**
 * SGRSchema.ts - Schema-Guided Reasoning (SGR) Schema Definition
 *
 * This module defines the core Zod schemas that enforce structured reasoning
 * during LLM inference. The ComplianceReviewSchema acts as a "mandatory checklist"
 * that the LLM must follow, ensuring:
 *
 * 1. Predictable output structure (100% valid JSON)
 * 2. Enforced logical flow through reasoning_steps array
 * 3. Auditable decision trail for compliance/debugging
 * 4. Type-safe data contracts between LLM and application code
 *
 * Key SGR Concept: By defining a complex, nested schema with required fields,
 * we force the LLM to "think through" each step rather than jumping to conclusions.
 * This is Schema-Guided Reasoning - the schema itself becomes the reasoning scaffold.
 */

import { z } from 'zod';

/**
 * PreliminaryFinding - Enum constraint for initial assessment
 *
 * Using z.enum() ensures the LLM can only output one of these exact values.
 * This is Constrained Decoding in action - invalid values are impossible.
 */
export const PreliminaryFindingEnum = z.enum([
  'compliant',
  'needs_revision',
  'non_compliant'
]);

export type PreliminaryFinding = z.infer<typeof PreliminaryFindingEnum>;

/**
 * ReasoningStep - Individual step in the SGR checklist
 *
 * Each reasoning step forces the LLM to:
 * 1. Identify what aspect it's analyzing (focus_area)
 * 2. Provide an intermediate conclusion for that specific area
 *
 * This creates an auditable trail and prevents "reasoning shortcuts"
 * where the model might skip important considerations.
 */
export const ReasoningStepSchema = z.object({
  // Step number enforces sequential thinking
  step_number: z.number()
    .int()
    .min(1)
    .describe('Sequential step number in the reasoning process'),

  // Focus area ensures comprehensive coverage
  focus_area: z.string()
    .min(1)
    .describe('Specific aspect being analyzed in this step (e.g., "Data Privacy", "Financial Disclosure")'),

  // Intermediate conclusion captures step-by-step reasoning
  intermediate_conclusion: z.string()
    .min(1)
    .describe('Conclusion reached for this specific focus area')
});

export type ReasoningStep = z.infer<typeof ReasoningStepSchema>;

/**
 * ComplianceReviewSchema - Main SGR Schema
 *
 * This is the core Schema-Guided Reasoning structure. When sent to an LLM
 * with Structured Outputs enabled (strict=true), the model MUST produce
 * output that conforms exactly to this schema.
 *
 * The complexity of this schema (nested arrays, enums, numeric constraints)
 * demonstrates that Constrained Decoding can handle real-world production
 * requirements, not just simple key-value pairs.
 */
export const ComplianceReviewSchema = z.object({
  // Unique identifier for the document being reviewed
  document_id: z.string()
    .min(1)
    .describe('Unique identifier for the document under review'),

  // High-level initial assessment - constrained to enum values
  preliminary_finding: PreliminaryFindingEnum
    .describe('Initial compliance assessment before detailed analysis'),

  /**
   * reasoning_steps - The Heart of SGR
   *
   * This array is what makes this Schema-Guided Reasoning:
   * - Forces the LLM to break down analysis into discrete steps
   * - Each step must have a focus and conclusion
   * - Creates an auditable reasoning trail
   * - Prevents the model from skipping directly to a conclusion
   *
   * Minimum 2 steps ensures non-trivial analysis.
   */
  reasoning_steps: z.array(ReasoningStepSchema)
    .min(2)
    .describe('Mandatory reasoning steps - each step represents a distinct analysis phase'),

  /**
   * final_risk_score - Numeric constraint demonstration
   *
   * The min(1) and max(10) constraints prove that Structured Outputs
   * can enforce numeric ranges, not just string patterns.
   * The LLM literally cannot output 0 or 11.
   */
  final_risk_score: z.number()
    .min(1)
    .max(10)
    .describe('Risk score from 1 (minimal risk) to 10 (critical risk)'),

  // Actionable outputs from the analysis
  action_required: z.array(z.string().min(1))
    .describe('List of required actions based on the compliance review')
});

export type ComplianceReview = z.infer<typeof ComplianceReviewSchema>;

/**
 * Example of a valid ComplianceReview object
 *
 * This demonstrates the expected structure and can be used for:
 * - Documentation
 * - Test fixtures
 * - LLM few-shot examples
 */
export const exampleComplianceReview: ComplianceReview = {
  document_id: 'DOC-2024-001',
  preliminary_finding: 'needs_revision',
  reasoning_steps: [
    {
      step_number: 1,
      focus_area: 'Data Privacy Compliance',
      intermediate_conclusion: 'Missing explicit user consent clause for data processing'
    },
    {
      step_number: 2,
      focus_area: 'Financial Disclosure',
      intermediate_conclusion: 'All required financial metrics properly disclosed'
    },
    {
      step_number: 3,
      focus_area: 'Regulatory References',
      intermediate_conclusion: 'GDPR Article 6 citation needed for lawful basis'
    }
  ],
  final_risk_score: 6,
  action_required: [
    'Add explicit consent clause to Section 3.2',
    'Include GDPR Article 6 reference',
    'Submit for secondary legal review'
  ]
};
