import type { IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

interface ApiError {
	response?: { status?: number; data?: { detail?: string; message?: string } };
	statusCode?: number;
	httpCode?: number;
	context?: { data?: { detail?: string; message?: string } };
	message?: string;
}

export function handleApiError(context: IExecuteFunctions, error: unknown, itemIndex: number): void {
	const err = error as ApiError;
	const statusCode = err.response?.status || err.statusCode || err.httpCode;
	const errorMessage =
		err.context?.data?.detail ||
		err.response?.data?.detail ||
		err.response?.data?.message ||
		err.context?.data?.message ||
		err.message;

	if (statusCode === 429) {
		throw new NodeOperationError(
			context.getNode(),
			`Insufficient credits or rate limit exceeded. Please check your Picsart account balance. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode === 401 || statusCode === 403) {
		throw new NodeOperationError(
			context.getNode(),
			`Authentication failed. Please check your API key is valid. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
		throw new NodeOperationError(
			context.getNode(),
			`Client error: ${errorMessage || 'Invalid request parameters. Please check your input data.'}`,
			{ itemIndex }
		);
	} else if (statusCode !== undefined && statusCode >= 500) {
		throw new NodeOperationError(
			context.getNode(),
			`Picsart API server error (${statusCode}). Please try again later. ${errorMessage || ''}`,
			{ itemIndex }
		);
	} else {
		throw new NodeOperationError(
			context.getNode(),
			`Failed to process video: ${errorMessage || err.message}`,
			{ itemIndex }
		);
	}
}
