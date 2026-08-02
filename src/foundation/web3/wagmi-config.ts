import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Sepolia testnet — where the app's coin token (HAPPY_COIN_ADDRESS) is
 * deployed. Wallet-signature login doesn't care about chain (EOA message
 * signing isn't chain-scoped), but on-chain balance reads do, hence a real
 * chain config. Injected-only (MetaMask, Rabby, Coinbase Wallet extension,
 * etc.) — no WalletConnect project id configured yet.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: { [sepolia.id]: http() },
});

/** ERC-20 token shown as the coin balance next to the profile menu, and staked on /staking. */
export const HAPPY_COIN_ADDRESS = "0x782D25F7Ca3cB6A18915b8e43D9d2772d97D28D6" as const;

/** Fixed-APR staking contract (StakingFixedAPR) for HAPPY_COIN_ADDRESS. */
export const STAKING_ADDRESS = "0x942A781aB18e11390E10398003c4DC610240518C" as const;
