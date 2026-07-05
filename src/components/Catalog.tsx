"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Game } from "@/lib/games";
import { filterGames, sortGames, SortKey, GameKind } from "@/lib/filter";
import { GameList } from "./GameList";
import { PrintList } from "./PrintList";
import { GameFormModal } from "./GameFormModal";
import {
  SearchIcon,
  PlayersIcon,
  ClockIcon,
  PrinterIcon,
  PlusIcon,
} from "./icons";
import styles from "./Catalog.module.css";

type Props = {
  games: Game[];
};

const PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const DURATION_OPTIONS = [
  { key: "court", label: "< 30 min", min: 0, max: 29 },
  { key: "moyen", label: "30-60 min", min: 30, max: 60 },
  { key: "long", label: "1-2 h", min: 61, max: 120 },
  { key: "epique", label: "2 h +", min: 121, max: Number.POSITIVE_INFINITY },
];

const SORT_LABELS: Record<SortKey, string> = {
  titre: "Titre (A-Z)",
  notePerso: "Meilleure note perso",
  noteMoyenne: "Meilleure note moyenne",
  duree: "Duree croissante",
  age: "Age minimum",
};

const KIND_OPTIONS: { value: "" | GameKind; label: string }[] = [
  { value: "", label: "Tous les types" },
  { value: "societe", label: "Jeu de societe" },
  { value: "enigme", label: "Enigme / Enquete" },
];

export function Catalog({ games }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = Boolean(session?.user);

  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<number | null>(null);
  const [durationKey, setDurationKey] = useState<string | null>(null);
  const [kind, setKind] = useState<"" | GameKind>("");
  const [sort, setSort] = useState<SortKey>("titre");
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailed, setDetailed] = useState(false);

  const openCreate = () => {
    setEditGame(null);
    setModalOpen(true);
  };
  const openEdit = (game: Game) => {
    setEditGame(game);
    setModalOpen(true);
  };
  const onSaved = () => {
    setModalOpen(false);
    router.refresh();
  };

  const visible = useMemo(() => {
    const bucket = DURATION_OPTIONS.find((option) => option.key === durationKey);
    return sortGames(
      filterGames(games, {
        query,
        players,
        duration: bucket ? { min: bucket.min, max: bucket.max } : null,
        kind: kind === "" ? null : kind,
      }),
      sort
    );
  }, [games, query, players, durationKey, kind, sort]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (query.trim()) parts.push(`« ${query.trim()} »`);
    if (players !== null) parts.push(`${players} joueurs`);
    const bucket = DURATION_OPTIONS.find((option) => option.key === durationKey);
    if (bucket) parts.push(bucket.label);
    const kindOption = KIND_OPTIONS.find(
      (option) => option.value !== "" && option.value === kind
    );
    if (kindOption) parts.push(kindOption.label);
    return parts.join(" · ");
  }, [query, players, durationKey, kind]);

  return (
    <section>
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Rechercher un jeu, un auteur, une categorie..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Rechercher"
          />
        </div>

        <select
          className={styles.select}
          value={kind}
          onChange={(event) => setKind(event.target.value as "" | GameKind)}
          aria-label="Type de jeu"
        >
          {KIND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className={styles.sort}>
          <span className={styles.sortLabel}>Trier par</span>
          <select
            className={styles.select}
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.filters}>
        <div
          className={styles.filterGroup}
          role="group"
          aria-label="Filtrer par nombre de joueurs"
        >
          <span className={styles.groupIcon} title="Nombre de joueurs" aria-hidden>
            <PlayersIcon />
          </span>
          <button
            type="button"
            className={players === null ? styles.chipActive : styles.chip}
            onClick={() => setPlayers(null)}
          >
            Tous
          </button>
          {PLAYER_OPTIONS.map((count) => (
            <button
              key={count}
              type="button"
              className={players === count ? styles.chipActive : styles.chip}
              onClick={() => setPlayers(players === count ? null : count)}
            >
              {count}
            </button>
          ))}
        </div>

        <div
          className={`${styles.filterGroup} ${styles.filterGroupEnd}`}
          role="group"
          aria-label="Filtrer par duree"
        >
          {[...DURATION_OPTIONS].reverse().map((option) => (
            <button
              key={option.key}
              type="button"
              className={
                durationKey === option.key ? styles.chipActive : styles.chip
              }
              onClick={() =>
                setDurationKey(durationKey === option.key ? null : option.key)
              }
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            className={durationKey === null ? styles.chipActive : styles.chip}
            onClick={() => setDurationKey(null)}
          >
            Toutes
          </button>
          <span className={styles.groupIcon} title="Duree" aria-hidden>
            <ClockIcon />
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <button
            type="button"
            className={detailed ? styles.chipActive : styles.chip}
            onClick={() => setDetailed((value) => !value)}
            aria-pressed={detailed}
          >
            {detailed ? "Moins d'infos" : "Plus d'infos"}
          </button>
          <p className={styles.count}>
            {visible.length} {visible.length > 1 ? "jeux" : "jeu"}
          </p>
        </div>
        <div className={styles.actionButtons}>
          {canEdit && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={openCreate}
              title="Ajouter un jeu"
              aria-label="Ajouter un jeu"
            >
              <PlusIcon className={styles.printIcon} />
            </button>
          )}
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => window.print()}
            title="Imprimer la liste"
            aria-label="Imprimer la liste"
          >
            <PrinterIcon className={styles.printIcon} />
          </button>
        </div>
      </div>

      <div className={styles.screenList}>
        <GameList
          games={visible}
          onEdit={canEdit ? openEdit : undefined}
          detailed={detailed}
        />
      </div>

      <PrintList games={visible} summary={summary} />

      {modalOpen && (
        <GameFormModal
          game={editGame}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}
    </section>
  );
}
