import SearchForm from './search-form';

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Buscar empresas</h1>
      <p className="text-sm text-zinc-600">Busca direta no Google Maps pelo Apify. Não precisa de CSV.</p>
      <SearchForm />
    </div>
  );
}
