export type ModoFinanceiro = "ciclo" | "calendario";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string | null;
          email: string | null;
          modo_financeiro: ModoFinanceiro | null;
          onboarding_completo: boolean;
          criado_em: string;
        };
        Insert: {
          id: string;
          nome?: string | null;
          email?: string | null;
          modo_financeiro?: ModoFinanceiro | null;
          onboarding_completo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string | null;
          email?: string | null;
          modo_financeiro?: ModoFinanceiro | null;
          onboarding_completo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      fontes_receita: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          is_principal: boolean;
          tributavel_padrao: boolean;
          is_recorrente: boolean;
          valor_esperado: number | null;
          dia_esperado: number | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          is_principal?: boolean;
          tributavel_padrao?: boolean;
          is_recorrente?: boolean;
          valor_esperado?: number | null;
          dia_esperado?: number | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          is_principal?: boolean;
          tributavel_padrao?: boolean;
          is_recorrente?: boolean;
          valor_esperado?: number | null;
          dia_esperado?: number | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      contas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          criado_em?: string;
        };
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          is_recorrente: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          is_recorrente?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          is_recorrente?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      subcategorias: {
        Row: {
          id: string;
          categoria_id: string;
          nome: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          categoria_id: string;
          nome: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          categoria_id?: string;
          nome?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subcategorias_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      receitas: {
        Row: {
          id: string;
          user_id: string;
          fonte_receita_id: string;
          conta_id: string;
          valor: number;
          data_recebimento: string;
          tributavel: boolean;
          observacao: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fonte_receita_id: string;
          conta_id: string;
          valor: number;
          data_recebimento: string;
          tributavel: boolean;
          observacao?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fonte_receita_id?: string;
          conta_id?: string;
          valor?: number;
          data_recebimento?: string;
          tributavel?: boolean;
          observacao?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receitas_fonte_receita_id_fkey";
            columns: ["fonte_receita_id"];
            isOneToOne: false;
            referencedRelation: "fontes_receita";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receitas_conta_id_fkey";
            columns: ["conta_id"];
            isOneToOne: false;
            referencedRelation: "contas";
            referencedColumns: ["id"];
          },
        ];
      };
      ciclos: {
        Row: {
          id: string;
          user_id: string;
          data_inicio: string;
          data_fim: string | null;
          receita_ancora_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          data_inicio: string;
          data_fim?: string | null;
          receita_ancora_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          data_inicio?: string;
          data_fim?: string | null;
          receita_ancora_id?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ciclos_receita_ancora_id_fkey";
            columns: ["receita_ancora_id"];
            isOneToOne: false;
            referencedRelation: "receitas";
            referencedColumns: ["id"];
          },
        ];
      };
      receitas_recorrentes_lancamentos: {
        Row: {
          id: string;
          user_id: string;
          fonte_receita_id: string;
          ciclo_id: string | null;
          periodo_referencia: string;
          valor_esperado: number;
          status: "pendente" | "recebido";
          receita_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fonte_receita_id: string;
          ciclo_id?: string | null;
          periodo_referencia: string;
          valor_esperado: number;
          status?: "pendente" | "recebido";
          receita_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fonte_receita_id?: string;
          ciclo_id?: string | null;
          periodo_referencia?: string;
          valor_esperado?: number;
          status?: "pendente" | "recebido";
          receita_id?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receitas_recorrentes_lancamentos_fonte_receita_id_fkey";
            columns: ["fonte_receita_id"];
            isOneToOne: false;
            referencedRelation: "fontes_receita";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receitas_recorrentes_lancamentos_ciclo_id_fkey";
            columns: ["ciclo_id"];
            isOneToOne: false;
            referencedRelation: "ciclos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "receitas_recorrentes_lancamentos_receita_id_fkey";
            columns: ["receita_id"];
            isOneToOne: false;
            referencedRelation: "receitas";
            referencedColumns: ["id"];
          },
        ];
      };
      cartoes: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          dia_fechamento: number;
          dia_vencimento: number;
          conta_pagamento_padrao_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          dia_fechamento: number;
          dia_vencimento: number;
          conta_pagamento_padrao_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          dia_fechamento?: number;
          dia_vencimento?: number;
          conta_pagamento_padrao_id?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cartoes_conta_pagamento_padrao_id_fkey";
            columns: ["conta_pagamento_padrao_id"];
            isOneToOne: false;
            referencedRelation: "contas";
            referencedColumns: ["id"];
          },
        ];
      };
      faturas: {
        Row: {
          id: string;
          cartao_id: string;
          periodo_inicio: string;
          periodo_fim: string;
          data_vencimento: string;
          status: "aberta" | "fechada" | "paga";
          conta_pagamento_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          cartao_id: string;
          periodo_inicio: string;
          periodo_fim: string;
          data_vencimento: string;
          status?: "aberta" | "fechada" | "paga";
          conta_pagamento_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          cartao_id?: string;
          periodo_inicio?: string;
          periodo_fim?: string;
          data_vencimento?: string;
          status?: "aberta" | "fechada" | "paga";
          conta_pagamento_id?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "faturas_cartao_id_fkey";
            columns: ["cartao_id"];
            isOneToOne: false;
            referencedRelation: "cartoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faturas_conta_pagamento_id_fkey";
            columns: ["conta_pagamento_id"];
            isOneToOne: false;
            referencedRelation: "contas";
            referencedColumns: ["id"];
          },
        ];
      };
      lancamentos_fatura: {
        Row: {
          id: string;
          fatura_id: string;
          descricao: string;
          valor: number;
          categoria_id: string;
          subcategoria_id: string | null;
          eh_parcelado: boolean;
          parcela_atual: number | null;
          total_parcelas: number | null;
          compra_original_id: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          fatura_id: string;
          descricao: string;
          valor: number;
          categoria_id: string;
          subcategoria_id?: string | null;
          eh_parcelado?: boolean;
          parcela_atual?: number | null;
          total_parcelas?: number | null;
          compra_original_id?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          fatura_id?: string;
          descricao?: string;
          valor?: number;
          categoria_id?: string;
          subcategoria_id?: string | null;
          eh_parcelado?: boolean;
          parcela_atual?: number | null;
          total_parcelas?: number | null;
          compra_original_id?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lancamentos_fatura_fatura_id_fkey";
            columns: ["fatura_id"];
            isOneToOne: false;
            referencedRelation: "faturas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lancamentos_fatura_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lancamentos_fatura_subcategoria_id_fkey";
            columns: ["subcategoria_id"];
            isOneToOne: false;
            referencedRelation: "subcategorias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lancamentos_fatura_compra_original_id_fkey";
            columns: ["compra_original_id"];
            isOneToOne: false;
            referencedRelation: "lancamentos_fatura";
            referencedColumns: ["id"];
          },
        ];
      };
      gastos_fixos: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          valor: number;
          dia_vencimento: number;
          conta_pagamento_padrao_id: string | null;
          categoria_id: string;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          valor: number;
          dia_vencimento: number;
          conta_pagamento_padrao_id?: string | null;
          categoria_id: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nome?: string;
          valor?: number;
          dia_vencimento?: number;
          conta_pagamento_padrao_id?: string | null;
          categoria_id?: string;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gastos_fixos_conta_pagamento_padrao_id_fkey";
            columns: ["conta_pagamento_padrao_id"];
            isOneToOne: false;
            referencedRelation: "contas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gastos_fixos_categoria_id_fkey";
            columns: ["categoria_id"];
            isOneToOne: false;
            referencedRelation: "categorias";
            referencedColumns: ["id"];
          },
        ];
      };
      gastos_fixos_lancamentos: {
        Row: {
          id: string;
          user_id: string;
          gasto_fixo_id: string;
          ciclo_id: string | null;
          periodo_referencia: string;
          valor: number;
          status: "pendente" | "pago";
          conta_pagamento_id: string | null;
          data_pagamento: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          gasto_fixo_id: string;
          ciclo_id?: string | null;
          periodo_referencia: string;
          valor: number;
          status?: "pendente" | "pago";
          conta_pagamento_id?: string | null;
          data_pagamento?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          gasto_fixo_id?: string;
          ciclo_id?: string | null;
          periodo_referencia?: string;
          valor?: number;
          status?: "pendente" | "pago";
          conta_pagamento_id?: string | null;
          data_pagamento?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gastos_fixos_lancamentos_gasto_fixo_id_fkey";
            columns: ["gasto_fixo_id"];
            isOneToOne: false;
            referencedRelation: "gastos_fixos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gastos_fixos_lancamentos_ciclo_id_fkey";
            columns: ["ciclo_id"];
            isOneToOne: false;
            referencedRelation: "ciclos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gastos_fixos_lancamentos_conta_pagamento_id_fkey";
            columns: ["conta_pagamento_id"];
            isOneToOne: false;
            referencedRelation: "contas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
