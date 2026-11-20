/** Metadata for the export formats exposed by the native video nodes. */
export function videoOutputMetadata(stem: string, format: string): { fileName: string; mimeType: string } {
 const formats: Record<string, { extension: string; mimeType: string }> = {
  MP4: { extension: 'mp4', mimeType: 'video/mp4' },
  MOV: { extension: 'mov', mimeType: 'video/quicktime' },
  WEBM: { extension: 'webm', mimeType: 'video/webm' },
  GIF: { extension: 'gif', mimeType: 'image/gif' },
 };
 const output = formats[format.toUpperCase()];
 if (!output) throw new Error('Unsupported video export format: ' + format);
 return { fileName: stem + '.' + output.extension, mimeType: output.mimeType };
}
