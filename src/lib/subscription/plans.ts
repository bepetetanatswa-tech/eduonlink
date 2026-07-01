export interface PlanDefinition {
  key: string;
  name: string;
  price: number;
  role: "student" | "teacher" | "school";
  badge?: string;
  features: string[];
  lockedFeatures: string[];
  limits: {
    aiPerDay?: number;
    lessonsPerMonth?: number;
    liveClasses?: boolean;
    pdfDownload?: boolean;
    videoUpload?: boolean;
    aiTools?: boolean;
    maxClasses?: number;
    maxStudents?: number;
    maxTeachers?: number;
    customBranding?: boolean;
    prioritySupport?: boolean;
    earningsDashboard?: boolean;
    analytics?: boolean;
    trialDays?: number;
    assignments?: boolean;
    gradesView?: boolean;
    mockExams?: number;
    examPrep?: boolean;
  };
}

export const PLANS: PlanDefinition[] = [
  {
    key: "free_student",
    name: "Student Free",
    price: 0,
    role: "student",
    features: ["2 lessons/month", "3 AI questions/day", "View timetable"],
    lockedFeatures: [
      "Unlimited lessons", "Unlimited AI tutor", "Assignments & submissions",
      "Grade book access", "Live classes", "PDF downloads", "ZIMSEC exam prep", "Mock exams",
    ],
    limits: { aiPerDay: 3, lessonsPerMonth: 2, liveClasses: false, pdfDownload: false, assignments: false, gradesView: false, mockExams: 0, examPrep: false },
  },
  {
    key: "student_pro",
    name: "Student Pro",
    price: 5,
    role: "student",
    badge: "Most Popular",
    features: [
      "Unlimited lessons", "Unlimited AI tutor", "All assignments",
      "Full grade book", "Live classes", "PDF downloads", "Full exam prep", "3 mock exams/month", "Priority support",
    ],
    lockedFeatures: [],
    limits: { aiPerDay: -1, lessonsPerMonth: -1, liveClasses: true, pdfDownload: true, assignments: true, gradesView: true, mockExams: 3, examPrep: true, prioritySupport: true },
  },
  {
    key: "free_teacher",
    name: "Teacher Free",
    price: 0,
    role: "teacher",
    features: ["1 class only", "Basic lesson creation (text only)", "View student list"],
    lockedFeatures: [
      "Multiple classes", "Video upload", "AI lesson builder", "Grade book", "Attendance marking",
      "Assignment creation", "Earnings dashboard", "Analytics",
    ],
    limits: { maxClasses: 1, videoUpload: false, aiTools: false },
  },
  {
    key: "teacher_pro",
    name: "Teacher Pro",
    price: 10,
    role: "teacher",
    badge: "Best Value",
    features: [
      "Unlimited classes", "Video upload & embed", "AI lesson builder",
      "Full grade book", "Attendance system", "Assignment engine", "Earnings dashboard", "Advanced analytics", "Priority support",
    ],
    lockedFeatures: [],
    limits: { maxClasses: -1, videoUpload: true, aiTools: true, earningsDashboard: true, analytics: true, prioritySupport: true },
  },
  {
    key: "free_school",
    name: "School Free Trial",
    price: 0,
    role: "school",
    features: ["7-day trial", "3 students max", "1 teacher max", "Basic features only"],
    lockedFeatures: ["More than 3 students", "Multiple teachers", "Full analytics", "Timetable editor", "Broadcast messaging"],
    limits: { maxStudents: 3, maxTeachers: 1, trialDays: 7 },
  },
  {
    key: "school_starter",
    name: "School Starter",
    price: 30,
    role: "school",
    features: ["50 students", "5 teachers", "Core features", "Email support"],
    lockedFeatures: ["Analytics dashboard", "Priority support"],
    limits: { maxStudents: 50, maxTeachers: 5 },
  },
  {
    key: "school_standard",
    name: "School Standard",
    price: 60,
    role: "school",
    badge: "Most Popular",
    features: ["200 students", "20 teachers", "All features", "Analytics dashboard", "Priority support"],
    lockedFeatures: [],
    limits: { maxStudents: 200, maxTeachers: 20, analytics: true, prioritySupport: true },
  },
  {
    key: "school_pro",
    name: "School Pro",
    price: 100,
    role: "school",
    features: ["500 students", "Unlimited teachers", "All features", "Advanced analytics", "Priority support"],
    lockedFeatures: [],
    limits: { maxStudents: 500, maxTeachers: -1, analytics: true, prioritySupport: true },
  },
  {
    key: "school_enterprise",
    name: "School Enterprise",
    price: 200,
    role: "school",
    features: ["Unlimited students & teachers", "Custom branding", "Dedicated support", "Custom integrations"],
    lockedFeatures: [],
    limits: { maxStudents: -1, maxTeachers: -1, customBranding: true, prioritySupport: true },
  },
];

export interface CreditPack {
  key: string;
  name: string;
  price: number;
  description: string;
  emoji: string;
  creditType: "ai_questions" | "mock_exams" | "pdf_downloads" | "certificates" | "school_seats";
  amount: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  { key: "ai_50", name: "AI Top-Up", price: 1, description: "50 extra AI tutor questions", emoji: "🤖", creditType: "ai_questions", amount: 50 },
  { key: "ai_200", name: "AI Bundle", price: 3, description: "200 extra AI tutor questions", emoji: "🤖", creditType: "ai_questions", amount: 200 },
  { key: "mock_3", name: "Mock Exam Pack", price: 1, description: "3 timed ZIMSEC mock exams", emoji: "📝", creditType: "mock_exams", amount: 3 },
  { key: "mock_10", name: "Mock Exam Bundle", price: 3, description: "10 timed ZIMSEC mock exams", emoji: "📝", creditType: "mock_exams", amount: 10 },
  { key: "pdf_10", name: "PDF Download Pack", price: 1, description: "10 resource PDF downloads", emoji: "📄", creditType: "pdf_downloads", amount: 10 },
  { key: "cert_1", name: "Achievement Certificate", price: 1, description: "Generate 1 verified achievement certificate", emoji: "🏆", creditType: "certificates", amount: 1 },
  { key: "cert_5", name: "Certificate Bundle", price: 4, description: "5 achievement certificates", emoji: "🏆", creditType: "certificates", amount: 5 },
  { key: "school_seats_10", name: "10 Extra Seats", price: 8, description: "Add 10 extra student seats to your school plan", emoji: "🏫", creditType: "school_seats", amount: 10 },
];

export function getPlan(key: string): PlanDefinition {
  return PLANS.find((p) => p.key === key) ?? PLANS[0];
}

export function getPlansForRole(role: "student" | "teacher" | "school"): PlanDefinition[] {
  return PLANS.filter((p) => p.role === role);
}

export const ECOCASH_NUMBER = "0785910379";
export const ECOCASH_NAME = "Tanatswa Bepete";
