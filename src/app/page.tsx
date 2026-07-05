import { fetchGames } from "@/lib/games";
import { Catalog } from "@/components/Catalog";
import { AuthControl } from "@/components/AuthControl";
import { Logo } from "@/components/icons";
import config from "@/lib/config";
import styles from "./page.module.css";

export const revalidate = 3600;

export default async function HomePage() {
  const games = await fetchGames();
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>board game list</p>
        <div className={styles.brand}>
          <Logo className={styles.logo} />
          <h1 className={styles.title}>{config.site_title}</h1>
          <div className={styles.auth}>
            <AuthControl />
          </div>
        </div>
      </header>
      <Catalog games={games} />
    </main>
  );
}
