"use client";

import { useActionState, useState } from "react";
import { saveLancamentoFatura } from "@/app/actions/lancamentos-fatura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { FormMessage } from "@/components/ui/form-message";

type Subcategoria = { id: string; nome: string };
type Categoria = { id: string; nome: string; subcategorias: Subcategoria[] };

export function LancamentoFaturaForm({
  faturaId,
  categorias,
  onDone,
}: {
  faturaId: string;
  categorias: Categoria[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveLancamentoFatura, undefined);
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id ?? "");
  const [ehParcelado, setEhParcelado] = useState(false);

  const subcategorias =
    categorias.find((c) => c.id === categoriaId)?.subcategorias ?? [];

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <input type="hidden" name="fatura_id" value={faturaId} />

      <div>
        <Label htmlFor="descricao">Descrição</Label>
        <Input id="descricao" name="descricao" required placeholder="Ex.: Supermercado" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="categoria_id">Categoria</Label>
          <Select
            id="categoria_id"
            name="categoria_id"
            required
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </div>
        {subcategorias.length > 0 && (
          <div>
            <Label htmlFor="subcategoria_id">Subcategoria (opcional)</Label>
            <Select id="subcategoria_id" name="subcategoria_id" defaultValue="">
              <option value="">Nenhuma</option>
              {subcategorias.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="valor">
            {ehParcelado ? "Valor total da compra" : "Valor"}
          </Label>
          <Input
            id="valor"
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0,00"
          />
        </div>
        {ehParcelado && (
          <div>
            <Label htmlFor="total_parcelas">Número de parcelas</Label>
            <Input
              id="total_parcelas"
              name="total_parcelas"
              type="number"
              min="2"
              max="60"
              required
              defaultValue={2}
            />
          </div>
        )}
      </div>

      <CheckboxField
        name="eh_parcelado"
        label="Compra parcelada"
        help="O valor total será dividido pelas próximas faturas, uma parcela por fatura."
        checked={ehParcelado}
        onChange={(e) => setEhParcelado(e.target.checked)}
      />

      <FormMessage error={state?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending || categorias.length === 0}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
