import { PlaylistEditor } from "@/modules/school/PlaylistEditor";

export default async function EditPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlaylistEditor mode="edit" id={id} />;
}
