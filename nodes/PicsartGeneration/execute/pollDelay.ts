import { sleep } from 'n8n-workflow';

/** First status read is immediate; subsequent reads are rate limited. */
export async function waitBeforeGenerationPoll(attempt: number): Promise<void> {
	if (attempt > 0) await sleep(2000);
}
