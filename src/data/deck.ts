import type { TarotCard } from "@/shared";

/** Major Arcana (22 cards). Each card has love + work artwork variants. */
export const TAROT_DECK: readonly TarotCard[] = [
  { id: "the-fool", name: "The Fool", arcana: "major", artwork: { love: "/cards/01-love.png", work: "/cards/01-work.png" }, meaning: "New beginnings, spontaneity, a leap of faith." },
  { id: "the-magician", name: "The Magician", arcana: "major", artwork: { love: "/cards/02-love.png", work: "/cards/02-work.png" }, meaning: "Manifestation, resourcefulness, power." },
  { id: "the-high-priestess", name: "The High Priestess", arcana: "major", artwork: { love: "/cards/03-love.png", work: "/cards/03-work.png" }, meaning: "Intuition, mystery, the subconscious." },
  { id: "the-empress", name: "The Empress", arcana: "major", artwork: { love: "/cards/04-love.png", work: "/cards/04-work.png" }, meaning: "Abundance, nurturing, creativity." },
  { id: "the-emperor", name: "The Emperor", arcana: "major", artwork: { love: "/cards/05-love.png", work: "/cards/05-work.png" }, meaning: "Structure, authority, stability." },
  { id: "the-hierophant", name: "The Hierophant", arcana: "major", artwork: { love: "/cards/06-love.png", work: "/cards/06-work.png" }, meaning: "Tradition, guidance, shared values." },
  { id: "the-lovers", name: "The Lovers", arcana: "major", artwork: { love: "/cards/07-love.png", work: "/cards/07-work.png" }, meaning: "Connection, choices, alignment." },
  { id: "the-chariot", name: "The Chariot", arcana: "major", artwork: { love: "/cards/08-love.png", work: "/cards/08-work.png" }, meaning: "Willpower, determination, momentum." },
  { id: "strength", name: "Strength", arcana: "major", artwork: { love: "/cards/09-love.png", work: "/cards/09-work.png" }, meaning: "Courage, patience, inner strength." },
  { id: "the-hermit", name: "The Hermit", arcana: "major", artwork: { love: "/cards/10-love.png", work: "/cards/10-work.png" }, meaning: "Reflection, solitude, inner guidance." },
  { id: "wheel-of-fortune", name: "Wheel of Fortune", arcana: "major", artwork: { love: "/cards/01-love.png", work: "/cards/01-work.png" }, meaning: "Cycles, turning points, fate." },
  { id: "justice", name: "Justice", arcana: "major", artwork: { love: "/cards/02-love.png", work: "/cards/02-work.png" }, meaning: "Fairness, truth, accountability." },
  { id: "the-hanged-man", name: "The Hanged Man", arcana: "major", artwork: { love: "/cards/03-love.png", work: "/cards/03-work.png" }, meaning: "Pause, surrender, new perspective." },
  { id: "death", name: "Death", arcana: "major", artwork: { love: "/cards/04-love.png", work: "/cards/04-work.png" }, meaning: "Endings, transformation, renewal." },
  { id: "temperance", name: "Temperance", arcana: "major", artwork: { love: "/cards/05-love.png", work: "/cards/05-work.png" }, meaning: "Balance, moderation, patience." },
  { id: "the-devil", name: "The Devil", arcana: "major", artwork: { love: "/cards/06-love.png", work: "/cards/06-work.png" }, meaning: "Attachment, temptation, shadow." },
  { id: "the-tower", name: "The Tower", arcana: "major", artwork: { love: "/cards/07-love.png", work: "/cards/07-work.png" }, meaning: "Upheaval, sudden change, revelation." },
  { id: "the-star", name: "The Star", arcana: "major", artwork: { love: "/cards/08-love.png", work: "/cards/08-work.png" }, meaning: "Hope, inspiration, renewal." },
  { id: "the-moon", name: "The Moon", arcana: "major", artwork: { love: "/cards/09-love.png", work: "/cards/09-work.png" }, meaning: "Illusion, intuition, the unknown." },
  { id: "the-sun", name: "The Sun", arcana: "major", artwork: { love: "/cards/10-love.png", work: "/cards/10-work.png" }, meaning: "Joy, vitality, success." },
  { id: "judgement", name: "Judgement", arcana: "major", artwork: { love: "/cards/01-love.png", work: "/cards/01-work.png" }, meaning: "Awakening, reckoning, renewal." },
  { id: "the-world", name: "The World", arcana: "major", artwork: { love: "/cards/02-love.png", work: "/cards/02-work.png" }, meaning: "Completion, wholeness, achievement." },
] as const;

export const DECK_IDS: readonly string[] = TAROT_DECK.map((c) => c.id);

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_DECK.find((c) => c.id === id);
}
