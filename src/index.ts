/**
 * Resume Screening with Schema-Guided Reasoning (SGR)
 *
 * This demo shows how to use OpenAI's Structured Outputs with Zod schemas
 * to create reliable, validated LLM responses for resume screening.
 *
 * Setup:
 *   1. Create a .env file with:
 *      OPENAI_API_KEY=your-api-key
 *      OPENAI_MODEL=gpt-4o-mini  (optional, defaults to gpt-4o)
 *
 *   2. Run: npm run dev
 */

import 'dotenv/config';

import { runResumeScreening, demonstrateSchemaGeneration } from './LLMAgent.js';
import { executeAgentFlow } from './AgentFlow.js';
import { defaultJob } from './examples/jobDescriptions.js';
import { strongMatchCandidate, potentialFitCandidate } from './examples/resumes.js';
import { openaiConfig } from './config.js';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     Resume Screening with Schema-Guided Reasoning (SGR)      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check configuration
  if (!openaiConfig.apiKey) {
    console.error('❌ OPENAI_API_KEY is not set.');
    console.log('\nCreate a .env file with:');
    console.log('  OPENAI_API_KEY=your-api-key');
    console.log('  OPENAI_MODEL=gpt-4o-mini  (optional)\n');
    process.exit(1);
  }

  console.log(`Model: ${openaiConfig.model || 'gpt-4o (default)'}\n`);

  // Show JSON Schema generation
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ JSON Schema Generation for Structured Outputs                  │');
  console.log('└────────────────────────────────────────────────────────────────┘\n');
  demonstrateSchemaGeneration();

  // Screen first candidate
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ Screening: Alex Chen (Strong Match Candidate)                  │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}\n`);

  const startTime1 = Date.now();
  const result1 = await runResumeScreening(strongMatchCandidate, defaultJob);
  const duration1 = Date.now() - startTime1;

  if (result1.success && result1.data) {
    console.log(`\n✅ Screening Complete (${duration1}ms)`);
    console.log(`   Tokens used: ${result1.metadata?.tokensUsed || 'unknown'}\n`);
    printResult(result1.data);

    // Execute agent flow
    console.log('\n--- Agent Actions ---');
    const agentResult = await executeAgentFlow(result1.data);
    console.log(`Action: ${agentResult.functionCalled} - ${agentResult.success ? 'Success' : 'Failed'}`);
  } else {
    console.log('\n❌ Screening Failed');
    console.log(`   Error: ${result1.error?.message}`);
  }

  // Screen second candidate
  console.log('\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ Screening: Jordan Martinez (Career Changer)                    │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}\n`);

  const startTime2 = Date.now();
  const result2 = await runResumeScreening(potentialFitCandidate, defaultJob);
  const duration2 = Date.now() - startTime2;

  if (result2.success && result2.data) {
    console.log(`\n✅ Screening Complete (${duration2}ms)`);
    console.log(`   Tokens used: ${result2.metadata?.tokensUsed || 'unknown'}\n`);
    printResult(result2.data);

    // Execute agent flow
    console.log('\n--- Agent Actions ---');
    const agentResult = await executeAgentFlow(result2.data);
    console.log(`Action: ${agentResult.functionCalled} - ${agentResult.success ? 'Success' : 'Failed'}`);
  } else {
    console.log('\n❌ Screening Failed');
    console.log(`   Error: ${result2.error?.message}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                        Demo Complete                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

function printResult(data: {
  overall_fit: string;
  fit_score: number;
  recommended_action: string;
  screening_steps: Array<{ evaluation_category: string; requirement_met: boolean; evidence: string }>;
  strengths: string[];
  concerns: string[];
}): void {
  console.log('--- Results ---');
  console.log(`Overall Fit: ${data.overall_fit.toUpperCase()}`);
  console.log(`Fit Score: ${data.fit_score}/100`);
  console.log(`Recommended Action: ${data.recommended_action}`);

  console.log('\nScreening Steps:');
  data.screening_steps.forEach(step => {
    const status = step.requirement_met ? '✓' : '✗';
    const evidence = step.evidence.length > 70 ? step.evidence.substring(0, 70) + '...' : step.evidence;
    console.log(`  ${status} ${step.evaluation_category}: ${evidence}`);
  });

  console.log('\nStrengths:');
  data.strengths.forEach(s => console.log(`  + ${s}`));

  if (data.concerns.length > 0) {
    console.log('\nConcerns:');
    data.concerns.forEach(c => console.log(`  - ${c}`));
  }
}

main().catch(console.error);
