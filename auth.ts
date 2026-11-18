import NextAuth, { CredentialsSignin } from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { isAllowedEmail } from '@/lib/auth/allowlist';
import { verifyPassword } from '@/lib/auth/password';
import { findUserByEmail } from '@/lib/auth/users';
import { verifyTotp } from '@/lib/auth/totp';

const NINETY_DAYS = 90 * 24 * 60 * 60;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
    // Sessão longa: o cookie persiste mesmo fechando o navegador.
    // updateAge renova o prazo a cada dia de uso, então quem usa todo dia não precisa logar de novo.
    maxAge: NINETY_DAYS,
    updateAge: 24 * 60 * 60,
  },
  pages: { signIn: '/login' },
  providers: [
    Google,
    Credentials({
      id: 'credentials',
      name: 'Senha e código',
      credentials: {
        email: { label: 'E-mail' },
        password: { label: 'Senha', type: 'password' },
        code: { label: 'Código do app' },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        if (!isAllowedEmail(email)) throw new CredentialsSignin();

        const user = await findUserByEmail(email);
        if (!user || !user.password_hash || !user.totp_secret || !user.totp_enabled) {
          throw new CredentialsSignin();
        }

        const passwordOk = await verifyPassword(String(credentials?.password ?? ''), user.password_hash);
        const codeOk = verifyTotp(user.totp_secret, String(credentials?.code ?? ''));
        if (!passwordOk || !codeOk) throw new CredentialsSignin();

        return { id: String(user.id), email: user.email, name: user.name ?? user.email };
      },
    }),
  ],
  callbacks: {
    // Login com Google só entra se o e-mail for permitido e verificado pelo Google.
    async signIn({ user, account, profile }) {
      if (!isAllowedEmail(user.email)) return false;
      if (account?.provider === 'google' && profile?.email_verified !== true) return false;
      return true;
    },
  },
});
