import { DailyDrawContainer } from "@/modules/session-draw/DailyDrawContainer";
import { SessionDrawProviders } from "@/modules/session-draw/Providers";

export default function DrawPage() {
  return (
    <SessionDrawProviders>
      <DailyDrawContainer />
    </SessionDrawProviders>
  );
}
