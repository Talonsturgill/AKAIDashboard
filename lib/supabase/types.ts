export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      archive_content: {
        Row: {
          author: string | null
          body: string
          body_embedding: string | null
          cover_image_url: string | null
          entities_mentioned: string[] | null
          external_id: string
          fetched_at: string | null
          franchise: string | null
          id: string
          published_at: string
          source_platform: string
          source_url: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          body: string
          body_embedding?: string | null
          cover_image_url?: string | null
          entities_mentioned?: string[] | null
          external_id: string
          fetched_at?: string | null
          franchise?: string | null
          id?: string
          published_at: string
          source_platform: string
          source_url: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          body?: string
          body_embedding?: string | null
          cover_image_url?: string | null
          entities_mentioned?: string[] | null
          external_id?: string
          fetched_at?: string | null
          franchise?: string | null
          id?: string
          published_at?: string
          source_platform?: string
          source_url?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          ai_relevance_score: number | null
          award_date: string | null
          awarding_entity_id: string | null
          contract_type: string | null
          contract_value: number | null
          created_at: string | null
          description: string | null
          external_id: string | null
          id: string
          metadata: Json | null
          period_of_performance: unknown
          solicitation_url: string | null
          source_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          winning_entity_id: string | null
        }
        Insert: {
          ai_relevance_score?: number | null
          award_date?: string | null
          awarding_entity_id?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          period_of_performance?: unknown
          solicitation_url?: string | null
          source_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          winning_entity_id?: string | null
        }
        Update: {
          ai_relevance_score?: number | null
          award_date?: string | null
          awarding_entity_id?: string | null
          contract_type?: string | null
          contract_value?: number | null
          created_at?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          metadata?: Json | null
          period_of_performance?: unknown
          solicitation_url?: string | null
          source_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          winning_entity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_awarding_entity_id_fkey"
            columns: ["awarding_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_winning_entity_id_fkey"
            columns: ["winning_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_metrics: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      entities: {
        Row: {
          aliases: string[] | null
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          last_mentioned_at: string | null
          mention_count: number | null
          metadata: Json | null
          name: string
          relevance_score: number | null
          slug: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number | null
          metadata?: Json | null
          name: string
          relevance_score?: number | null
          slug?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          last_mentioned_at?: string | null
          mention_count?: number | null
          metadata?: Json | null
          name?: string
          relevance_score?: number | null
          slug?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      infrastructure_projects: {
        Row: {
          announced_date: string | null
          capacity_metric: string | null
          capacity_value: number | null
          created_at: string | null
          estimated_cost: number | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          metadata: Json | null
          name: string
          operational_date: string | null
          operator_entity_id: string | null
          project_type: string | null
          source_urls: string[] | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          announced_date?: string | null
          capacity_metric?: string | null
          capacity_value?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          operational_date?: string | null
          operator_entity_id?: string | null
          project_type?: string | null
          source_urls?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          announced_date?: string | null
          capacity_metric?: string | null
          capacity_value?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          operational_date?: string | null
          operator_entity_id?: string | null
          project_type?: string | null
          source_urls?: string[] | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "infrastructure_projects_operator_entity_id_fkey"
            columns: ["operator_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          ai_relevance_score: number | null
          created_at: string | null
          description: string | null
          document_url: string | null
          external_id: string | null
          id: string
          introduced_date: string | null
          jurisdiction: string | null
          last_action_date: string | null
          metadata: Json | null
          policy_type: string | null
          sponsor_entity_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_relevance_score?: number | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          external_id?: string | null
          id?: string
          introduced_date?: string | null
          jurisdiction?: string | null
          last_action_date?: string | null
          metadata?: Json | null
          policy_type?: string | null
          sponsor_entity_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_relevance_score?: number | null
          created_at?: string | null
          description?: string | null
          document_url?: string | null
          external_id?: string | null
          id?: string
          introduced_date?: string | null
          jurisdiction?: string | null
          last_action_date?: string | null
          metadata?: Json | null
          policy_type?: string | null
          sponsor_entity_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_sponsor_entity_id_fkey"
            columns: ["sponsor_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          evidence_urls: string[] | null
          first_observed_at: string | null
          from_entity_id: string
          id: string
          last_observed_at: string | null
          metadata: Json | null
          relationship_type: string
          strength: number | null
          to_entity_id: string
        }
        Insert: {
          evidence_urls?: string[] | null
          first_observed_at?: string | null
          from_entity_id: string
          id?: string
          last_observed_at?: string | null
          metadata?: Json | null
          relationship_type: string
          strength?: number | null
          to_entity_id: string
        }
        Update: {
          evidence_urls?: string[] | null
          first_observed_at?: string | null
          from_entity_id?: string
          id?: string
          last_observed_at?: string | null
          metadata?: Json | null
          relationship_type?: string
          strength?: number | null
          to_entity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_runs: {
        Row: {
          completed_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          notes: string | null
          records_created: number | null
          records_processed: number | null
          records_updated: number | null
          routine_name: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          routine_name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          records_created?: number | null
          records_processed?: number | null
          records_updated?: number | null
          routine_name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          id: string
          last_polled_at: string | null
          last_success_at: string | null
          metadata: Json | null
          name: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          last_polled_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name: string
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          last_polled_at?: string | null
          last_success_at?: string | null
          metadata?: Json | null
          name?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      universal_search: {
        Args: {
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          id: string
          score: number
          snippet: string
          title: string
          type: string
          url_path: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
