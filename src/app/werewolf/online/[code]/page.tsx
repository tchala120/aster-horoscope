import { WerewolfOnline } from "@/modules/werewolf/WerewolfOnline";

export default async function WerewolfOnlineRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <WerewolfOnline code={code} />;
}
