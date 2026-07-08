export type BggGame = {
  bggId: string;
  titre: string;
  annee: number | null;
  joueursMin: number | null;
  joueursMax: number | null;
  dureeMin: number | null;
  dureeMax: number | null;
  age: number | null;
  categories: string[];
  themes: string[];
  mecanismes: string[];
  auteurs: string[];
  editeur: string[];
  noteMoyenne: number | null;
  image: string;
  description: string;
};

const MAX_PUBLISHERS = 3;

const BGG_CATEGORY_TO_FR: Record<string, string> = {
  "Card Game": "Jeu de Cartes",
  Dice: "Jeu de dés",
  Puzzle: "Casse-tête",
  "Word Game": "Jeu de lettres",
  "Action / Dexterity": "Jeu d'Adresse",
  "Party Game": "Jeu d'Ambiance",
  Deduction: "Jeu d'Enquête",
  "Murder/Mystery": "Jeu d'Enquête",
};

const BGG_CATEGORY_TO_THEME: Record<string, string> = {
  Fantasy: "Fantasy",
  "Science Fiction": "Science-fiction",
  Economic: "Économie",
  Wargame: "Guerre",
  Fighting: "Guerre",
  "World War I": "Guerre",
  "World War II": "Guerre",
  "Civil War": "Guerre",
  "Modern Warfare": "Guerre",
  Napoleonic: "Guerre",
  Adventure: "Aventure",
  Exploration: "Exploration",
  Horror: "Horreur",
  Zombies: "Monstres & Créatures",
  Animals: "Animaux",
  Farming: "Nature",
  Environmental: "Environnement",
  Nautical: "Maritime",
  "Space Exploration": "Espace",
  Medieval: "Médiéval",
  Ancient: "Historique",
  "Age of Reason": "Historique",
  Prehistoric: "Préhistoire",
  Renaissance: "Renaissance",
  Mythology: "Mythologie",
  Pirates: "Pirates",
  Racing: "Course",
  Sports: "Sports",
  Trains: "Trains",
  Transportation: "Transport & voyage",
  Travel: "Transport & voyage",
  "American West": "Far West",
  "Spies/Secret Agents": "Espionnage",
  "Aviation / Flight": "Aviation",
  "Video Game Theme": "Jeu vidéo",
  "Comic Book / Strip": "Bande dessinée",
  "Novel-based": "Littérature",
  Book: "Littérature",
  Humor: "Humour",
  Medical: "Médical",
  "City Building": "Urbanisme",
  "Territory Building": "Colonisation",
  Music: "Arts",
  Number: "Chiffres",
};

const BGG_MECHANIC_TO_FR: Record<string, string> = {
  "Hand Management": "Gestion de main",
  "Dice Rolling": "Jet De Dés",
  "Set Collection": "Collection",
  "Tile Placement": "Placement de tuiles",
  "Area Majority / Influence": "Majorité",
  "Area Movement": "Contrôle de zone",
  Enclosure: "Contrôle de zone",
  "Worker Placement": "Placement d'ouvriers",
  "Card Drafting": "Draft",
  "Open Drafting": "Draft",
  "Closed Drafting": "Draft",
  "Cooperative Game": "Coopération",
  "Take That": "Dans Ta Face",
  "Team-Based Game": "Équipes",
  "Variable Player Powers": "Pouvoir",
  "Push Your Luck": "Stop ou encore",
  "Trick-taking": "Plis",
  "Modular Board": "Plateau modulaire",
  "Network and Route Building": "Connexion",
  "Point to Point Movement": "Mouvement de point à point",
  Memory: "Mémorisation",
  "Simultaneous Action Selection": "Choix simultanés",
  "Action Points": "Points d'action",
  "Grid Movement": "Déplacement",
  "Hexagon Grid": "hexagones",
  "Paper-and-Pencil": "Papier & Crayon",
  Storytelling: "Narration",
  Negotiation: "Négociation",
  Voting: "Vote",
  "Real-Time": "Temps réel",
  Deduction: "Déduction",
  "Hidden Roles": "Rôle secret",
  "Hidden Movement": "Jeu caché",
  "Action Queue": "Programmation",
  "Programmed Movement": "Programmation",
  "Tableau Building": "Construction De Tableau",
  Market: "Marché",
  Trading: "Échange & Troc",
  "Player Elimination": "Élimination",
  "Scenario / Mission / Campaign Game": "Scénarios",
  "Campaign / Battle Card Driven": "Campagne",
  "Betting and Bluffing": "Bluff",
  "Communication Limits": "Communication Restreinte",
  "Roll and Write": "Roll & Write",
  Dexterity: "Adresse & Dextérité",
};

type JsonNode = Record<string, unknown>;

function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function str(value: unknown): string {
  return typeof value === "string"
    ? value
    : typeof value === "number"
      ? String(value)
      : "";
}

function linkNames(links: unknown, key: string, limit?: number): string[] {
  const list = (links as JsonNode)?.[key];
  if (!Array.isArray(list)) {
    return [];
  }
  const names = list
    .map((entry) =>
      entry && typeof entry === "object" ? str((entry as JsonNode).name) : "",
    )
    .filter(Boolean);
  return limit === undefined ? names : names.slice(0, limit);
}

function translate(values: string[], dict: Record<string, string>): string[] {
  const mapped: string[] = [];
  for (const value of values) {
    const fr = dict[value];
    if (fr && !mapped.includes(fr)) {
      mapped.push(fr);
    }
  }
  return mapped;
}

export function mapCategories(bggCategories: string[]): string[] {
  return translate(bggCategories, BGG_CATEGORY_TO_FR);
}

export function mapThemes(bggCategories: string[]): string[] {
  return translate(bggCategories, BGG_CATEGORY_TO_THEME);
}

export function mapMechanics(bggMechanics: string[]): string[] {
  return translate(bggMechanics, BGG_MECHANIC_TO_FR);
}

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&mdash;": "-",
  "&ndash;": "-",
  "&rsquo;": "'",
  "&lsquo;": "'",
  "&hellip;": "...",
};

export function cleanDescription(raw: string): string {
  if (!raw) {
    return "";
  }
  let value = raw
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16)),
    )
    .replace(/&[a-z]+;/gi, (entity) => NAMED_ENTITIES[entity] ?? entity);
  value = value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseBggId(input: string): string {
  const value = input.trim();
  const fromUrl = value.match(/boardgame(?:expansion)?\/(\d+)/i);
  if (fromUrl) {
    return fromUrl[1];
  }
  return /^\d+$/.test(value) ? value : "";
}

export function parseRating(json: unknown): number | null {
  const item = (json as JsonNode)?.item as JsonNode | undefined;
  const stats = item?.stats as JsonNode | undefined;
  const average = num(stats?.average);
  return average === null ? null : Math.round(average * 10) / 10;
}

export function parseGeekItem(json: unknown): BggGame | null {
  const item = (json as JsonNode)?.item as JsonNode | undefined;
  if (!item || item.objectid === undefined || item.objectid === null) {
    return null;
  }
  const links = item.links;
  const primary = item.primaryname as JsonNode | undefined;
  const bggCategories = linkNames(links, "boardgamecategory");
  const playtime = num(item.playingtime);
  return {
    bggId: str(item.objectid),
    titre: str(primary?.name),
    annee: num(item.yearpublished),
    joueursMin: num(item.minplayers),
    joueursMax: num(item.maxplayers),
    dureeMin: num(item.minplaytime) ?? playtime,
    dureeMax: num(item.maxplaytime) ?? playtime,
    age: num(item.minage),
    categories: mapCategories(bggCategories),
    themes: mapThemes(bggCategories),
    mecanismes: mapMechanics(linkNames(links, "boardgamemechanic")),
    auteurs: linkNames(links, "boardgamedesigner"),
    editeur: linkNames(links, "boardgamepublisher", MAX_PUBLISHERS),
    noteMoyenne: null,
    image: str(item.imageurl),
    description: cleanDescription(str(item.description)),
  };
}
