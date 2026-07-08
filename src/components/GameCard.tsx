import { Game } from "@/lib/games";
import { formatRange, hueFromString, ratingLevel } from "@/lib/format";
import { PlayersIcon, ClockIcon, AgeIcon, StarIcon, EditIcon } from "./icons";
import { MetaItem } from "./ui/MetaItem";
import { DetailRow } from "./ui/DetailRow";
import styles from "./GameCard.module.css";

type Props = {
  game: Game;
  onEdit?: (game: Game) => void;
  detailed?: boolean;
};

export function GameCard({ game, onEdit, detailed }: Props) {
  const players = formatRange(game.joueursMin, game.joueursMax);
  const duration = formatRange(game.dureeMin, game.dureeMax);
  const hue = hueFromString(game.titre);
  const perso = game.notePerso;
  const moyenne = game.noteMoyenne;
  const hasRating = perso !== null || moyenne !== null;
  const ratingTooltip = [
    perso !== null ? `Note perso : ${perso.toFixed(1)}` : null,
    moyenne !== null ? `Note moyenne : ${moyenne.toFixed(1)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const details: { label: string; value: string }[] = [];
  if (game.edition !== null) {
    details.push({ label: "Edition", value: String(game.edition) });
  }
  if (game.themes.length > 0) {
    details.push({ label: "Themes", value: game.themes.join(", ") });
  }
  if (game.mecanismes.length > 0) {
    details.push({ label: "Mecanismes", value: game.mecanismes.join(", ") });
  }
  if (game.emplacement) {
    details.push({ label: "Emplacement", value: game.emplacement });
  }
  if (game.dateAcquisition) {
    details.push({ label: "Acquis le", value: game.dateAcquisition });
  }

  return (
    <article
      className={styles.card}
      style={{ "--card-hue": hue } as React.CSSProperties}
    >
      <div className={styles.banner}>
        {onEdit && (
          <button
            type="button"
            className={styles.edit}
            onClick={() => onEdit(game)}
            title="Modifier"
            aria-label="Modifier"
          >
            <EditIcon />
          </button>
        )}
        {hasRating && (
          <span className={styles.rating} title={ratingTooltip}>
            <StarIcon className={styles.star} />
            {perso !== null && (
              <span
                className={`${styles.rateValue} ${styles[ratingLevel(perso) ?? "mid"]}`}
              >
                {perso.toFixed(1)}
              </span>
            )}
            {perso !== null && moyenne !== null && (
              <span className={styles.rateSep} aria-hidden />
            )}
            {moyenne !== null && (
              <span
                className={`${styles.rateValue} ${styles[ratingLevel(moyenne) ?? "mid"]}`}
              >
                {moyenne.toFixed(1)}
              </span>
            )}
          </span>
        )}
        <div className={styles.bannerText}>
          <h3 className={styles.title}>{game.titre}</h3>
          {game.sousTitre && (
            <p className={styles.subtitle}>{game.sousTitre}</p>
          )}
        </div>
      </div>

      <div className={styles.body}>
        {detailed && game.image && (
          <div
            className={styles.cover}
            style={{ backgroundImage: `url("${game.image}")` }}
            role="img"
            aria-label={game.titre}
          />
        )}
        <div className={styles.meta}>
          {players && (
            <MetaItem Icon={PlayersIcon} value={players} label="joueurs" />
          )}
          {duration && (
            <MetaItem Icon={ClockIcon} value={duration} label="min" />
          )}
          {game.age !== null && (
            <MetaItem Icon={AgeIcon} value={`${game.age}+`} label="age" />
          )}
        </div>

        {game.description && (
          <p className={styles.description}>{game.description}</p>
        )}

        {game.categories.length > 0 && (
          <ul className={styles.tags}>
            {game.categories.map((category) => (
              <li key={category} className={styles.tag}>
                {category}
              </li>
            ))}
          </ul>
        )}

        {detailed && details.length > 0 && (
          <dl className={styles.details}>
            {details.map((detail) => (
              <DetailRow
                key={detail.label}
                label={detail.label}
                value={detail.value}
              />
            ))}
          </dl>
        )}

        {(game.editeur.length > 0 || game.auteurs.length > 0) && (
          <p className={styles.credits}>
            {game.auteurs.length > 0 && <span>{game.auteurs.join(", ")}</span>}
            {game.editeur.length > 0 && (
              <span className={styles.publisher}>{game.editeur[0]}</span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
