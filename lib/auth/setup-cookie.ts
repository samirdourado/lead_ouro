// Cookie temporário que liga o navegador à conta em configuração de 2FA.
export const SETUP_COOKIE = 'lo_setup';

export function setupCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 20 * 60, // 20 minutos para terminar a configuração
  };
}
