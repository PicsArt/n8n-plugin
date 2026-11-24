export function https(value: unknown): string {
	if (typeof value !== 'string' || value !== value.trim()) throw Error('Use an HTTPS image URL');
	const u = new URL(value);
	if (u.protocol !== 'https:' || u.username || u.password || u.hash)
		throw Error('Use HTTPS without embedded credentials or a fragment');
	return value;
}
export function size(width: unknown, height: unknown): { width: number; height: number } {
	for (const v of [width, height])
		if (typeof v !== 'number' || !Number.isInteger(v) || v < 64 || v > 4096)
			throw Error(
				'Width and height must be integers from 64 to 4096; sizes are never rounded or substituted',
			);
	return { width: width as number, height: height as number };
}
export function catalogOptions(body: any): { name: string; value: string }[] {
	if (
		body?.status !== 'success' ||
		body.response?.status !== 'COMPLETED' ||
		!Array.isArray(body.response.result)
	)
		throw Error('Image-edit model discovery did not complete');
	const seen = new Set<string>();
	return body.response.result.map((r: any) => {
		if (
			typeof r?.model !== 'string' ||
			!r.model.startsWith('urn:') ||
			r.model !== r.model.trim() ||
			typeof r.name !== 'string' ||
			!r.name.trim() ||
			seen.has(r.model)
		)
			throw Error('Invalid image-edit model catalog');
		seen.add(r.model);
		return { name: r.name, value: r.model };
	});
}
function crc32(bytes: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}
export function pngDimensions(data: Buffer): { width: number; height: number } {
	if (
		data.length < 33 ||
		data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
		data.readUInt32BE(8) !== 13 ||
		data.toString('ascii', 12, 16) !== 'IHDR'
	)
		throw Error(
			'Result is not a PNG with a complete dimension header; retain the task ID and inspect the existing output',
		);
	const width = data.readUInt32BE(16),
		height = data.readUInt32BE(20);
	if (!width || !height) throw Error('Invalid PNG dimensions');
	// A dimension header alone is not an image. Verify the complete chunk envelope
	// before reporting dimensions; this is structural validation, not pixel decoding.
	let offset = 8;
	let imageData = false;
	let ended = false;
	while (offset < data.length) {
		if (data.length - offset < 12) throw Error('Truncated PNG chunk');
		const length = data.readUInt32BE(offset);
		if (length > data.length - offset - 12) throw Error('Truncated PNG chunk data');
		const type = data.toString('ascii', offset + 4, offset + 8);
		if (!/^[A-Za-z]{4}$/.test(type)) throw Error('Invalid PNG chunk type');
		if (offset !== 8 && type === 'IHDR') throw Error('Duplicate PNG dimension header');
		const end = offset + 8 + length;
		if (crc32(data.subarray(offset + 4, end)) !== data.readUInt32BE(end))
			throw Error('PNG chunk checksum mismatch');
		if (type === 'IDAT' && length > 0) imageData = true;
		offset = end + 4;
		if (type === 'IEND') {
			if (length !== 0 || !imageData || offset !== data.length) throw Error('Invalid PNG end');
			ended = true;
			break;
		}
	}
	if (!ended) throw Error('PNG image is incomplete');
	return { width, height };
}
