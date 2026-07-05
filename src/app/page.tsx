import { fetchGames } from "@/lib/games";
import { GameList } from "@/components/GameList";
import config from "@/lib/config";
import styles from "./page.module.css";

export const revalidate = 3600;

export default async function HomePage() {
  const games = await fetchGames();
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>{config.site_title}</h1>
        <p className={styles.count}>{games.length} jeux</p>
      </header>
      <GameList games={games} />
    </main>
  );
}
