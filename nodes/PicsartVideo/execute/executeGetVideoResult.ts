import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import type { IExecuteFunctions, INodeExecutionData, JsonObject } from 'n8n-workflow';
import { picsartCredentialType } from '../../authentication';
import { handleApiError } from './errorHandler';
import type { VideoApiResult, HttpError } from './types';

/** Read one saved transaction. Never submit processing or poll implicitly. */
export async function executeGetVideoResult(context: IExecuteFunctions, itemIndex: number, output: INodeExecutionData[]): Promise<void> {
 const id = context.getNodeParameter('transactionId', itemIndex) as string;
 if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(id)) {
  throw new NodeOperationError(context.getNode(), 'A valid saved video transaction ID is required', { itemIndex });
 }
 try {
  let result: VideoApiResult;
  try {
   result = await context.helpers.httpRequestWithAuthentication.call(context, picsartCredentialType(context), {
    method: 'GET', url: 'https://video-api.picsart.io/v1/video/' + encodeURIComponent(id),
    headers: { Accept: 'application/json' },
   });
  } catch (error) {
   const http = error as HttpError;
   if (http.statusCode === 404 || http.response?.status === 404) {
    output.push({json: {id, transaction_id: id, status: 'not_found', completed: false}, pairedItem: {item: itemIndex}});
    return;
   }
   throw new NodeApiError(context.getNode(), error as JsonObject, { itemIndex });
  }
  if (result.transaction_id !== undefined && result.transaction_id !== id) {
   throw new NodeOperationError(context.getNode(), 'Video result transaction ID does not match the requested job', { itemIndex });
  }
  const status = result.status;
  const completed = status === 'success' || status === 'completed';
  if (!completed && !['accepted','pending','processing','queued','submitted','running','in_progress'].includes(status ?? '')) {
   throw new NodeOperationError(context.getNode(), 'Video task failed or returned an unknown status', { itemIndex });
  }
  let video_url: string | undefined;
  if (completed) {
   video_url = result.data?.url ?? result.url ?? result.result?.url;
   if (typeof video_url !== 'string') {
    throw new NodeOperationError(context.getNode(), 'Completed video output URL must be a string', { itemIndex });
   }
   let url: URL;
   try { url = new URL(video_url ?? ''); } catch {
    throw new NodeOperationError(context.getNode(), 'Completed video has no valid output URL', { itemIndex });
   }
   if (url.protocol !== 'https:' || url.username || url.password) {
    throw new NodeOperationError(context.getNode(), 'Video result must be an HTTPS URL without credentials', { itemIndex });
   }
  }
  output.push({json: {id, transaction_id: id, status: completed ? 'success' : status!, completed, ...(completed ? {video_url} : {})}, pairedItem: {item: itemIndex}});
 } catch (error) {
  handleApiError(context, error, itemIndex, id);
 }
}
