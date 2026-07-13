import type { TarotCard } from "@/shared";

/** Major Arcana (22 cards). artworkRef points to assets to be added later. */
export const TAROT_DECK: readonly TarotCard[] = [
  { id: "the-fool", name: "The Fool", arcana: "major", artworkRef: "/cards/the-fool.svg", meaning: "New beginnings, spontaneity, a leap of faith." },
  { id: "the-magician", name: "The Magician", arcana: "major", artworkRef: "/cards/the-magician.svg", meaning: "Manifestation, resourcefulness, power." },
  { id: "the-high-priestess", name: "The High Priestess", arcana: "major", artworkRef: "/cards/the-high-priestess.svg", meaning: "Intuition, mystery, the subconscious." },
  { id: "the-empress", name: "The Empress", arcana: "major", artworkRef: "/cards/the-empress.svg", meaning: "Abundance, nurturing, creativity." },
  { id: "the-emperor", name: "The Emperor", arcana: "major", artworkRef: "/cards/the-emperor.svg", meaning: "Structure, authority, stability." },
  { id: "the-hierophant", name: "The Hierophant", arcana: "major", artworkRef: "/cards/the-hierophant.svg", meaning: "Tradition, guidance, shared values." },
  { id: "the-lovers", name: "The Lovers", arcana: "major", artworkRef: "/cards/the-lovers.svg", meaning: "Connection, choices, alignment." },
  { id: "the-chariot", name: "The Chariot", arcana: "major", artworkRef: "/cards/the-chariot.svg", meaning: "Willpower, determination, momentum." },
  { id: "strength", name: "Strength", arcana: "major", artworkRef: "/cards/strength.svg", meaning: "Courage, patience, inner strength." },
  { id: "the-hermit", name: "The Hermit", arcana: "major", artworkRef: "/cards/the-hermit.svg", meaning: "Reflection, solitude, inner guidance." },
  { id: "wheel-of-fortune", name: "Wheel of Fortune", arcana: "major", artworkRef: "/cards/wheel-of-fortune.svg", meaning: "Cycles, turning points, fate." },
  { id: "justice", name: "Justice", arcana: "major", artworkRef: "/cards/justice.svg", meaning: "Fairness, truth, accountability." },
  { id: "the-hanged-man", name: "The Hanged Man", arcana: "major", artworkRef: "/cards/the-hanged-man.svg", meaning: "Pause, surrender, new perspective." },
  { id: "death", name: "Death", arcana: "major", artworkRef: "/cards/death.svg", meaning: "Endings, transformation, renewal." },
  { id: "temperance", name: "Temperance", arcana: "major", artworkRef: "/cards/temperance.svg", meaning: "Balance, moderation, patience." },
  { id: "the-devil", name: "The Devil", arcana: "major", artworkRef: "/cards/the-devil.svg", meaning: "Attachment, temptation, shadow." },
  { id: "the-tower", name: "The Tower", arcana: "major", artworkRef: "/cards/the-tower.svg", meaning: "Upheaval, sudden change, revelation." },
  { id: "the-star", name: "The Star", arcana: "major", artworkRef: "/cards/the-star.svg", meaning: "Hope, inspiration, renewal." },
  { id: "the-moon", name: "The Moon", arcana: "major", artworkRef: "/cards/the-moon.svg", meaning: "Illusion, intuition, the unknown." },
  { id: "the-sun", name: "The Sun", arcana: "major", artworkRef: "/cards/the-sun.svg", meaning: "Joy, vitality, success." },
  { id: "judgement", name: "Judgement", arcana: "major", artworkRef: "/cards/judgement.svg", meaning: "Awakening, reckoning, renewal." },
  { id: "the-world", name: "The World", arcana: "major", artworkRef: "/cards/the-world.svg", meaning: "Completion, wholeness, achievement." },
] as const;

export const DECK_IDS: readonly string[] = TAROT_DECK.map((c) => c.id);

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_DECK.find((c) => c.id === id);
}
