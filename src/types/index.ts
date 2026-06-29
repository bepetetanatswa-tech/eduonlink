export type EducationLevel = "primary" | "o-level" | "a-level";

export type ZimsecForm = "form-1" | "form-2" | "form-3" | "form-4" | "form-5" | "form-6";

export type HbcStage =
  | "identification"
  | "investigation"
  | "design"
  | "implementation"
  | "evaluation"
  | "presentation";

export interface HbcProject {
  id: string;
  title: string;
  subject: string;
  form: ZimsecForm;
  currentStage: HbcStage;
  stages: {
    stage: HbcStage;
    completed: boolean;
    submittedAt?: string;
    feedback?: string;
  }[];
  studentId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  level: EducationLevel;
  forms: ZimsecForm[];
  topics: string[];
  isHbc: boolean;
}

export type UserRole = "student" | "teacher" | "parent" | "admin" | "school_admin";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  school?: string;
  form?: ZimsecForm;
  subjects?: string[];
  avatarUrl?: string;
  createdAt: string;
}

export interface StatItem {
  value: string;
  label: string;
  suffix?: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

export interface CurriculumLevel {
  name: string;
  description: string;
  forms: string;
  subjects: string[];
  color: string;
}
