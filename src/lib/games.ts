import fs from "fs";
import matter from "gray-matter";
import path from "path";
import yaml from "js-yaml";

const gamesDirectory = path.join(process.cwd(), "content/games");

export type GameContent = {
  readonly date: string;
  readonly title: string;
  readonly slug: string;
  readonly tags?: string[];
  readonly fullPath: string;
  readonly body?: string;
};

let gameCache: GameContent[];

export function fetchGameContent(): GameContent[] {
  if (gameCache) {
    return gameCache;
  }
  // Get file names under /games
  const fileNames = fs.readdirSync(gamesDirectory);
  const allGamesData = fileNames
    .filter((it) => it.endsWith(".mdx"))
    .map((fileName) => {
      // Read markdown file as string
      const fullPath = path.join(gamesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");

      // Use gray-matter to parse the game metadata section
      const matterResult = matter(fileContents, {
        engines: {
          yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object,
        },
      });
      const matterData = matterResult.data as {
        date: string;
        title: string;
        tags: string[];
        slug: string;
        fullPath: string;
        body: string;
      };
      matterData.fullPath = fullPath;
      matterData.body = matterResult.content;

      const slug = fileName.replace(/\.mdx$/, "");

      // Validate slug string
      if (matterData.slug !== slug) {
        throw new Error(
          "slug field not match with the path of its content source"
        );
      }

      return matterData;
    });
  // Sort games by date
  gameCache = allGamesData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
  return gameCache;
}

export function countGames(tag?: string): number {
  return fetchGameContent().filter(
    (it) => !tag || (it.tags && it.tags.includes(tag))
  ).length;
}

export function listGameContent(
  page: number,
  limit: number,
  tag?: string
): GameContent[] {
  return fetchGameContent()
    .filter((it) => !tag || (it.tags && it.tags.includes(tag)))
    .slice((page - 1) * limit, page * limit);
}
