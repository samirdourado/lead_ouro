// Converte telefone brasileiro para o formato wa.me: 55 + DDD + número (somente dígitos).
// Aceita "+55 11 96977-4605", "+5511969774605", "(11) 96977-4605", "11969774605".
// Retorna null se não houver número plausível.
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  // DDD (2 dígitos) + número fixo (8) ou celular (9, começando com 9)
  if (!/^[1-9]{2}(9\d{8}|[2-5]\d{7})$/.test(digits)) return null;
  return `55${digits}`;
}

// Celular brasileiro: após o DDD, o número começa com 9.
export function isMobile(waNumber: string | null): boolean {
  return !!waNumber && /^55[1-9]{2}9\d{8}$/.test(waNumber);
}

export function cleanName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

// Nome curto para a mensagem: o Google costuma trazer "Nome | Especialidade" ou "Nome - Cidade".
export function shortBusinessName(raw: string): string {
  const cleaned = cleanName(raw);
  const short = cleaned.split(/\s+\|\s+|\s+-\s+/)[0]?.trim();
  return short || cleaned;
}
