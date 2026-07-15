import type { CardArtwork, CardArtworkTheme, TarotCard } from "@/shared";

/** All artwork themes. */
export const CARD_ARTWORK_THEMES: readonly CardArtworkTheme[] = ["life", "love", "money", "work"];

/** Pick a random artwork theme. Call from event handlers, not during render. */
export function randomArtworkTheme(): CardArtworkTheme {
  return CARD_ARTWORK_THEMES[Math.floor(Math.random() * CARD_ARTWORK_THEMES.length)];
}

/** Build the four themed artwork paths for image number `n` (1-10). */
function art(n: number): CardArtwork {
  const p = String(n).padStart(2, "0");
  return {
    life: `/cards/${p}-life.png`,
    love: `/cards/${p}-love.png`,
    money: `/cards/${p}-money.png`,
    work: `/cards/${p}-work.png`,
  };
}

/** Major Arcana identities + meanings. Artwork is assigned below by cycling the
 *  10 available image sets (each with life/love/money/work themes). */
const CARDS: ReadonlyArray<Pick<TarotCard, "id" | "name" | "meaning">> = [
  { id: "the-fool", name: "The Fool", meaning: "New beginnings, spontaneity, a leap of faith." },
  { id: "the-magician", name: "The Magician", meaning: "Manifestation, resourcefulness, power." },
  { id: "the-high-priestess", name: "The High Priestess", meaning: "Intuition, mystery, the subconscious." },
  { id: "the-empress", name: "The Empress", meaning: "Abundance, nurturing, creativity." },
  { id: "the-emperor", name: "The Emperor", meaning: "Structure, authority, stability." },
  { id: "the-hierophant", name: "The Hierophant", meaning: "Tradition, guidance, shared values." },
  { id: "the-lovers", name: "The Lovers", meaning: "Connection, choices, alignment." },
  { id: "the-chariot", name: "The Chariot", meaning: "Willpower, determination, momentum." },
  { id: "strength", name: "Strength", meaning: "Courage, patience, inner strength." },
  { id: "the-hermit", name: "The Hermit", meaning: "Reflection, solitude, inner guidance." },
  { id: "wheel-of-fortune", name: "Wheel of Fortune", meaning: "Cycles, turning points, fate." },
  { id: "justice", name: "Justice", meaning: "Fairness, truth, accountability." },
  { id: "the-hanged-man", name: "The Hanged Man", meaning: "Pause, surrender, new perspective." },
  { id: "death", name: "Death", meaning: "Endings, transformation, renewal." },
  { id: "temperance", name: "Temperance", meaning: "Balance, moderation, patience." },
  { id: "the-devil", name: "The Devil", meaning: "Attachment, temptation, shadow." },
  { id: "the-tower", name: "The Tower", meaning: "Upheaval, sudden change, revelation." },
  { id: "the-star", name: "The Star", meaning: "Hope, inspiration, renewal." },
  { id: "the-moon", name: "The Moon", meaning: "Illusion, intuition, the unknown." },
  { id: "the-sun", name: "The Sun", meaning: "Joy, vitality, success." },
  { id: "judgement", name: "Judgement", meaning: "Awakening, reckoning, renewal." },
  { id: "the-world", name: "The World", meaning: "Completion, wholeness, achievement." },
];

/** Major Arcana (22 cards). Each card has life/love/money/work artwork variants. */
export const TAROT_DECK: readonly TarotCard[] = CARDS.map((card, i) => ({
  ...card,
  arcana: "major",
  artwork: art((i % 10) + 1),
}));

export const DECK_IDS: readonly string[] = TAROT_DECK.map((c) => c.id);

export function getCardById(id: string): TarotCard | undefined {
  return TAROT_DECK.find((c) => c.id === id);
}
