"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoriaForm } from "@/components/features/categoria-form";
import { CategoriaItem } from "@/components/features/categoria-item";

type Subcategoria = { id: string; nome: string };
type Categoria = {
  id: string;
  nome: string;
  is_recorrente: boolean;
  subcategorias: Subcategoria[];
};

export function CategoriasManager({ categorias }: { categorias: Categoria[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold text-foreground">
          Categorias
        </h1>
        {!creating && (
          <Button onClick={() => setCreating(true)}>Nova categoria</Button>
        )}
      </div>

      {creating && <CategoriaForm onDone={() => setCreating(false)} />}

      {categorias.length === 0 && !creating && (
        <EmptyState
          title="Nenhuma categoria ainda"
          description="Organize seus gastos por categoria (e subcategoria) para acompanhar melhor pra onde vai seu dinheiro."
          action={<Button onClick={() => setCreating(true)}>Criar a primeira</Button>}
        />
      )}

      <ul className="flex flex-col gap-3">
        {categorias.map((categoria) => (
          <CategoriaItem key={categoria.id} categoria={categoria} />
        ))}
      </ul>
    </div>
  );
}
