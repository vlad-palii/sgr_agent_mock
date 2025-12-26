/**
 * index.ts - Main Entry Point
 *
 * This file demonstrates the complete SGR and Structured Outputs workflow.
 * Run with: npm run dev
 */

import {
  runComplianceReview,
  demonstrateSchemaGeneration,
  resetSimulationState
} from './LLMAgent.js';
import { demonstrateAgentFlow } from './AgentFlow.js';
import { ComplianceReviewSchema, exampleComplianceReview } from './SGRSchema.js';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Schema-Guided Reasoning & Structured Outputs Demo        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Demo 1: Schema Generation
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 1: Schema Generation for LLM API                          │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  demonstrateSchemaGeneration();

  // Demo 2: Example Valid Data
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 2: Example Valid ComplianceReview                          │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(JSON.stringify(exampleComplianceReview, null, 2));

  // Demo 3: Successful LLM Call
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 3: Successful LLM Call with Validation                     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  resetSimulationState();
  const successResult = await runComplianceReview(
    'Sample document for compliance review. Contains financial data and user information.'
  );
  console.log('\nResult:', JSON.stringify(successResult, null, 2));

  // Demo 4: Failed LLM Call (Validation Error)
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 4: Failed LLM Call - Validation Catches Malformed Data     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  const failResult = await runComplianceReview(
    'Another document to review.',
    true // Force failure
  );
  console.log('\nResult:', JSON.stringify(failResult, null, 2));

  // Demo 5: Agent Flow with Function Calling
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 5: Agent Flow - Function Calling with Structured Outputs   │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  await demonstrateAgentFlow();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    All Demos Complete                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
