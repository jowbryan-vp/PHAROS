"use client";

import { useActionState } from "react";
import { saveCategoria } from "@/app/actions/categorias";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";

type Categoria = { id: string; nome: string; is_recorrente: boolean };

export function CategoriaForm({
  categoria,
  onDone,
}: {
  categoria?: Categoria;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveCategoria, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {categoria && <input type="hidden" name="id" value={categoria.id} />}
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={categoria?.nome}
          placeholder="Ex.: Mercado, Transporte, Lazer..."
        />
      </div>
      <CheckboxField
        name="is_recorrente"
        label="Categoria recorrente"
        help="Marque para categorias de gasto recorrente como Mercado ou Gasolina — isso alimenta a futura média de gasto variável (Etapa 9)."
        defaultChecked={categoria?.is_recorrente}
      />
      <FormMessage error={state?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
