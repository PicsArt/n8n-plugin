/** First status read is immediate; subsequent reads are rate limited. */
export async function waitBeforeGenerationPoll(attempt: number): Promise<void> {
	if (attempt > 0) await new Promise<void>((resolve) => setTimeout(resolve, 2000));
}
