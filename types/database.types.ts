export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    email: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            workspaces: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at: string
                    active_framework: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at?: string
                    active_framework?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                    created_at?: string
                    active_framework?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspaces_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            workspace_members: {
                Row: {
                    id: string
                    workspace_id: string
                    user_id: string
                    role: 'admin' | 'member' | 'viewer'
                    joined_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    user_id: string
                    role?: 'admin' | 'member' | 'viewer'
                    joined_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    user_id?: string
                    role?: 'admin' | 'member' | 'viewer'
                    joined_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_members_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "workspace_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            feature_requests: {
                Row: {
                    id: string
                    workspace_id: string
                    title: string
                    description: string | null
                    submitted_by: string
                    status: 'backlog' | 'now' | 'next' | 'later' | 'shipped'
                    reach: number
                    impact: number
                    confidence: number
                    effort: number
                    rice_score: number | null
                    tags: string[]
                    created_at: string
                    shipped_at: string | null
                    // ICE
                    ice_impact: number | null
                    ice_confidence: number | null
                    ice_ease: number | null
                    ice_score: number | null
                    // MoSCoW
                    moscow_category: 'must_have' | 'should_have' | 'could_have' | 'wont_have' | null
                    moscow_rationale: string | null
                    // JTBD
                    jtbd_job_statement: string | null
                    jtbd_importance: number | null
                    jtbd_satisfaction: number | null
                    jtbd_opportunity_score: number | null
                    // Kano
                    kano_category: 'must_be' | 'one_dimensional' | 'attractive' | 'indifferent' | 'reverse' | 'questionable' | null
                    kano_functional_response: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_dysfunctional_response: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_satisfaction_score: number | null
                    // Impact/Effort
                    ie_impact: number | null
                    ie_effort: number | null
                    ie_quadrant: 'quick_win' | 'major_project' | 'fill_in' | 'thankless_task' | null
                    // WSJF
                    wsjf_user_business_value: number | null
                    wsjf_time_criticality: number | null
                    wsjf_risk_reduction: number | null
                    wsjf_job_size: number | null
                    wsjf_score: number | null
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    title: string
                    description?: string | null
                    submitted_by: string
                    status?: 'backlog' | 'now' | 'next' | 'later' | 'shipped'
                    reach?: number
                    impact?: number
                    confidence?: number
                    effort?: number
                    rice_score?: number | null
                    tags?: string[]
                    created_at?: string
                    shipped_at?: string | null
                    ice_impact?: number | null
                    ice_confidence?: number | null
                    ice_ease?: number | null
                    ice_score?: number | null
                    moscow_category?: 'must_have' | 'should_have' | 'could_have' | 'wont_have' | null
                    moscow_rationale?: string | null
                    jtbd_job_statement?: string | null
                    jtbd_importance?: number | null
                    jtbd_satisfaction?: number | null
                    jtbd_opportunity_score?: number | null
                    kano_category?: 'must_be' | 'one_dimensional' | 'attractive' | 'indifferent' | 'reverse' | 'questionable' | null
                    kano_functional_response?: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_dysfunctional_response?: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_satisfaction_score?: number | null
                    ie_impact?: number | null
                    ie_effort?: number | null
                    ie_quadrant?: 'quick_win' | 'major_project' | 'fill_in' | 'thankless_task' | null
                    wsjf_user_business_value?: number | null
                    wsjf_time_criticality?: number | null
                    wsjf_risk_reduction?: number | null
                    wsjf_job_size?: number | null
                    wsjf_score?: number | null
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    title?: string
                    description?: string | null
                    submitted_by?: string
                    status?: 'backlog' | 'now' | 'next' | 'later' | 'shipped'
                    reach?: number
                    impact?: number
                    confidence?: number
                    effort?: number
                    rice_score?: number | null
                    tags?: string[]
                    created_at?: string
                    shipped_at?: string | null
                    ice_impact?: number | null
                    ice_confidence?: number | null
                    ice_ease?: number | null
                    ice_score?: number | null
                    moscow_category?: 'must_have' | 'should_have' | 'could_have' | 'wont_have' | null
                    moscow_rationale?: string | null
                    jtbd_job_statement?: string | null
                    jtbd_importance?: number | null
                    jtbd_satisfaction?: number | null
                    jtbd_opportunity_score?: number | null
                    kano_category?: 'must_be' | 'one_dimensional' | 'attractive' | 'indifferent' | 'reverse' | 'questionable' | null
                    kano_functional_response?: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_dysfunctional_response?: 'like' | 'expect' | 'neutral' | 'tolerate' | 'dislike' | null
                    kano_satisfaction_score?: number | null
                    ie_impact?: number | null
                    ie_effort?: number | null
                    ie_quadrant?: 'quick_win' | 'major_project' | 'fill_in' | 'thankless_task' | null
                    wsjf_user_business_value?: number | null
                    wsjf_time_criticality?: number | null
                    wsjf_risk_reduction?: number | null
                    wsjf_job_size?: number | null
                    wsjf_score?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "feature_requests_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "feature_requests_submitted_by_fkey"
                        columns: ["submitted_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            votes: {
                Row: {
                    id: string
                    feature_request_id: string
                    user_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    feature_request_id: string
                    user_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    feature_request_id?: string
                    user_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "votes_feature_request_id_fkey"
                        columns: ["feature_request_id"]
                        isOneToOne: false
                        referencedRelation: "feature_requests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "votes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            comments: {
                Row: {
                    id: string
                    feature_request_id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    feature_request_id: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    feature_request_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "comments_feature_request_id_fkey"
                        columns: ["feature_request_id"]
                        isOneToOne: false
                        referencedRelation: "feature_requests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "comments_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            workspace_integrations: {
                Row: {
                    id: string
                    workspace_id: string
                    provider: 'notion' | 'linear' | 'jira'
                    config: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    provider: 'notion' | 'linear' | 'jira'
                    config: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    workspace_id?: string
                    provider?: 'notion' | 'linear' | 'jira'
                    config?: Json
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "workspace_integrations_workspace_id_fkey"
                        columns: ["workspace_id"]
                        isOneToOne: false
                        referencedRelation: "workspaces"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
        CompositeTypes: Record<string, never>
    }
}

export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']

export type Profile = Tables<'profiles'>
export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'>
export type FeatureRequest = Tables<'feature_requests'>
export type Vote = Tables<'votes'>
export type Comment = Tables<'comments'>

export type FeatureRequestWithDetails = FeatureRequest & {
    profiles: Profile | null
    votes: Vote[]
    vote_count: number
    user_has_voted: boolean
}

export type WorkspaceMemberWithProfile = WorkspaceMember & {
    profiles: Profile | null
}
