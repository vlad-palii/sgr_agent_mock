/**
 * testRealAPI.ts - Test Resume Screening with Real OpenAI API
 *
 * Run with:
 *   export OPENAI_API_KEY=your-api-key
 *   export USE_REAL_API=true
 *   npm run dev:real
 *
 * Or directly:
 *   OPENAI_API_KEY=your-key USE_REAL_API=true npx tsx src/testRealAPI.ts
 */

import {
  runResumeScreening,
  resetSimulationState
} from './LLMAgent.js';
import { defaultJob } from './examples/jobDescriptions.js';
import { strongMatchCandidate, potentialFitCandidate } from './examples/resumes.js';
import { openaiConfig } from './config.js';

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        Real OpenAI API Test - Resume Screening               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Check configuration
  console.log('Configuration:');
  console.log(`  USE_REAL_API: ${openaiConfig.useRealAPI}`);
  console.log(`  API Key set: ${openaiConfig.apiKey ? 'Yes' : 'No'}`);
  console.log('');

  if (!openaiConfig.useRealAPI) {
    console.log('⚠️  USE_REAL_API is not set to "true".');
    console.log('   Running in simulation mode.\n');
    console.log('   To use real API, run:');
    console.log('   export OPENAI_API_KEY=your-api-key');
    console.log('   export USE_REAL_API=true');
    console.log('   npx tsx src/testRealAPI.ts\n');
  }

  if (openaiConfig.useRealAPI && !openaiConfig.apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    console.log('   Set it with: export OPENAI_API_KEY=your-api-key');
    process.exit(1);
  }

  resetSimulationState();

  // Test 1: Strong Match Candidate
  console.log('┌────────────────────────────────────────────────────────────────┐');
  console.log('│ TEST 1: Screening Strong Match Candidate (Alex Chen)           │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}`);
  console.log(`Candidate: ${strongMatchCandidate.name}\n`);

  const startTime1 = Date.now();
  const result1 = await runResumeScreening(strongMatchCandidate, defaultJob);
  const duration1 = Date.now() - startTime1;

  if (result1.success && result1.data) {
    console.log('\n✅ Screening Successful!');
    console.log(`⏱️  Duration: ${duration1}ms\n`);
    console.log('--- Results ---');
    console.log(`Overall Fit: ${result1.data.overall_fit.toUpperCase()}`);
    console.log(`Fit Score: ${result1.data.fit_score}/100`);
    console.log(`Recommended Action: ${result1.data.recommended_action}`);
    console.log('\nScreening Steps:');
    result1.data.screening_steps.forEach(step => {
      const status = step.requirement_met ? '✓' : '✗';
      console.log(`  ${status} ${step.evaluation_category}: ${step.evidence.substring(0, 80)}...`);
    });
    console.log('\nStrengths:');
    result1.data.strengths.forEach(s => console.log(`  - ${s}`));
    if (result1.data.concerns.length > 0) {
      console.log('\nConcerns:');
      result1.data.concerns.forEach(c => console.log(`  - ${c}`));
    }
  } else {
    console.log('\n❌ Screening Failed');
    console.log(`Error: ${result1.error?.message}`);
  }

  // Test 2: Potential Fit Candidate (Career Changer)
  console.log('\n\n┌────────────────────────────────────────────────────────────────┐');
  console.log('│ TEST 2: Screening Career Changer (Jordan Martinez)             │');
  console.log('└────────────────────────────────────────────────────────────────┘');
  console.log(`Job: ${defaultJob.title}`);
  console.log(`Candidate: ${potentialFitCandidate.name}\n`);

  const startTime2 = Date.now();
  const result2 = await runResumeScreening(potentialFitCandidate, defaultJob);
  const duration2 = Date.now() - startTime2;

  if (result2.success && result2.data) {
    console.log('\n✅ Screening Successful!');
    console.log(`⏱️  Duration: ${duration2}ms\n`);
    console.log('--- Results ---');
    console.log(`Overall Fit: ${result2.data.overall_fit.toUpperCase()}`);
    console.log(`Fit Score: ${result2.data.fit_score}/100`);
    console.log(`Recommended Action: ${result2.data.recommended_action}`);
    console.log('\nScreening Steps:');
    result2.data.screening_steps.forEach(step => {
      const status = step.requirement_met ? '✓' : '✗';
      console.log(`  ${status} ${step.evaluation_category}: ${step.evidence.substring(0, 80)}...`);
    });
    console.log('\nStrengths:');
    result2.data.strengths.forEach(s => console.log(`  - ${s}`));
    if (result2.data.concerns.length > 0) {
      console.log('\nConcerns:');
      result2.data.concerns.forEach(c => console.log(`  - ${c}`));
    }
  } else {
    console.log('\n❌ Screening Failed');
    console.log(`Error: ${result2.error?.message}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       Test Complete                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

main().catch(console.error);
