import { Suspense } from "react";
import { WerewolfRoomList } from "@/modules/werewolf/RoomList";

export default function WerewolfRoomsPage() {
  return (
    <Suspense fallback={null}>
      <WerewolfRoomList />
    </Suspense>
  );
}
