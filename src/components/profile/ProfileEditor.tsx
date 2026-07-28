"use client";

import { useEffect, useState } from "react";
import { FormInput, FormSelect } from "@/components/auth/FormInput";
import { AuthButton, AuthError, AuthSuccess } from "@/components/auth/AuthCard";
import { SecurityPanel } from "@/components/profile/SecurityPanel";
import {
  FORM_LEVELS, ZIMSEC_SUBJECTS, PROVINCES,
  GENDER_OPTIONS, RELATIONSHIP_OPTIONS, CONTACT_METHOD_OPTIONS,
} from "@/types/auth";
import type { Profile } from "@/types/database";

type ChildLink = {
  id: string;
  relationship: string;
  status: string;
  child: { id: string; full_name: string; email: string };
};

type School = { id: string; name: string };

const REQUIRED_FIELDS: (keyof Profile)[] = [
  "first_name", "last_name", "date_of_birth", "gender", "phone",
  "province", "district", "town", "bio",
];
const STUDENT_REQUIRED: (keyof Profile)[] = ["form_level", "enrolled_subjects", "guardian_name", "guardian_phone"];
const PARENT_REQUIRED: (keyof Profile)[] = ["occupation", "preferred_contact_method"];
const TEACHER_REQUIRED: (keyof Profile)[] = ["qualifications", "years_experience", "teaching_subjects"];

function completionPct(p: Profile): number {
  const fields = [
    ...REQUIRED_FIELDS,
    ...(p.role === "student" ? STUDENT_REQUIRED : []),
    ...(p.role === "parent" ? PARENT_REQUIRED : []),
    ...(p.role === "teacher" ? TEACHER_REQUIRED : []),
  ];
  const filled = fields.filter((f) => {
    const v = p[f];
    return Array.isArray(v) ? v.length > 0 : v !== null && v !== undefined && v !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export function ProfileEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<ChildLink[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [town, setTown] = useState("");

  const [schoolChoice, setSchoolChoice] = useState("");
  const [schoolNameManual, setSchoolNameManual] = useState("");
  const [formLevel, setFormLevel] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [occupation, setOccupation] = useState("");
  const [contactMethod, setContactMethod] = useState("");

  const [qualifications, setQualifications] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>([]);

  const [childEmail, setChildEmail] = useState("");
  const [childRelationship, setChildRelationship] = useState("guardian");
  const [linkingChild, setLinkingChild] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      const p: Profile = data.profile;
      setProfile(p);
      setChildren(data.children ?? []);
      setSchools(data.availableSchools ?? []);

      setFirstName(p.first_name ?? "");
      setLastName(p.last_name ?? "");
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
      setQualifications(p.qualifications ?? "");
      setYearsExperience(p.years_experience != null ? String(p.years_experience) : "");
      setTeachingSubjects(p.teaching_subjects ?? []);
      setLoading(false);
    })();
  }, []);

  const toggleSubject = (s: string) =>
    setSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const toggleTeachingSubject = (s: string) =>
    setTeachingSubjects((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const fields: Record<string, unknown> = {
        first_name: firstName, last_name: lastName,
        date_of_birth: dob || null, gender: gender || null, phone: phone || null, bio: bio || null,
        province: province || null, district: district || null, town: town || null,
      };
      if (profile.role === "student") {
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
      if (profile.role === "parent") {
        Object.assign(fields, { occupation: occupation || null, preferred_contact_method: contactMethod || null });
      }
      if (profile.role === "teacher") {
        Object.assign(fields, {
          school_id: schoolChoice && schoolChoice !== "other" ? schoolChoice : null,
          school_name: schoolChoice === "other" ? schoolNameManual : (schools.find((s) => s.id === schoolChoice)?.name ?? null),
          qualifications: qualifications || null,
          years_experience: yearsExperience ? Number(yearsExperience) : null,
          teaching_subjects: teachingSubjects,
        });
      }
      if (profile.role === "school_admin") {
        Object.assign(fields, {
          school_id: schoolChoice && schoolChoice !== "other" ? schoolChoice : null,
          school_name: schoolChoice === "other" ? schoolNameManual : (schools.find((s) => s.id === schoolChoice)?.name ?? null),
        });
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save changes."); return; }
      setProfile(data.profile);
      setSuccess("Profile updated.");
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
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

  if (loading) return <p style={{ color: "#6E7A6C", fontSize: 14 }}>Loading profile…</p>;
  if (!profile) return <p style={{ color: "#A3311E", fontSize: 14 }}>Could not load profile.</p>;

  const pct = completionPct(profile);

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit" }}>My Profile</h2>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              color: pct === 100 ? "#1F4738" : "#566257",
              background: pct === 100 ? "rgba(31,71,56,0.12)" : "rgba(28,38,32,0.04)",
              border: `1px solid ${pct === 100 ? "rgba(31,71,56,0.3)" : "rgba(28,38,32,0.08)"}`,
            }}
          >
            {pct === 100 ? "Profile complete ✓" : `${pct}% complete`}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: "rgba(28,38,32,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #B1502B, #1F4738)", transition: "width 0.3s" }} />
        </div>
      </div>

      <AuthError message={error} />
      <AuthSuccess message={success} />

      <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>Basic info</p>
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
          <label className="text-sm font-medium" style={{ color: "#566257" }}>Short bio</label>
          <textarea
            rows={3} value={bio} onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl text-sm text-white outline-none p-3"
            style={{ background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", fontFamily: "inherit", resize: "vertical" }}
          />
        </div>
      </div>

      <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>Address</p>
        <FormSelect label="Province" value={province} onChange={(e) => setProvince(e.target.value)}>
          <option value="" disabled>Select a province</option>
          {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
        </FormSelect>
        <div className="grid grid-cols-2 gap-3">
          <FormInput label="District" value={district} onChange={(e) => setDistrict(e.target.value)} />
          <FormInput label="Town / suburb" value={town} onChange={(e) => setTown(e.target.value)} />
        </div>
      </div>

      {profile.role === "student" && (
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>School details</p>
          <FormSelect label="Current school" value={schoolChoice} onChange={(e) => setSchoolChoice(e.target.value)}>
            <option value="">Not listed / prefer to type</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="other">Other — type manually</option>
          </FormSelect>
          {(schoolChoice === "other" || schoolChoice === "") && (
            <FormInput label="School name" value={schoolNameManual} onChange={(e) => setSchoolNameManual(e.target.value)} />
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
            <label className="text-sm font-medium" style={{ color: "#566257" }}>
              Subjects enrolled <span className="text-xs font-normal ml-1" style={{ color: "#6E7A6C" }}>({subjects.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {ZIMSEC_SUBJECTS.map((s) => {
                const active = subjects.includes(s);
                return (
                  <button
                    key={s} type="button" onClick={() => toggleSubject(s)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: active ? "rgba(177,80,43,0.15)" : "rgba(28,38,32,0.04)",
                      border: `1px solid ${active ? "rgba(177,80,43,0.4)" : "rgba(28,38,32,0.08)"}`,
                      color: active ? "#7AA5FF" : "#6E7A6C",
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
        </div>
      )}

      {profile.role === "parent" && (
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>Family</p>
          <FormInput label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
          <FormSelect label="Preferred contact method" value={contactMethod} onChange={(e) => setContactMethod(e.target.value)}>
            <option value="">Select one</option>
            {CONTACT_METHOD_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </FormSelect>

          <div className="h-px" style={{ background: "rgba(28,38,32,0.06)" }} />

          <p className="text-sm font-medium" style={{ color: "#566257" }}>Linked children</p>
          {children.length === 0 && <p className="text-xs" style={{ color: "#6E7A6C" }}>No children linked yet.</p>}
          <div className="flex flex-col gap-2">
            {children.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: "rgba(28,38,32,0.03)", border: "1px solid rgba(28,38,32,0.06)" }}>
                <div>
                  <p className="text-sm" style={{ color: "#1C2620" }}>{c.child.full_name}</p>
                  <p className="text-xs" style={{ color: "#6E7A6C" }}>{c.child.email} · {c.relationship}</p>
                </div>
                <button type="button" onClick={() => handleUnlinkChild(c.id)} className="text-xs" style={{ color: "#A3311E" }}>Remove</button>
              </div>
            ))}
          </div>
          {linkError && <p className="text-xs" style={{ color: "#A3311E" }}>{linkError}</p>}
          <div className="flex gap-2">
            <input
              value={childEmail} onChange={(e) => setChildEmail(e.target.value)}
              placeholder="Child's email address" type="email"
              className="flex-1 h-11 rounded-xl text-sm text-white outline-none px-3"
              style={{ background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)" }}
            />
            <select
              value={childRelationship} onChange={(e) => setChildRelationship(e.target.value)}
              className="h-11 rounded-xl text-sm text-white outline-none px-2"
              style={{ background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)" }}
            >
              {RELATIONSHIP_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <button
              type="button" onClick={handleLinkChild} disabled={linkingChild}
              className="h-11 px-4 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(31,71,56,0.12)", border: "1px solid rgba(31,71,56,0.3)", color: "#1F4738" }}
            >
              {linkingChild ? "Linking…" : "Link"}
            </button>
          </div>
        </div>
      )}

      {profile.role === "teacher" && (
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>Teaching details</p>
          <FormSelect label="School" value={schoolChoice} onChange={(e) => setSchoolChoice(e.target.value)}>
            <option value="">Not listed / prefer to type</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="other">Other — type manually</option>
          </FormSelect>
          {(schoolChoice === "other" || schoolChoice === "") && (
            <FormInput label="School name" value={schoolNameManual} onChange={(e) => setSchoolNameManual(e.target.value)} />
          )}
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="Qualifications" value={qualifications} onChange={(e) => setQualifications(e.target.value)} />
            <FormInput label="Years of experience" type="number" value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: "#566257" }}>
              Subjects taught <span className="text-xs font-normal ml-1" style={{ color: "#6E7A6C" }}>({teachingSubjects.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {ZIMSEC_SUBJECTS.map((s) => {
                const active = teachingSubjects.includes(s);
                return (
                  <button
                    key={s} type="button" onClick={() => toggleTeachingSubject(s)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                    style={{
                      background: active ? "rgba(177,80,43,0.15)" : "rgba(28,38,32,0.04)",
                      border: `1px solid ${active ? "rgba(177,80,43,0.4)" : "rgba(28,38,32,0.08)"}`,
                      color: active ? "#7AA5FF" : "#6E7A6C",
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {profile.role === "school_admin" && (
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#6E7A6C" }}>School</p>
          <FormSelect label="School you administer" value={schoolChoice} onChange={(e) => setSchoolChoice(e.target.value)}>
            <option value="">Not listed / prefer to type</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            <option value="other">Other — type manually</option>
          </FormSelect>
          {(schoolChoice === "other" || schoolChoice === "") && (
            <FormInput label="School name" value={schoolNameManual} onChange={(e) => setSchoolNameManual(e.target.value)} />
          )}
        </div>
      )}

      <SecurityPanel />

      <div style={{ maxWidth: 220 }}>
        <AuthButton onClick={handleSave} loading={saving}>Save changes</AuthButton>
      </div>
    </div>
  );
}
