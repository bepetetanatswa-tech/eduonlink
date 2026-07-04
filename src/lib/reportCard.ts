import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ReportCardSubject {
  subject: string;
  className: string;
  score: number | null;
  grade: string | null;
  classRank: number | null;
  teacherComment: string | null;
}

export interface ReportCardData {
  schoolName: string;
  studentName: string;
  term: number;
  academicYear: string;
  subjects: ReportCardSubject[];
  attendanceRate: number | null;
  attendancePresent: number;
  attendanceTotal: number;
}

export function generateReportCardPdf(data: ReportCardData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.schoolName, pageWidth / 2, y, { align: "center" });
  y += 22;

  doc.setFontSize(13);
  doc.text("Student Progress Report", pageWidth / 2, y, { align: "center" });
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Student: ${data.studentName}`, margin, y);
  doc.text(`Term: ${data.term}`, pageWidth - margin, y, { align: "right" });
  y += 16;
  doc.text(`Academic Year: ${data.academicYear}`, margin, y);
  if (data.attendanceRate !== null) {
    doc.text(`Attendance: ${data.attendanceRate}% (${data.attendancePresent}/${data.attendanceTotal} days)`, pageWidth - margin, y, { align: "right" });
  }
  y += 20;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Subject", "Class", "Score (%)", "Grade", "Rank", "Teacher's Comment"]],
    body: data.subjects.map(s => [
      s.subject,
      s.className,
      s.score !== null ? s.score.toString() : "—",
      s.grade ?? "—",
      s.classRank !== null ? `#${s.classRank}` : "—",
      s.teacherComment ?? "",
    ]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [77, 127, 255] },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;
  let cy = finalY + 40;

  doc.setFontSize(10);
  doc.text("Class Teacher's General Comment:", margin, cy);
  doc.line(margin, cy + 22, pageWidth - margin, cy + 22);
  cy += 46;

  doc.text("Head Teacher's Comment:", margin, cy);
  doc.line(margin, cy + 22, pageWidth - margin, cy + 22);
  cy += 46;

  doc.text("School Stamp:", margin, cy);
  doc.rect(margin, cy + 10, 90, 60);
  cy += 90;

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("This is a computer-generated report.", pageWidth / 2, doc.internal.pageSize.getHeight() - 30, { align: "center" });

  const safeName = data.studentName.replace(/[^a-z0-9]+/gi, "_");
  doc.save(`Report_Card_${safeName}_Term${data.term}_${data.academicYear}.pdf`);
}
