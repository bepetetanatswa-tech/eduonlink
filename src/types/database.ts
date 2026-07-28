export type UserRole = "student" | "teacher" | "parent" | "school_admin" | "super_admin";
export type SubscriptionPlan = "free" | "basic" | "premium" | "enterprise";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type EnrollmentStatus = "active" | "inactive" | "suspended";
export type NotificationType = "info" | "warning" | "success" | "assignment" | "grade" | "announcement" | "message" | "payment";
export type PaymentStatus = "pending" | "approved" | "rejected" | "refunded";
export type SubjectLevel = "primary" | "olevel" | "alevel";
export type CurriculumType = "zimsec" | "cambridge" | "ib";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  province: string | null;
  district: string | null;
  town: string | null;
  bio: string | null;
  school_id: string | null;
  school_name: string | null;
  school_type: "government" | "private" | "mission" | "international" | null;
  form_level: string | null;
  enrolled_subjects: string[] | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  occupation: string | null;
  preferred_contact_method: "email" | "sms" | "whatsapp" | null;
  qualifications: string | null;
  years_experience: number | null;
  teaching_subjects: string[] | null;
  ztc_number: string | null;
  is_approved: boolean;
  teacher_rejection_reason: string | null;
  qualification_doc_key: string | null;
  id_doc_key: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
}

export interface ParentChild {
  id: string;
  parent_id: string;
  child_id: string;
  relationship: "mother" | "father" | "guardian" | "uncle" | "aunt" | "grandparent" | "other";
  status: "pending" | "confirmed" | "rejected";
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  address: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  subscription_plan: SubscriptionPlan;
  is_verified: boolean;
  admin_id: string | null;
  created_at: string;
}

export interface SchoolMember {
  id: string;
  school_id: string;
  user_id: string;
  role: UserRole;
  joined_at: string;
}

export interface Class {
  id: string;
  school_id: string | null;
  name: string;
  grade_level: string | null;
  subject: string | null;
  teacher_id: string | null;
  academic_year: string;
  join_code: string;
  created_at: string;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  level: SubjectLevel;
  curriculum_type: CurriculumType;
}

export interface Assignment {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_score: number;
  created_by: string | null;
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string | null;
  content: string | null;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string;
  subject_id: string | null;
  term: number;
  score: number | null;
  grade: string | null;
  academic_year: string;
}

export interface Attendance {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaymentVerification {
  id: string;
  user_id: string;
  transaction_id: string | null;
  phone_number: string | null;
  amount: number;
  status: PaymentStatus;
  verified_by: string | null;
  created_at: string;
}

export interface AIConversation {
  id: string;
  student_id: string;
  subject_id: string | null;
  messages: Record<string, unknown>[];
  created_at: string;
}

export interface Announcement {
  id: string;
  school_id: string | null;
  class_id: string | null;
  author_id: string | null;
  title: string;
  content: string;
  target_role: UserRole | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string | null;
  school_id: string | null;
  plan: SubscriptionPlan;
  status: "active" | "expired" | "cancelled";
  start_date: string;
  end_date: string | null;
  amount_paid: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      schools: {
        Row: School;
        Insert: Omit<School, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<School, "id">>;
        Relationships: [];
      };
      school_members: {
        Row: SchoolMember;
        Insert: Omit<SchoolMember, "id" | "joined_at"> & { id?: string };
        Update: Partial<Omit<SchoolMember, "id">>;
        Relationships: [];
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Class, "id">>;
        Relationships: [];
      };
      class_enrollments: {
        Row: ClassEnrollment;
        Insert: Omit<ClassEnrollment, "id" | "enrolled_at"> & { id?: string };
        Update: Partial<Omit<ClassEnrollment, "id">>;
        Relationships: [];
      };
      subjects: {
        Row: Subject;
        Insert: Omit<Subject, "id"> & { id?: string };
        Update: Partial<Omit<Subject, "id">>;
        Relationships: [];
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Assignment, "id">>;
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id"> & { id?: string };
        Update: Partial<Omit<Submission, "id">>;
        Relationships: [];
      };
      grades: {
        Row: Grade;
        Insert: Omit<Grade, "id"> & { id?: string };
        Update: Partial<Omit<Grade, "id">>;
        Relationships: [];
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, "id"> & { id?: string };
        Update: Partial<Omit<Attendance, "id">>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Notification, "id">>;
        Relationships: [];
      };
      payment_verifications: {
        Row: PaymentVerification;
        Insert: Omit<PaymentVerification, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<PaymentVerification, "id">>;
        Relationships: [];
      };
      ai_conversations: {
        Row: AIConversation;
        Insert: Omit<AIConversation, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<AIConversation, "id">>;
        Relationships: [];
      };
      announcements: {
        Row: Announcement;
        Insert: Omit<Announcement, "id" | "created_at"> & { id?: string };
        Update: Partial<Omit<Announcement, "id">>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, "id"> & { id?: string };
        Update: Partial<Omit<Subscription, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
