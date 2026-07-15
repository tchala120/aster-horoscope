import { GameHub } from "@/modules/session-draw/GameHub";
import { SessionDrawProviders } from "@/modules/session-draw/Providers";

export default function Home() {
  return (
    <SessionDrawProviders>
      <GameHub />
    </SessionDrawProviders>
  );
}
