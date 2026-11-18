import { NextResponse } from 'next/server';
import { auth } from '@/auth';

// Tudo exige login, exceto as telas de entrada/cadastro e as rotas do próprio Auth.js.
const PUBLIC_PREFIXES = ['/login', '/cadastro', '/api/auth'];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (req.auth) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }
  const url = new URL('/login', req.nextUrl);
  url.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
