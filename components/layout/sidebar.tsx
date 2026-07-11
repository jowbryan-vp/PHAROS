const PLACEHOLDER_ITEMS = [
  "Início",
  "Receitas",
  "Contas",
  "Cartões",
  "Cofrinhos",
  "Categorias",
];

export function Sidebar() {
  return (
    <nav className="hidden w-56 shrink-0 border-r border-neutral-200 bg-white p-4 md:block">
      <ul className="flex flex-col gap-1">
        {PLACEHOLDER_ITEMS.map((item) => (
          <li
            key={item}
            className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-neutral-400"
            title="Disponível em uma etapa futura"
          >
            {item}
          </li>
        ))}
      </ul>
    </nav>
  );
}
