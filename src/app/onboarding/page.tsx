"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FormInput, FormSelect } from "@/components/auth/FormInput";
import { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SchoolLogoUpload } from "@/components/profile/SchoolLogoUpload";
import {
  FORM_LEVELS, ZIMSEC_SUBJECTS, PROVINCES,
  GENDER_OPTIONS, RELATIONSHIP_OPTIONS, CONTACT_METHOD_OPTIONS,
} from "@/types/auth";
import { getPlansForRole } from "@/lib/subscription/plans";
import type { Profile } from "@/types/database";

type ChildLink = {
  id: string;
  relationship: string;
  status: string;
  child: { id: string; full_name: string; email: string };
};

type School = { id: string; name: string };

const STEP_META: Record<string, { title: string; subtitle: string }> = {
  welcome:  { title: "Welcome to VOA 🎓", subtitle: "Let's finish setting up your profile — it only takes a couple of minutes." },
  basics:   { title: "Tell us about yourself", subtitle: "This helps us personalise your experience." },
  address:  { title: "Where are you based?", subtitle: "Used for school matching and local content." },
  student:  { title: "Your school details", subtitle: "So we can tailor lessons to your level." },
  parent:   { title: "Your family", subtitle: "Link your children's accounts and set your preferences." },
  school:   { title: "Register your school", subtitle: "A few final details, then we'll submit it for verification." },
  done:     { title: "You're all set!", subtitle: "Your profile is ready. Let's start learning." },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [step, setStep] = useState(0);

  // Local form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");

  // Student
  const [schoolChoice, setSchoolChoice] = useState(""); // school id or "other"
  const [schoolNameManual, setSchoolNameManual] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Parent
  const [occupation, setOccupation] = useState("");
  const [contactMethod, setContactMethod] = useState("");
  const [childEmail, setChildEmail] = useState("");
  const [childRelationship, setChildRelationship] = useState("guardian");
  const [linkingChild, setLinkingChild] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // School admin
  const [schoolAddress, setSchoolAddress] = useState("");
  const [schoolPhone, setSchoolPhone] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [schoolWebsite, setSchoolWebsite] = useState("");
  const [schoolLogoUrl, setSchoolLogoUrl] = useState<string | null>(null);
  const [schoolPlan, setSchoolPlan] = useState("free_school");
  const schoolPlans = getPlansForRole("school");

  const steps = useMemo(() => {
    if (profile?.role === "student") return ["welcome", "basics", "address", "student", "done"];
    if (profile?.role === "parent") return ["welcome", "basics", "address", "parent", "done"];
    if (profile?.role === "school_admin") return ["welcome", "basics", "address", "school", "done"];
    return ["welcome", "basics", "address", "done"];
  }, [profile?.role]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const p: Profile = data.profile;
      setProfile(p);
      setUserId(p.user_id);
      setChildren(data.children ?? []);
      setSchools(data.availableSchools ?? []);

      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
      setAvatarUrl(p.avatar_url);
      setDob(p.date_of_birth ?? "");
      setGender(p.gender ?? "");
      setPhone(p.phone ?? "");
      setBio(p.bio ?? "");
      setProvince(p.province ?? "");
      setDistrict(p.district ?? "");
      setTown(p.town ?? "");
      setSchoolChoice(p.school_id ?? (p.school_name ? "other" : ""));
      setSchoolNameManual(p.school_name ?? "");
      setFormLevel(p.form_level ?? "");
      setSubjects(p.enrolled_subjects ?? []);
      setGuardianName(p.guardian_name ?? "");
      setGuardianPhone(p.guardian_phone ?? "");
      setEmergencyName(p.emergency_contact_name ?? "");
      setEmergencyPhone(p.emergency_contact_phone ?? "");
      setOccupation(p.occupation ?? "");
      setContactMethod(p.preferred_contact_method ?? "");

      const mySchool = data.mySchool as { address: string | null; phone: string | null; email: string | null; website: string | null; logo_url: string | null; subscription_plan: string | null } | null;
      if (mySchool) {
        setSchoolAddress(mySchool.address ?? "");
        setSchoolPhone(mySchool.phone ?? "");
        setSchoolEmail(mySchool.email ?? "");
        setSchoolWebsite(mySchool.website ?? "");
        setSchoolLogoUrl(mySchool.logo_url);
        setSchoolPlan(mySchool.subscription_plan ?? "free_school");
      }

      const maxStep = (p.role === "student" || p.role === "parent" || p.role === "school_admin") ? 4 : 3;
      setStep(Math.min(p.onboarding_step ?? 0, maxStep));
      setLoading(false);
    })();
  }, []);

  const patch = async (fields: Record<string, unknown>) => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to save. Please try again.");
    }
    return res.json();
  };

  const toggleSubject = (s: string) =>
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const currentKey = steps[step];

  const handleNext = async () => {
    setError(null);

    if (currentKey === "student" && !formLevel) {
      setError("Please select your grade/form level.");
      return;
    }

    setSaving(true);
    try {
      const fields: Record<string, unknown> = { onboarding_step: step + 1 };

      if (currentKey === "basics") {
        Object.assign(fields, {
          first_name: firstName, last_name: lastName,
          date_of_birth: dob || null, gender: gender || null,
          phone: phone || null, bio: bio || null,
        });
      }
      if (currentKey === "address") {
        Object.assign(fields, { province: province || null, district: district || null, town: town || null });
      }
      if (currentKey === "student") {
        Object.assign(fields, {
          school_id: schoolChoice && schoolChoice !== "other" ? schoolChoice : null,
          school_name: schoolChoice === "other" ? schoolNameManual : (schools.find((s) => s.id === schoolChoice)?.name ?? null),
          form_level: formLevel,
          enrolled_subjects: subjects,
          guardian_name: guardianName || null,
          guardian_phone: guardianPhone || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
        });
      }
      if (currentKey === "parent") {
        Object.assign(fields, {
          occupation: occupation || null,
          preferred_contact_method: contactMethod || null,
        });
      }

      if (currentKey === "school") {
        const res = await fetch("/api/school/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: schoolAddress || null,
            phone: schoolPhone || null,
            email: schoolEmail || null,
            website: schoolWebsite || null,
            logoUrl: schoolLogoUrl,
            subscriptionPlan: schoolPlan,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Could not submit your school for verification.");
        }
      }

      await patch(fields);
      setStep((s) => s + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      await patch({ onboarding_completed: true, onboarding_step: steps.length });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  };

  const handleLinkChild = async () => {
    setLinkError(null);
    if (!childEmail.trim()) return;
    setLinkingChild(true);
    try {
      const res = await fetch("/api/profile/link-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: childEmail.trim(), relationship: childRelationship }),
      });
      const data = await res.json();
      if (!res.ok) { setLinkError(data.error ?? "Could not link child."); return; }
      setChildren((prev) => [...prev, data.link]);
      setChildEmail("");
    } catch {
      setLinkError("Could not link child. Please try again.");
    } finally {
      setLinkingChild(false);
    }
  };

  const handleUnlinkChild = async (id: string) => {
    setChildren((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/profile/link-child?id=${id}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p style={{ color: "#4A5170", fontSize: 14 }}>Loading your profile…</p>
      </div>
    );
  }

  const meta = STEP_META[currentKey];

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{ width: i === step ? 24 : 8, height: 8, background: i <= step ? "#4D7FFF" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentKey}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-center mb-8">
              <h1 className="font-display font-bold text-white text-2xl mb-2">{meta.title}</h1>
              <p className="text-sm max-w-sm mx-auto" style={{ color: "#6B7290" }}>{meta.subtitle}</p>
            </div>

            <AuthError message={error} />

            <div
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: "rgba(11,12,19,0.8)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
            >
              {currentKey === "welcome" && (
                <div className="text-center py-4" style={{ color: "#8892B0", fontSize: 14, lineHeight: 1.7 }}>
                  We just need a few details to personalise Sir Taks AI, your lessons, and your dashboard.
                  You can update any of this later from your profile.
                </div>
              )}

              {currentKey === "basics" && (
                <>
                  <AvatarUpload userId={userId} currentUrl={avatarUrl} name={`${firstName} ${lastName}`} onUploaded={setAvatarUrl} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    <FormInput label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Date of birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
                    <FormSelect label="Gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Prefer not to say</option>
                      {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </FormSelect>
                  </div>
                  <FormInput label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+263 7XX XXX XXX" />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium" style={{ color: "#8892B0" }}>Short bio (optional)</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A sentence or two about yourself"
                      className="w-full rounded-xl text-sm text-white outline-none p-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontFamily: "DM Sans, sans-serif", resize: "vertical" }}
                    />
                  </div>
                </>
              )}

              {currentKey === "address" && (
                <>
                  <FormSelect label="Province" value={province} onChange={(e) => setProvince(e.target.value)}>
                    <option value="" disabled>Select a province</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </FormSelect>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="District" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Goromonzi" />
                    <FormInput label="Town / suburb" value={town} onChange={(e) => setTown(e.target.value)} placeholder="e.g. Borrowdale" />
                  </div>
                </>
              )}

              {currentKey === "student" && (
                <>
                  <FormSelect label="Current school" value={schoolChoice} onChange={(e) => setSchoolChoice(e.target.value)}>
                    <option value="">Not listed / prefer to type</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    <option value="other">Other — type manually</option>
                  </FormSelect>
                  {(schoolChoice === "other" || schoolChoice === "") && (
                    <FormInput label="School name" value={schoolNameManual} onChange={(e) => setSchoolNameManual(e.target.value)} placeholder="e.g. Harare High School" />
                  )}
                  <FormSelect label="Grade / form level" value={formLevel} onChange={(e) => setFormLevel(e.target.value)}>
                    <option value="" disabled>Select your level</option>
                    {["Primary", "O-Level", "A-Level"].map((group) => (
                      <optgroup key={group} label={group}>
                        {FORM_LEVELS.filter((f) => f.group === group).map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </optgroup>
                    ))}
                  </FormSelect>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium" style={{ color: "#8892B0" }}>
                      Subjects enrolled <span className="text-xs font-normal ml-1" style={{ color: "#4A5170" }}>({subjects.length} selected)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {ZIMSEC_SUBJECTS.map((s) => {
                        const active = subjects.includes(s);
                        return (
                          <button
                            key={s} type="button" onClick={() => toggleSubject(s)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                            style={{
                              background: active ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.04)",
                              border: `1px solid ${active ? "rgba(77,127,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                              color: active ? "#7AA5FF" : "#4A5170",
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Parent/Guardian name" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                    <FormInput label="Parent/Guardian phone" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="Emergency contact name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                    <FormInput label="Emergency contact phone" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                  </div>
                </>
              )}

              {currentKey === "parent" && (
                <>
                  <FormInput label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                  <FormSelect label="Preferred contact method" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
                    <option value="">Select one</option>
                    {CONTACT_METHOD_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </FormSelect>

                  <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                  <div>
                    <p className="text-sm font-medium mb-2" style={{ color: "#8892B0" }}>Linked children</p>
                    {children.length === 0 && <p className="text-xs mb-3" style={{ color: "#4A5170" }}>No children linked yet.</p>}
                    <div className="flex flex-col gap-2 mb-3">
                      {children.map((c) => (
                        <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div>
                            <p className="text-sm" style={{ color: "#CDD6F4" }}>{c.child.full_name}</p>
                            <p className="text-xs" style={{ color: "#4A5170" }}>{c.child.email} · {c.relationship}</p>
                          </div>
                          <button type="button" onClick={() => handleUnlinkChild(c.id)} className="text-xs" style={{ color: "#FF6B6B" }}>Remove</button>
                        </div>
                      ))}
                    </div>
                    {linkError && <p className="text-xs mb-2" style={{ color: "#F87171" }}>{linkError}</p>}
                    <div className="flex gap-2">
                      <input
                        value={childEmail} onChange={(e) => setChildEmail(e.target.value)}
                        placeholder="Child's email address" type="email"
                        className="flex-1 h-11 rounded-xl text-sm text-white outline-none px-3"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      />
                      <select
                        value={childRelationship} onChange={(e) => setChildRelationship(e.target.value)}
                        className="h-11 rounded-xl text-sm text-white outline-none px-2"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      >
                        {RELATIONSHIP_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button
                        type="button" onClick={handleLinkChild} disabled={linkingChild}
                        className="h-11 px-4 rounded-xl text-sm font-semibold"
                        style={{ background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.3)", color: "#00E5A3" }}
                      >
                        {linkingChild ? "Linking…" : "Link"}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {currentKey === "school" && (
                <>
                  <SchoolLogoUpload userId={userId} currentUrl={schoolLogoUrl} schoolName={profile?.school_name ?? ""} onUploaded={setSchoolLogoUrl} />
                  <FormInput label="School address" value={schoolAddress} onChange={(e) => setSchoolAddress(e.target.value)} placeholder="e.g. 123 Samora Machel Ave, Harare CBD" />
                  <div className="grid grid-cols-2 gap-3">
                    <FormInput label="School phone" type="tel" value={schoolPhone} onChange={(e) => setSchoolPhone(e.target.value)} placeholder="+263 7XX XXX XXX" />
                    <FormInput label="School email" type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} placeholder="info@yourschool.co.zw" />
                  </div>
                  <FormInput label="School website (optional)" value={schoolWebsite} onChange={(e) => setSchoolWebsite(e.target.value)} placeholder="https://yourschool.co.zw" />

                  <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

                  <p className="text-sm font-medium" style={{ color: "#8892B0" }}>Choose a plan</p>
                  <div className="flex flex-col gap-2">
                    {schoolPlans.map((p) => {
                      const active = schoolPlan === p.key;
                      return (
                        <button
                          key={p.key} type="button" onClick={() => setSchoolPlan(p.key)}
                          className="flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-150"
                          style={{
                            background: active ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${active ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.07)"}`,
                          }}
                        >
                          <div>
                            <p className="text-sm font-semibold" style={{ color: active ? "#C4B5FD" : "#CDD6F4" }}>{p.name}</p>
                            <p className="text-xs" style={{ color: "#4A5170" }}>{p.features[0]}{p.features[1] ? ` · ${p.features[1]}` : ""}</p>
                          </div>
                          <p className="text-sm font-bold" style={{ color: active ? "#C4B5FD" : "#8892B0" }}>{p.price === 0 ? "Free" : `$${p.price}/mo`}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: "#4A5170" }}>You can change plans anytime from your subscription page. Payment is verified after your school is approved.</p>
                </>
              )}

              {currentKey === "done" && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">{profile?.role === "school_admin" ? "📋" : "🎉"}</div>
                  <p style={{ color: "#8892B0", fontSize: 14 }}>
                    {profile?.role === "school_admin"
                      ? "Your school has been submitted for verification. We'll email you once it's reviewed — usually within 1-2 business days."
                      : "Your profile is complete. Welcome aboard!"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <AuthButton onClick={currentKey === "done" ? handleFinish : handleNext} loading={saving}>
                {currentKey === "done" ? "Go to my dashboard" : "Continue"} →
              </AuthButton>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
