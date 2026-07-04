import { redirect } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function TeacherClassDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/teacher/dashboard/classes/${id}/chat`);
}
