import { Game } from "@/lib/games";
import { formatRange } from "@/lib/format";
import { columnCountFor, PrintDensity } from "@/lib/print";
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

function formatComplexite(game: Game): string {
  return game.complexite !== null ? `${game.complexite}/5` : "-";
}

export function PrintList({ games, summary, label, density }: Props) {
  const rich = density === "rich";
  const compact = density === "compact";
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
      <div
        className={styles.columns}
        style={{ columnCount: columnCountFor(density) }}
      >
        <div className={`${styles.entry} ${styles.head}`}>
          <span className={styles.thName}>Titre</span>
          <span className={styles.thNum}>Nb J.</span>
          <span className={styles.thNum}>Duree</span>
          {rich && <span className={styles.thNum}>Age</span>}
          {rich && <span className={styles.thNum}>Note</span>}
          {rich && <span className={styles.thNum}>Compl.</span>}
        </div>
        {games.map((game) => (
          <div key={game.rowIndex} className={styles.entry}>
            <span className={styles.name}>
              {rich &&
                (game.image ? (
                  <img
                    className={styles.thumb}
                    src={game.image}
                    alt=""
                    data-print-image
                  />
                ) : (
                  <span className={styles.thumb} />
                ))}
              <span>
                {game.titre}
                {game.sousTitre && (
                  <span className={styles.sub}> - {game.sousTitre}</span>
                )}
                {rich && metaTags(game) && (
                  <span className={styles.tags}>{metaTags(game)}</span>
                )}
                {rich && metaCredits(game) && (
                  <span className={styles.credits}>{metaCredits(game)}</span>
                )}
              </span>
            </span>
            <span className={styles.num}>
              {formatRange(game.joueursMin, game.joueursMax)}
            </span>
            <span className={styles.num}>
              {formatRange(game.dureeMin, game.dureeMax)}
            </span>
            {rich && (
              <span className={styles.num}>
                {game.age !== null ? `${game.age}+` : "-"}
              </span>
            )}
            {rich && <span className={styles.num}>{formatNote(game)}</span>}
            {rich && (
              <span className={styles.num}>{formatComplexite(game)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
