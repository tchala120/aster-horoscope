import { LessonEditor } from "@/modules/school/LessonEditor";

export default async function EditLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <LessonEditor mode="edit" id={id} />;
}
