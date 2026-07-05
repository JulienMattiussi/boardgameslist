import { fetchGames } from "@/lib/games";
import { Catalog } from "@/components/Catalog";
import { Logo } from "@/components/icons";
import config from "@/lib/config";
import styles from "./page.module.css";

export const revalidate = 3600;

export default async function HomePage() {
  const games = await fetchGames();
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <Logo className={styles.logo} />
        <div>
          <p className={styles.eyebrow}>Ludotheque</p>
          <h1 className={styles.title}>{config.site_title}</h1>
        </div>
      </header>
      <Catalog games={games} />
    </main>
  );
}
