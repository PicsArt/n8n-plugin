import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { picsartCredentialType } from '../../authentication';
import { submissionResult } from './submissionResult';

/** Submit once; callers persist the ID and use Get Video Processing Result. */
export async function executeConcat(context: IExecuteFunctions, itemIndex: number, returnData: INodeExecutionData[]): Promise<void> {
 const input = context.getNodeParameter('videoUrls', itemIndex) as string;
 const urls = typeof input === 'string' ? input.split(/\r?\n/).map(value => value.trim()).filter(Boolean) : [];
 if (urls.length < 2 || urls.length > 10) throw new NodeOperationError(context.getNode(), 'Provide 2 to 10 video URLs in playback order', { itemIndex });
 for (const value of urls) {
  let url: URL;
  try { url = new URL(value); } catch { throw new NodeOperationError(context.getNode(), 'Every video must have a valid HTTPS URL', { itemIndex }); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new NodeOperationError(context.getNode(), 'Every video must have an HTTPS URL without embedded credentials', { itemIndex });
 }
 let transactionId: string | undefined;
 try {
  const response = await context.helpers.httpRequestWithAuthentication.call(context, picsartCredentialType(context), {
   method: 'POST', url: 'https://video-api.picsart.io/v1/concat',
   headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
   body: { items: urls.map(video_url => ({ video_url, transition: 'none' })), export: { format: 'MP4', frame_rate: 30 } },
  });
  transactionId = response?.transaction_id ?? response?.inference_id ?? response?.id ?? response?.job_id;
  if (typeof transactionId !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(transactionId)) throw new Error('Submission returned no valid transaction ID');
  submissionResult(response);
  returnData.push({ json: { id: transactionId, transaction_id: transactionId, status: response.status || 'submitted', completed: false }, pairedItem: { item: itemIndex } });
 } catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new NodeOperationError(context.getNode(), `${message}. ${transactionId ? `Preserve transaction ID: ${transactionId}. Retrieve this existing transaction.` : 'Submission was not confirmed; inspect existing jobs before retrying.'} Do not automatically resubmit.`, { itemIndex });
 }
}
