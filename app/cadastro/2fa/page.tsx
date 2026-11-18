import { cookies } from 'next/headers';
import Link from 'next/link';
import QRCode from 'qrcode';
import { findUserBySetupToken } from '@/lib/auth/users';
import { totpUri } from '@/lib/auth/totp';
import { SETUP_COOKIE } from '@/lib/auth/setup-cookie';
import TotpForm from './totp-form';

// Lê o cookie de configuração a cada acesso (não pré-renderiza).
export const instant = false;

export default async function Setup2faPage() {
  const token = (await cookies()).get(SETUP_COOKIE)?.value;
  const user = token ? await findUserBySetupToken(token) : null;

  if (!user || !user.totp_secret) {
    return (
      <div className="mx-auto max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Cadastro expirado</h1>
        <p className="text-sm text-zinc-500">O tempo para configurar o 2FA acabou. Comece o cadastro de novo.</p>
        <Link href="/cadastro" className="font-medium text-amber-700 underline">Voltar ao cadastro</Link>
      </div>
    );
  }

  const uri = totpUri(user.email, user.totp_secret);
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });

  return (
    <div className="mx-auto max-w-sm space-y-5 rounded-lg border border-zinc-200 bg-white p-6">
      <div>
        <h1 className="text-xl font-semibold">Configurar o código de segurança</h1>
        <p className="text-sm text-zinc-500">
          Abra o Google Authenticator (ou similar) no celular, escolha “Escanear QR code” e aponte para a imagem.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt="QR code para o app autenticador" width={220} height={220} className="mx-auto" />
      <details className="text-sm text-zinc-600">
        <summary className="cursor-pointer">Não consegue escanear? Digite a chave</summary>
        <p className="mt-2 break-all rounded-md bg-zinc-50 p-2 font-mono text-xs text-zinc-900">{user.totp_secret}</p>
      </details>
      <TotpForm />
    </div>
  );
}
