import { StakingView } from "@/modules/staking/StakingView";
import { SessionDrawProviders } from "@/modules/session-draw/Providers";

export default function StakingPage() {
  return (
    <SessionDrawProviders>
      <StakingView />
    </SessionDrawProviders>
  );
}
