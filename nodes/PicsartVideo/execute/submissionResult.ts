import type { VideoApiResult } from './types';

// Legacy synchronous responses omit status. Explicit async states must never
// expose a URL as completed output, even when the service includes one.
export function submissionResult(response: VideoApiResult): VideoApiResult {
 const status = response.status?.toLowerCase();
 if (status === undefined || status === 'success' || status === 'completed') return response;
 if (['failed', 'error', 'canceled', 'cancelled'].includes(status)) {
  throw new Error('Video submission failed; inspect the accepted task before retrying');
 }
 if (!['accepted', 'submitted', 'pending', 'queued', 'processing', 'running', 'in_progress'].includes(status)) {
  throw new Error('Unknown video submission status; inspect the accepted task before retrying');
 }
 return {...response, url: undefined, data: response.data ? {...response.data, url: undefined} : undefined,
  result: response.result ? {...response.result, url: undefined} : undefined};
}
