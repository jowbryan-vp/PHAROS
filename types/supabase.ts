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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
