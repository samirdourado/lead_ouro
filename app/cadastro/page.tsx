import Link from 'next/link';
import RegisterForm from './register-form';

export default function CadastroPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 rounded-lg border border-zinc-200 bg-white p-6">
      <div>
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-zinc-500">
          Só e-mails autorizados podem se cadastrar. Depois você configura o código do app autenticador.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-zinc-500">
        Já tem conta? <Link href="/login" className="font-medium text-amber-700 underline">Entrar</Link>
      </p>
    </div>
  );
}
