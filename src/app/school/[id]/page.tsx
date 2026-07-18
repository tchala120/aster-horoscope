import { LessonDetail } from "@/modules/school/LessonDetail";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonDetail id={id} />;
}
