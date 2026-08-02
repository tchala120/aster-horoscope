import { StakeView } from "@/modules/staking/StakeView";
import { SessionDrawProviders } from "@/modules/session-draw/Providers";

export default function StakePage() {
  return (
    <SessionDrawProviders>
      <StakeView />
    </SessionDrawProviders>
  );
}
