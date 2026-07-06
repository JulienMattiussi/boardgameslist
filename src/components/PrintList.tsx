import { Game } from "@/lib/games";
import { formatRange } from "@/lib/format";
import config from "@/lib/config";
import styles from "./PrintList.module.css";

type Props = {
  games: Game[];
  summary: string;
};

const COLUMN_COUNT = 3;

function splitIntoColumns(games: Game[]): Game[][] {
  const size = Math.ceil(games.length / COLUMN_COUNT);
  const columns: Game[][] = [];
  for (let i = 0; i < COLUMN_COUNT; i++) {
    columns.push(games.slice(i * size, (i + 1) * size));
  }
  return columns;
}

export function PrintList({ games, summary }: Props) {
  const columns = splitIntoColumns(games);
  return (
    <div className={styles.sheet}>
      <header className={styles.header}>
        <h2 className={styles.title}>{config.site_title}</h2>
        <p className={styles.meta}>
          {summary ? `${summary} · ` : ""}
          {games.length} {games.length > 1 ? "jeux" : "jeu"}
        </p>
      </header>
      <div className={styles.columns}>
        {columns.map((column, index) => (
          <table key={index} className={styles.column}>
            <thead>
              <tr>
                <th className={styles.thName}>Titre</th>
                <th className={styles.thNum}>Nb J.</th>
                <th className={styles.thNum}>Duree</th>
              </tr>
            </thead>
            <tbody>
              {column.map((game) => (
                <tr key={game.rowIndex}>
                  <td className={styles.name}>
                    {game.titre}
                    {game.sousTitre && (
                      <span className={styles.sub}> - {game.sousTitre}</span>
                    )}
                  </td>
                  <td className={styles.num}>
                    {formatRange(game.joueursMin, game.joueursMax)}
                  </td>
                  <td className={styles.num}>
                    {formatRange(game.dureeMin, game.dureeMax)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
