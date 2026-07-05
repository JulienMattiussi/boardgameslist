import { Game } from "@/lib/games";
import { formatRange } from "@/lib/format";
import styles from "./GameList.module.css";

type Props = {
  games: Game[];
};

export function GameList({ games }: Props) {
  return (
    <ul className={styles.grid}>
      {games.map((game) => {
        const players = formatRange(game.joueursMin, game.joueursMax);
        const duration = formatRange(game.dureeMin, game.dureeMax);
        return (
          <li key={game.myludoId || game.titre} className={styles.card}>
            <h3 className={styles.title}>{game.titre}</h3>
            {game.sousTitre && (
              <span className={styles.subtitle}>{game.sousTitre}</span>
            )}
            <div className={styles.meta}>
              {players && <span>{players} joueurs</span>}
              {duration && <span>{duration} min</span>}
              {game.age && <span>{game.age}</span>}
            </div>
            {game.categories.length > 0 && (
              <div className={styles.categories}>
                {game.categories.map((category) => (
                  <span key={category} className={styles.badge}>
                    {category}
                  </span>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
