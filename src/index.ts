/**
 * Resume Screening with OpenAI Structured Outputs
 *
 * Usage:
 *   1. Create .env file with OPENAI_API_KEY=your-key
 *   2. Run: npm run dev
 */

import 'dotenv/config';

import { runResumeScreening } from './LLMAgent.js';
import { defaultJob } from './examples/jobDescriptions.js';
import { strongMatchCandidate, potentialFitCandidate } from './examples/resumes.js';
import { openaiConfig } from './config.js';

async function main(): Promise<void> {
  if (!openaiConfig.apiKey) {
    console.error('OPENAI_API_KEY is not set. Create a .env file with your key.');
    process.exit(1);
  }

  console.log(`Using model: ${openaiConfig.model || 'gpt-4o'}\n`);

  // Screen candidates
  const candidates = [strongMatchCandidate, potentialFitCandidate];

  for (const candidate of candidates) {
    console.log(`\nScreening: ${candidate.name}`);
    console.log('-'.repeat(50));

    const result = await runResumeScreening(candidate, defaultJob);

    if (result.success && result.data) {
      console.log(`Fit: ${result.data.overall_fit} (${result.data.fit_score}/100)`);
      console.log(`Action: ${result.data.recommended_action}`);
      console.log(`Tokens: ${result.metadata?.tokensUsed}`);
    } else {
      console.log(`Error: ${result.error?.message}`);
    }
  }
}

main().catch(console.error);
