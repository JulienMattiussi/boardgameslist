import { Game } from "@/lib/games";
import { formatRange, hueFromString, ratingLevel } from "@/lib/format";
import { PlayersIcon, ClockIcon, AgeIcon, StarIcon } from "./icons";
import styles from "./GameCard.module.css";

type Props = {
  game: Game;
};

export function GameCard({ game }: Props) {
  const players = formatRange(game.joueursMin, game.joueursMax);
  const duration = formatRange(game.dureeMin, game.dureeMax);
  const rating = ratingLevel(game.noteMoyenne);
  const hue = hueFromString(game.titre);

  return (
    <article
      className={styles.card}
      style={{ "--card-hue": hue } as React.CSSProperties}
    >
      <div className={styles.banner}>
        {rating && game.noteMoyenne !== null && (
          <span className={`${styles.rating} ${styles[rating]}`}>
            <StarIcon className={styles.star} />
            {game.noteMoyenne.toFixed(1)}
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
        <dl className={styles.meta}>
          {players && (
            <div className={styles.metaItem}>
              <PlayersIcon className={styles.metaIcon} />
              <dd className={styles.metaValue}>{players}</dd>
              <dt className={styles.metaLabel}>joueurs</dt>
            </div>
          )}
          {duration && (
            <div className={styles.metaItem}>
              <ClockIcon className={styles.metaIcon} />
              <dd className={styles.metaValue}>{duration}</dd>
              <dt className={styles.metaLabel}>min</dt>
            </div>
          )}
          {game.age && (
            <div className={styles.metaItem}>
              <AgeIcon className={styles.metaIcon} />
              <dd className={styles.metaValue}>{game.age}</dd>
              <dt className={styles.metaLabel}>age</dt>
            </div>
          )}
        </dl>

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
