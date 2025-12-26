/**
 * AgentFlow.ts - Function Calling & Agent Workflow
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
import { ComplianceReview } from './SGRSchema.js';

// ============================================================
// TOOL SCHEMAS - Define the contract for function arguments
// ============================================================

/**
 * UpdateDatabaseArgs - Schema for database update function
 *
 * This schema defines what arguments the updateDatabase tool accepts.
 * When sent to an LLM with function calling enabled, the model's
 * output will be constrained to match this schema exactly.
 */
export const UpdateDatabaseArgsSchema = z.object({
  // Status must be one of these exact values
  status: z.enum(['completed', 'failed', 'pending'])
    .describe('Current status of the review process'),

  // Review ID must be a non-empty string
  review_id: z.string()
    .min(1)
    .describe('Unique identifier for the compliance review'),

  // Optional metadata for additional context
  metadata: z.object({
    risk_score: z.number().min(1).max(10).optional(),
    reviewer: z.string().optional(),
    timestamp: z.string().optional()
  }).optional().describe('Additional metadata for the update')
});

export type UpdateDatabaseArgs = z.infer<typeof UpdateDatabaseArgsSchema>;

/**
 * SendNotificationArgs - Schema for notification function
 *
 * Another tool the agent can call, demonstrating multiple
 * function definitions in a single agent workflow.
 */
export const SendNotificationArgsSchema = z.object({
  recipient: z.string().email().describe('Email address of the recipient'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).describe('Notification priority level'),
  subject: z.string().min(1).max(200).describe('Notification subject line'),
  body: z.string().min(1).describe('Notification body content')
});

export type SendNotificationArgs = z.infer<typeof SendNotificationArgsSchema>;

// ============================================================
// TOOL IMPLEMENTATIONS - Actual functions the agent can call
// ============================================================

/**
 * updateDatabase - Simulated database update function
 *
 * This is the actual implementation that gets called with
 * validated arguments from the LLM.
 *
 * Note: The args parameter is typed using Zod's infer utility,
 * ensuring compile-time type safety matches runtime validation.
 */
export function updateDatabase(args: UpdateDatabaseArgs): boolean {
  console.log('\n[Tool: updateDatabase] Executing with validated arguments:');
  console.log(`  Review ID: ${args.review_id}`);
  console.log(`  Status: ${args.status}`);

  if (args.metadata) {
    console.log(`  Metadata:`);
    if (args.metadata.risk_score !== undefined) {
      console.log(`    Risk Score: ${args.metadata.risk_score}`);
    }
    if (args.metadata.reviewer) {
      console.log(`    Reviewer: ${args.metadata.reviewer}`);
    }
    if (args.metadata.timestamp) {
      console.log(`    Timestamp: ${args.metadata.timestamp}`);
    }
  }

  // Simulate database operation
  console.log('[Tool: updateDatabase] Database updated successfully');

  return true;
}

/**
 * sendNotification - Simulated notification function
 */
export function sendNotification(args: SendNotificationArgs): boolean {
  console.log('\n[Tool: sendNotification] Sending notification:');
  console.log(`  To: ${args.recipient}`);
  console.log(`  Priority: ${args.priority}`);
  console.log(`  Subject: ${args.subject}`);
  console.log(`  Body: ${args.body.substring(0, 50)}...`);

  // Simulate sending notification
  console.log('[Tool: sendNotification] Notification sent successfully');

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
  updateDatabase: {
    name: 'updateDatabase',
    description: 'Update the compliance review status in the database',
    schema: UpdateDatabaseArgsSchema,
    execute: updateDatabase
  } as ToolDefinition<typeof UpdateDatabaseArgsSchema>,

  sendNotification: {
    name: 'sendNotification',
    description: 'Send a notification about the compliance review',
    schema: SendNotificationArgsSchema,
    execute: sendNotification
  } as ToolDefinition<typeof SendNotificationArgsSchema>
};

// ============================================================
// SIMULATED LLM FUNCTION CALL - What the model outputs
// ============================================================

/**
 * SimulatedFunctionCall - Represents LLM's decision to call a function
 *
 * In a real API response, this would come from the LLM's output
 * in a structured format indicating which function to call and
 * what arguments to pass.
 */
interface SimulatedFunctionCall {
  function_name: string;
  arguments: unknown; // Raw arguments before validation
}

/**
 * Simulates the LLM generating a function call
 *
 * In production, this would come from the LLM API response.
 * The model decides which function to call based on the context.
 */
function simulateLLMFunctionCall(
  review: ComplianceReview,
  shouldFail: boolean = false
): SimulatedFunctionCall {
  if (shouldFail) {
    // Return invalid arguments to test validation
    return {
      function_name: 'updateDatabase',
      arguments: {
        status: 'invalid_status', // Not in enum
        review_id: '', // Empty string fails min(1)
        metadata: {
          risk_score: 20 // Out of range
        }
      }
    };
  }

  // Generate valid function call based on the review
  return {
    function_name: 'updateDatabase',
    arguments: {
      status: review.preliminary_finding === 'compliant' ? 'completed' : 'pending',
      review_id: review.document_id,
      metadata: {
        risk_score: review.final_risk_score,
        reviewer: 'compliance-agent-v1',
        timestamp: new Date().toISOString()
      }
    }
  };
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
 * 1. Receive a ComplianceReview result
 * 2. LLM decides to call a function (simulated)
 * 3. Validate the function arguments against Zod schema
 * 4. Execute the function with validated arguments
 * 5. Return the result
 *
 * Key Point: The validation step ensures that even if the LLM
 * produces unexpected output, the function receives only valid arguments.
 */
export async function executeAgentFlow(
  review: ComplianceReview,
  forceInvalidCall: boolean = false
): Promise<AgentFlowResult> {
  console.log('\n=== Agent Flow: Function Calling Demo ===');
  console.log(`Processing review for document: ${review.document_id}`);

  // Step 1: LLM generates a function call decision
  const functionCall = simulateLLMFunctionCall(review, forceInvalidCall);
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
  // This is where Structured Outputs provides reliability guarantees
  console.log('\nValidating arguments against schema...');

  try {
    const validatedArgs = tool.schema.parse(functionCall.arguments);
    console.log('Validation successful!');

    // Step 4: Execute the function with validated arguments
    const success = tool.execute(validatedArgs);

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
      // This enables Constrained Decoding for function arguments
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
  console.log(JSON.stringify(generateToolDefinitionsForLLM(), null, 2));

  // Create a sample review result
  const sampleReview: ComplianceReview = {
    document_id: 'DOC-DEMO-001',
    preliminary_finding: 'needs_revision',
    reasoning_steps: [
      {
        step_number: 1,
        focus_area: 'Documentation Completeness',
        intermediate_conclusion: 'All required sections present'
      },
      {
        step_number: 2,
        focus_area: 'Regulatory Alignment',
        intermediate_conclusion: 'Minor updates needed for 2024 standards'
      }
    ],
    final_risk_score: 3,
    action_required: ['Update regulatory references']
  };

  // Execute with valid arguments
  console.log('\n--- Test 1: Valid Function Call ---');
  const result1 = await executeAgentFlow(sampleReview, false);
  console.log('Result:', result1);

  // Execute with invalid arguments (to show validation)
  console.log('\n--- Test 2: Invalid Function Call (Validation Test) ---');
  const result2 = await executeAgentFlow(sampleReview, true);
  console.log('Result:', result2);

  console.log('\n========================================');
  console.log('DEMONSTRATION COMPLETE');
  console.log('========================================\n');
}
