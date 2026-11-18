import { auth } from '@/auth';
import { logout } from '@/app/login/actions';

// Lê a sessão no servidor. Só renderiza o botão Sair quando há usuário logado.
export default async function SessionLogout() {
  const session = await auth();
  if (!session) return null;

  return (
    <form action={logout} className="ml-auto">
      <button type="submit" className="text-zinc-500 hover:text-zinc-900 hover:underline">
        Sair
      </button>
    </form>
  );
}
