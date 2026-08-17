export function whatsappUrl(number, prefill = '') {
  const digits = String(number || '').replace(/\D/g, '');
  if (!digits) return '';
  const query = prefill ? `?text=${encodeURIComponent(prefill)}` : '';
  return `https://wa.me/${digits}${query}`;
}
