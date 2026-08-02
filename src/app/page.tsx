import type { Metadata } from "next";
import { LandingHero } from "@/modules/landing/LandingHero";
import { SessionDrawProviders } from "@/modules/session-draw/Providers";

export const metadata: Metadata = {
  title: "Aster Horoscope — A floating world of daily fortune",
  description:
    "Draw a card each day, take on a horoscope mission, and reveal your tarot result among the floating crystal isles.",
};

export default function Home() {
  return (
    <SessionDrawProviders>
      <LandingHero />
    </SessionDrawProviders>
  );
}
