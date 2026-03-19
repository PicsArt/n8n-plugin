// Buffer type for Node.js (available at runtime)
declare const Buffer: {
	from(data: string | Uint8Array): any;
	isBuffer(obj: any): boolean;
	concat(buffers: any[]): any;
};

/**
 * Build multipart/form-data body manually (n8n Cloud doesn't allow form-data package)
 */
export function buildMultipartFormData(fields: Record<string, string | any | { data: any; filename?: string; contentType?: string }>): { body: any; contentType: string } {
	const BufferClass = Buffer;
	const boundary = `----n8n-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
	const parts: any[] = [];

	for (const [key, value] of Object.entries(fields)) {
		parts.push(BufferClass.from(`--${boundary}\r\n`));

		if (BufferClass.isBuffer && BufferClass.isBuffer(value)) {
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"; filename="image.png"\r\n`));
			parts.push(BufferClass.from(`Content-Type: application/octet-stream\r\n\r\n`));
			parts.push(value);
		} else if (typeof value === 'object' && value !== null && 'data' in value) {
			const fileData = value as { data: any; filename?: string; contentType?: string };
			const filename = fileData.filename || 'image.png';
			const contentType = fileData.contentType || 'application/octet-stream';
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"; filename="${filename}"\r\n`));
			parts.push(BufferClass.from(`Content-Type: ${contentType}\r\n\r\n`));
			parts.push(fileData.data);
		} else {
			parts.push(BufferClass.from(`Content-Disposition: form-data; name="${key}"\r\n\r\n`));
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
