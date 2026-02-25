export interface VideoApiResult {
	status?: string;
	data?: { url?: string; message?: string };
	url?: string;
	result?: { url?: string };
	message?: string;
	error?: string;
	transaction_id?: string;
	inference_id?: string;
	id?: string;
	job_id?: string;
}

export interface HttpError {
	statusCode?: number;
	response?: { status?: number };
}
