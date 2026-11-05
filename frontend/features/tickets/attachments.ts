// Keep aligned with Laravel config/ticket_attachments.php.
export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "txt", "doc", "docx"];
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

export function validateAttachments(files: File[]): string | null {
  if (files.length > MAX_ATTACHMENTS) return `Choose up to ${MAX_ATTACHMENTS} attachments.`;
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name} exceeds the 5 MB per-file limit.`;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ATTACHMENT_EXTENSIONS.includes(extension)) return `${file.name}: choose PDF, PNG, JPG/JPEG, TXT, DOC or DOCX.`;
  }
  return null;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
