declare const Buffer: {
	from(data: string | Uint8Array): Uint8Array;
	isBuffer(obj: unknown): obj is Uint8Array;
	concat(buffers: Uint8Array[]): Uint8Array;
};

type FileFieldValue =
	| string
	| Uint8Array
	| { data: Uint8Array | unknown; filename?: string; contentType?: string };

function safeHeaderValue(value: string): string {
	if (/[\x00-\x1f\x7f]/.test(value)) {
		throw new Error('Multipart header metadata must not contain control characters');
	}
	return value;
}

function quotedHeaderValue(value: string): string {
	return safeHeaderValue(value).replace(/"/g, '%22').replace(/\\/g, '%5C');
}

/**
 * Build multipart/form-data body manually (n8n Cloud doesn't allow form-data package)
 */
export function buildMultipartFormData(fields: Record<string, FileFieldValue>): { body: Uint8Array; contentType: string } {
	const BufferClass = Buffer;
	const boundary = `----n8n-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	const parts: Uint8Array[] = [];

	for (const [key, value] of Object.entries(fields)) {
		const fieldName = quotedHeaderValue(key);
		parts.push(BufferClass.from(`--${boundary}\r\n`));

		if (BufferClass.isBuffer(value)) {
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${fieldName}"; filename="image.png"\r\n`));
			parts.push(BufferClass.from(`Content-Type: application/octet-stream\r\n\r\n`));
			parts.push(value);
		} else if (typeof value === 'object' && value !== null && 'data' in value) {
			const fileData = value as { data: Uint8Array; filename?: string; contentType?: string };
			const filename = quotedHeaderValue(fileData.filename || 'image.png');
			const contentType = safeHeaderValue(fileData.contentType || 'application/octet-stream');
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n`));
			parts.push(BufferClass.from(`Content-Type: ${contentType}\r\n\r\n`));
			parts.push(fileData.data);
		} else {
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${fieldName}"\r\n\r\n`));
			parts.push(BufferClass.from(String(value)));
		}
		parts.push(BufferClass.from(`\r\n`));
	}

	parts.push(BufferClass.from(`--${boundary}--\r\n`));

	return {
		body: BufferClass.concat(parts),
		contentType: `multipart/form-data; boundary=${boundary}`,
	};
}
