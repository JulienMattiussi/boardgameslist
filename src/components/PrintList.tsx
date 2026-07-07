import { Game } from "@/lib/games";
import { formatRange } from "@/lib/format";
import { layoutColumns, PrintRichness } from "@/lib/print";
import config from "@/lib/config";
import styles from "./PrintList.module.css";

type Props = {
  games: Game[];
  summary: string;
  label?: string;
  richness: PrintRichness;
  optimize: boolean;
};

function tags(game: Game): string {
  return [...game.categories, ...game.themes].join(" · ");
}

export function PrintList({
  games,
  summary,
  label,
  richness,
  optimize,
}: Props) {
  const columns = layoutColumns(games, optimize);
  const rich = richness === "rich";
  return (
    <div className={styles.sheet}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {config.site_title}
          {label && <span className={styles.label}> - {label}</span>}
        </h2>
        <p className={styles.meta}>
          {summary ? `${summary} · ` : ""}
          {games.length} {games.length > 1 ? "jeux" : "jeu"}
        </p>
      </header>
      <div className={styles.columns}>
        {columns.map((column, index) => (
          <table
            key={index}
            className={styles.column}
            style={{ flex: `${column.weight} 1 0` }}
          >
            <thead>
              <tr>
                <th className={styles.thName}>Titre</th>
                <th className={styles.thNum}>Nb J.</th>
                <th className={styles.thNum}>Duree</th>
                {rich && <th className={styles.thNum}>Age</th>}
              </tr>
            </thead>
            <tbody>
              {column.games.map((game) => (
                <tr key={game.rowIndex}>
                  <td className={styles.name}>
                    <span className={styles.nameRow}>
                      {rich && game.image && (
                        <span
                          className={styles.thumb}
                          style={{ backgroundImage: `url(${game.image})` }}
                        />
                      )}
                      <span>
                        {game.titre}
                        {game.sousTitre && (
                          <span className={styles.sub}>
                            {" "}
                            - {game.sousTitre}
                          </span>
                        )}
                        {rich && tags(game) && (
                          <span className={styles.tags}>{tags(game)}</span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td className={styles.num}>
                    {formatRange(game.joueursMin, game.joueursMax)}
                  </td>
                  <td className={styles.num}>
                    {formatRange(game.dureeMin, game.dureeMax)}
                  </td>
                  {rich && (
                    <td className={styles.num}>
                      {game.age !== null ? `${game.age}+` : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
