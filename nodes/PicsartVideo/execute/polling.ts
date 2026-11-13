// Bound retries and space every retry, including temporary 404 responses.
export const maxPollAttempts = 300;
export async function waitBeforeVideoPoll(attempt: number): Promise<void> {
	if (attempt > 0) await new Promise<void>((resolve) => setTimeout(resolve, 2000));
}
