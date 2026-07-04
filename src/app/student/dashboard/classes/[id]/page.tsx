import { redirect } from "next/navigation";

interface Props { params: Promise<{ id: string }> }

export default async function StudentClassDetailPage({ params }: Props) {
  const { id } = await params;
  redirect(`/student/dashboard/classes/${id}/chat`);
}
