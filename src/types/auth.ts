import { z } from "zod";
import type { UserRole } from "./database";

export type FormLevel =
  | "ecd" | "grade1" | "grade2" | "grade3" | "grade4" | "grade5" | "grade6" | "grade7"
  | "form1" | "form2" | "form3" | "form4" | "form5" | "form6";

export const SUPER_ADMIN_EMAIL = "bepetetanatswa@gmail.com";

// ── Zod schemas ──────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const baseRegisterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["student", "teacher", "parent", "school_admin"] as const),
  agreeToTerms: z.boolean().refine((v) => v, "You must agree to the terms"),
});

export const studentRegisterSchema = baseRegisterSchema.extend({
  role: z.literal("student"),
  formLevel: z.string().min(1, "Select your grade/form level"),
  schoolName: z.string().optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

export const teacherRegisterSchema = baseRegisterSchema.extend({
  role: z.literal("teacher"),
  teachingSubjects: z.array(z.string()).min(1, "Select at least one subject"),
  yearsExperience: z.number().min(0).max(50),
  qualifications: z.string().min(1, "Enter your qualifications"),
  ztcNumber: z.string().min(1, "Enter your Zimbabwe Teachers Council (ZTC) registration number"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

export const parentRegisterSchema = baseRegisterSchema.extend({
  role: z.literal("parent"),
  childEmail: z.string().email("Enter your child's email (they must already have a VOA account)").optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

export const schoolAdminRegisterSchema = baseRegisterSchema.extend({
  role: z.literal("school_admin"),
  schoolName: z.string().min(2, "Enter your school name"),
  province: z.string().min(1, "Select a province"),
  schoolType: z.enum(["government", "private", "mission", "international"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match", path: ["confirmPassword"],
});

// ── Inferred types ──────────────────────────────────────────────

export type LoginInput         = z.infer<typeof loginSchema>;
export type MagicLinkInput     = z.infer<typeof magicLinkSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type StudentRegisterInput    = z.infer<typeof studentRegisterSchema>;
export type TeacherRegisterInput    = z.infer<typeof teacherRegisterSchema>;
export type ParentRegisterInput     = z.infer<typeof parentRegisterSchema>;
export type SchoolAdminRegisterInput = z.infer<typeof schoolAdminRegisterSchema>;

export type RegisterInput =
  | StudentRegisterInput
  | TeacherRegisterInput
  | ParentRegisterInput
  | SchoolAdminRegisterInput;

// ── Constants ────────────────────────────────────────────────────

export const FORM_LEVELS: { value: FormLevel; label: string; group: string }[] = [
  { value: "ecd",    label: "ECD",    group: "Primary" },
  { value: "grade1", label: "Grade 1",group: "Primary" },
  { value: "grade2", label: "Grade 2",group: "Primary" },
  { value: "grade3", label: "Grade 3",group: "Primary" },
  { value: "grade4", label: "Grade 4",group: "Primary" },
  { value: "grade5", label: "Grade 5",group: "Primary" },
  { value: "grade6", label: "Grade 6",group: "Primary" },
  { value: "grade7", label: "Grade 7",group: "Primary" },
  { value: "form1",  label: "Form 1", group: "O-Level" },
  { value: "form2",  label: "Form 2", group: "O-Level" },
  { value: "form3",  label: "Form 3", group: "O-Level" },
  { value: "form4",  label: "Form 4", group: "O-Level" },
  { value: "form5",  label: "Form 5", group: "A-Level" },
  { value: "form6",  label: "Form 6", group: "A-Level" },
];

export const ZIMSEC_SUBJECTS = [
  "Mathematics","English Language","Combined Science","Physics","Chemistry",
  "Biology","Geography","History","Commerce","Accounts","Business Studies",
  "Economics","Shona","Ndebele","French","Computer Science","Agriculture",
  "Food & Nutrition","Art & Craft","Music","Physical Education","Divinity",
  "Environmental Science","Social Studies","Heritage Studies",
  "Pure Mathematics","Statistics","English Literature",
];

export const PROVINCES = [
  "Harare","Bulawayo","Mashonaland East","Mashonaland West","Mashonaland Central",
  "Matabeleland North","Matabeleland South","Midlands","Masvingo","Manicaland",
];

export const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "male",             label: "Male" },
  { value: "female",           label: "Female" },
  { value: "other",            label: "Other" },
  { value: "prefer_not_to_say",label: "Prefer not to say" },
];

export const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: "mother",     label: "Mother" },
  { value: "father",     label: "Father" },
  { value: "guardian",   label: "Guardian" },
  { value: "uncle",      label: "Uncle" },
  { value: "aunt",       label: "Aunt" },
  { value: "grandparent",label: "Grandparent" },
  { value: "other",      label: "Other" },
];

export const CONTACT_METHOD_OPTIONS: { value: string; label: string }[] = [
  { value: "email",    label: "Email" },
  { value: "sms",       label: "SMS" },
  { value: "whatsapp",  label: "WhatsApp" },
];

export const ROLE_META: Record<
  "student" | "teacher" | "parent" | "school_admin",
  { icon: string; label: string; description: string; accent: string }
> = {
  student:      { icon: "🎓", label: "Student",      description: "I want to learn and ace my ZIMSEC exams",              accent: "#4D7FFF" },
  teacher:      { icon: "👨‍🏫", label: "Teacher",      description: "I teach and want to create lessons, track my students", accent: "#F5A623" },
  parent:       { icon: "👨‍👩‍👧", label: "Parent",       description: "I want to monitor my child's academic progress",       accent: "#00E5A3" },
  school_admin: { icon: "🏫", label: "School Admin", description: "I manage a school and want to deploy VOA institution-wide", accent: "#A78BFA" },
};

export type RegisterRole = "student" | "teacher" | "parent" | "school_admin";
export type { UserRole };
