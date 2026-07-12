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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
