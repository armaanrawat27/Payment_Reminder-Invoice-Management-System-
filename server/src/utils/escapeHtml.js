export function escapeHtml(unsafeString) {
  if (unsafeString === null || unsafeString === undefined) {
    return '';
  }

  return String(unsafeString)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
