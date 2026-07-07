import { Game } from "@/lib/games";
import { formatRange } from "@/lib/format";
import { columnCountFor, layoutColumns, PrintDensity } from "@/lib/print";
import config from "@/lib/config";
import styles from "./PrintList.module.css";

type Props = {
  games: Game[];
  summary: string;
  label?: string;
  density: PrintDensity;
};

function metaTags(game: Game): string {
  return [...game.categories, ...game.themes, ...game.mecanismes].join(" · ");
}

function metaCredits(game: Game): string {
  return [game.auteurs.join(", "), game.editeur.join(", "), game.emplacement]
    .filter(Boolean)
    .join(" · ");
}

function formatNote(game: Game): string {
  if (game.notePerso !== null) {
    return `${game.notePerso}`;
  }
  if (game.noteMoyenne !== null) {
    return `(${game.noteMoyenne})`;
  }
  return "-";
}

export function PrintList({ games, summary, label, density }: Props) {
  const rich = density === "rich";
  const compact = density === "compact";
  const columns = layoutColumns(games, columnCountFor(density));
  const sheetClass = [
    styles.sheet,
    compact && styles.compact,
    rich && styles.rich,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={sheetClass}>
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
          <table key={index} className={styles.column}>
            <thead>
              <tr>
                <th className={styles.thName}>Titre</th>
                <th className={styles.thNum}>Nb J.</th>
                <th className={styles.thNum}>Duree</th>
                {rich && <th className={styles.thNum}>Age</th>}
                {rich && <th className={styles.thNum}>Note</th>}
              </tr>
            </thead>
            <tbody>
              {column.games.map((game) => (
                <tr key={game.rowIndex}>
                  <td className={styles.name}>
                    <span className={styles.nameRow}>
                      {rich && (
                        <span
                          className={styles.thumb}
                          style={
                            game.image
                              ? { backgroundImage: `url(${game.image})` }
                              : undefined
                          }
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
                        {rich && metaTags(game) && (
                          <span className={styles.tags}>{metaTags(game)}</span>
                        )}
                        {rich && metaCredits(game) && (
                          <span className={styles.credits}>
                            {metaCredits(game)}
                          </span>
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
                  {rich && <td className={styles.num}>{formatNote(game)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </div>
  );
}
