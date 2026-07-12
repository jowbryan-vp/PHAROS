"use client";

import { useActionState } from "react";
import { saveSubcategoria } from "@/app/actions/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/ui/form-message";

type Subcategoria = { id: string; nome: string };

export function SubcategoriaForm({
  categoriaId,
  subcategoria,
  onDone,
}: {
  categoriaId: string;
  subcategoria?: Subcategoria;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveSubcategoria, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <input type="hidden" name="categoria_id" value={categoriaId} />
      {subcategoria && (
        <input type="hidden" name="id" value={subcategoria.id} />
      )}
      <div className="flex gap-2">
        <Input
          name="nome"
          required
          defaultValue={subcategoria?.nome}
          placeholder="Ex.: Supermercado, Padaria..."
        />
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDone}
          className="shrink-0"
        >
          Cancelar
        </Button>
      </div>
      <FormMessage error={state?.error} />
    </form>
  );
}
