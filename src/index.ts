/**
 * index.ts - Resume Screening Demo
 *
 * This file demonstrates Schema-Guided Reasoning (SGR) and Structured Outputs
 * in a real-world resume screening scenario.
 *
 * Run with: npm run dev
 */

import {
  runResumeScreening,
  demonstrateSchemaGeneration,
  resetSimulationState,
  setCandidateType
} from './LLMAgent.js';
import { executeAgentFlow } from './AgentFlow.js';
import { defaultJob } from './examples/jobDescriptions.js';
import {
  strongMatchCandidate,
  potentialFitCandidate,
  notQualifiedCandidate
} from './examples/resumes.js';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║      Resume Screening with Schema-Guided Reasoning           ║');
  console.log('║                 & Structured Outputs Demo                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('This demo shows how LLMs can be constrained to produce');
  console.log('structured, validated hiring decisions using SGR.\n');

  // Demo 1: Schema Generation
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 1: JSON Schema Generation for LLM API                     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('Converting Zod schema to JSON Schema for Structured Outputs...\n');
  demonstrateSchemaGeneration();

  // Demo 2: Screen Strong Match Candidate
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 2: Screening Strong Match Candidate (Alex Chen)           │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}`);
  console.log(`Candidate: ${strongMatchCandidate.name}`);
  console.log(`Experience: 7 years, TypeScript/Python, AWS certified\n`);

  resetSimulationState();
  setCandidateType('strong_match');

  const strongResult = await runResumeScreening(strongMatchCandidate, defaultJob);

  if (strongResult.success && strongResult.data) {
    console.log('\n--- Screening Result ---');
    console.log(`Overall Fit: ${strongResult.data.overall_fit.toUpperCase()}`);
    console.log(`Fit Score: ${strongResult.data.fit_score}/100`);
    console.log(`Recommended Action: ${strongResult.data.recommended_action}`);
    console.log(`Strengths: ${strongResult.data.strengths.length} identified`);
    strongResult.data.strengths.forEach(s => console.log(`  - ${s}`));
  }

  // Demo 3: Screen Potential Fit Candidate (Career Changer)
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 3: Screening Potential Fit Candidate (Jordan Martinez)    │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}`);
  console.log(`Candidate: ${potentialFitCandidate.name}`);
  console.log(`Background: Career changer, bootcamp grad, data analyst exp\n`);

  setCandidateType('potential_fit');

  const potentialResult = await runResumeScreening(potentialFitCandidate, defaultJob);

  if (potentialResult.success && potentialResult.data) {
    console.log('\n--- Screening Result ---');
    console.log(`Overall Fit: ${potentialResult.data.overall_fit.toUpperCase()}`);
    console.log(`Fit Score: ${potentialResult.data.fit_score}/100`);
    console.log(`Recommended Action: ${potentialResult.data.recommended_action}`);
    console.log(`Concerns: ${potentialResult.data.concerns.length} identified`);
    potentialResult.data.concerns.forEach(c => console.log(`  - ${c}`));
  }

  // Demo 4: Screen Not Qualified Candidate
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 4: Screening Not Qualified Candidate (Taylor Smith)       │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}`);
  console.log(`Candidate: ${notQualifiedCandidate.name}`);
  console.log(`Background: Recent grad, minimal tech experience\n`);

  setCandidateType('not_qualified');

  const notQualifiedResult = await runResumeScreening(notQualifiedCandidate, defaultJob);

  if (notQualifiedResult.success && notQualifiedResult.data) {
    console.log('\n--- Screening Result ---');
    console.log(`Overall Fit: ${notQualifiedResult.data.overall_fit.toUpperCase()}`);
    console.log(`Fit Score: ${notQualifiedResult.data.fit_score}/100`);
    console.log(`Recommended Action: ${notQualifiedResult.data.recommended_action}`);
    console.log(`Screening Steps:`);
    notQualifiedResult.data.screening_steps.forEach(step => {
      const status = step.requirement_met ? 'PASS' : 'FAIL';
      console.log(`  ${step.step_number}. ${step.evaluation_category}: ${status}`);
      if (step.gap_identified) {
        console.log(`     Gap: ${step.gap_identified}`);
      }
    });
  }

  // Demo 5: Validation Error Handling
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 5: Validation Error Handling (Malformed LLM Response)     │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('Simulating what happens when LLM returns invalid data...\n');

  const failResult = await runResumeScreening(strongMatchCandidate, defaultJob, true);

  if (!failResult.success && failResult.error) {
    console.log('\n--- Validation Failed (Expected) ---');
    console.log(`Error Type: ${failResult.error.type}`);
    console.log(`Issues detected: ${failResult.error.details?.length || 0}`);
    failResult.error.details?.slice(0, 3).forEach(issue => {
      console.log(`  - Path: ${issue.path.join('.')}, Error: ${issue.message}`);
    });
    console.log('\nThis shows how Zod validation catches invalid LLM output.');
    console.log('With strict=true in production, these errors would never occur.');
  }

  // Demo 6: Agent Flow with Function Calling
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ DEMO 6: Agent Flow - Automated Actions Based on Screening      │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log('Demonstrating how the agent takes actions after screening...\n');

  // Execute agent flow for strong match (should update ATS)
  if (strongResult.success && strongResult.data) {
    console.log('--- Processing Strong Match Candidate ---');
    const agentResult = await executeAgentFlow(strongResult.data);
    console.log(`\nAgent action completed: ${agentResult.functionCalled}`);
    console.log(`Success: ${agentResult.success}`);
  }

  // Execute agent flow for potential fit (should flag for review)
  if (potentialResult.success && potentialResult.data) {
    console.log('\n--- Processing Potential Fit Candidate ---');
    const agentResult = await executeAgentFlow(potentialResult.data);
    console.log(`\nAgent action completed: ${agentResult.functionCalled}`);
    console.log(`Success: ${agentResult.success}`);
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     Demo Summary                              ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║ Key Takeaways:                                               ║');
  console.log('║                                                              ║');
  console.log('║ 1. SGR forces LLMs to follow a structured reasoning process  ║');
  console.log('║    - Each candidate is evaluated on multiple criteria        ║');
  console.log('║    - Evidence is required for each conclusion                ║');
  console.log('║                                                              ║');
  console.log('║ 2. Zod schemas ensure type-safe, validated output            ║');
  console.log('║    - Invalid data is caught before it enters your app        ║');
  console.log('║    - Enums constrain LLM to specific values                  ║');
  console.log('║                                                              ║');
  console.log('║ 3. Function calling enables automated workflows              ║');
  console.log('║    - Strong match -> Update ATS, schedule interview          ║');
  console.log('║    - Potential fit -> Flag for human review                  ║');
  console.log('║    - Not qualified -> Auto-reject with documented reasons    ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
