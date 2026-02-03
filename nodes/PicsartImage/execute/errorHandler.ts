import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export function handleApiError(context: IExecuteFunctions, error: any, itemIndex: number): void {
	const statusCode = error.response?.status || error.statusCode || error.httpCode;
	const errorMessage =
		error.context?.data?.detail ||
		error.response?.data?.detail ||
		error.response?.data?.message ||
		error.context?.data?.message ||
		error.message;

	if (statusCode === 429) {
		// Rate limit exceeded - user has insufficient credits
		throw new NodeOperationError(
			context.getNode(),
			`Insufficient credits or rate limit exceeded. Please check your Picsart account balance. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode === 401 || statusCode === 403) {
		// Authentication/Authorization error
		throw new NodeOperationError(
			context.getNode(),
			`Authentication failed. Please check your API key is valid. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode >= 400 && statusCode < 500) {
		// Client error (400-499) - user's fault
		throw new NodeOperationError(
			context.getNode(),
			`Client error: ${errorMessage || 'Invalid request parameters. Please check your input data.'}`,
			{ itemIndex }
		);
	} else if (statusCode >= 500) {
		// Server error (500-599) - Picsart API issue
		throw new NodeOperationError(
			context.getNode(),
			`Picsart API server error (${statusCode}). Please try again later. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else {
		// Unknown error
		throw new NodeOperationError(
			context.getNode(),
			`Failed to process image: ${errorMessage || error.message}`,
			{ itemIndex }
		);
	}
}
