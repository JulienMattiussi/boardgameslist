import { Game } from "@/lib/games";
import { GameCard } from "./GameCard";
import styles from "./GameList.module.css";

type Props = {
  games: Game[];
};

export function GameList({ games }: Props) {
  if (games.length === 0) {
    return (
      <p className={styles.empty}>Aucun jeu ne correspond a cette recherche.</p>
    );
  }
  return (
    <div className={styles.grid}>
      {games.map((game) => (
        <GameCard key={game.myludoId || game.titre} game={game} />
      ))}
    </div>
  );
}
