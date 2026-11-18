import LoginForm from './login-form';

// Lê parâmetros da URL a cada acesso (não pré-renderiza).
export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cadastrado?: string; error?: string }> }) {
  const sp = await searchParams;
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
      <div>
        <h1 className="text-xl font-semibold">Entrar no Lead Ouro</h1>
        <p className="text-sm text-zinc-500">Acesso restrito à Dourado Comunicação.</p>
      </div>
      {sp.cadastrado && (
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">Conta criada. Entre com sua senha e o código do app.</p>
      )}
      {sp.error === 'AccessDenied' && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">Este e-mail não tem permissão de acesso.</p>
      )}
      <LoginForm googleEnabled={googleEnabled} />
    </div>
  );
}
