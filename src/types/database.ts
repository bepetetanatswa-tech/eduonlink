export type UserRole = "student" | "teacher" | "parent" | "school_admin" | "super_admin";

export type FormLevel =
  | "ecd" | "grade1" | "grade2" | "grade3" | "grade4" | "grade5" | "grade6" | "grade7"
  | "form1" | "form2" | "form3" | "form4" | "form5" | "form6";

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  // Student
  form_level: FormLevel | null;
  school_id: string | null;
  school_name: string | null;
  province: string | null;
  school_type: "government" | "private" | "mission" | "international" | null;
  enrolled_subjects: string[] | null;
  // Teacher
  teaching_subjects: string[] | null;
  qualifications: string | null;
  bio: string | null;
  years_experience: number | null;
  qualification_docs: string[] | null;
  // Meta
  onboarding_completed: boolean;
  onboarding_step: number;
  email_verified: boolean;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  type: "government" | "private" | "mission" | "international";
  province: string | null;
  district: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  admin_id: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentChild {
  id: string;
  parent_id: string;
  child_id: string;
  verified: boolean;
  created_at: string;
}

// Minimal Supabase Database interface for type-safe clients
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      schools: {
        Row: School;
        Insert: Partial<School> & { name: string };
        Update: Partial<School>;
        Relationships: [];
      };
      parent_children: {
        Row: ParentChild;
        Insert: Omit<ParentChild, "id" | "created_at">;
        Update: Partial<ParentChild>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]?: { Row: Record<string, unknown> };
    };
    Functions: {
      [_ in never]?: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      user_role: UserRole;
      form_level: FormLevel;
    };
  };
}
