"use client";

import { useActionState } from "react";
import { saveCartao } from "@/app/actions/cartoes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/ui/form-message";

type Conta = { id: string; nome: string };
type Cartao = {
  id: string;
  nome: string;
  dia_fechamento: number;
  dia_vencimento: number;
  conta_pagamento_padrao_id: string | null;
};

export function CartaoForm({
  cartao,
  contas,
  onDone,
}: {
  cartao?: Cartao;
  contas: Conta[];
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(saveCartao, undefined);

  return (
    <form
      action={async (formData) => {
        await action(formData);
        onDone();
      }}
      className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800"
    >
      {cartao && <input type="hidden" name="id" value={cartao.id} />}

      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          required
          defaultValue={cartao?.nome}
          placeholder="Ex.: Nubank, Inter, C6..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="dia_fechamento">Dia de fechamento</Label>
          <Input
            id="dia_fechamento"
            name="dia_fechamento"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={cartao?.dia_fechamento}
          />
        </div>
        <div>
          <Label htmlFor="dia_vencimento">Dia de vencimento</Label>
          <Input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={cartao?.dia_vencimento}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="conta_pagamento_padrao_id">
          Conta de pagamento padrão (opcional)
        </Label>
        <Select
          id="conta_pagamento_padrao_id"
          name="conta_pagamento_padrao_id"
          defaultValue={cartao?.conta_pagamento_padrao_id ?? ""}
        >
          <option value="">Nenhuma</option>
          {contas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </Select>
      </div>

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
