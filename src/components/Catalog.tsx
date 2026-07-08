"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Game } from "@/lib/games";
import {
  filterGames,
  sortGames,
  SortKey,
  SortDirection,
  NATURAL_SORT_DIRECTION,
  GameKind,
} from "@/lib/filter";
import { buildPrintSections, PrintConfig, PrintJob } from "@/lib/print";
import { GameList } from "./GameList";
import { PrintDocument } from "./PrintDocument";
import { PrintModal } from "./PrintModal";
import { GameFormModal } from "./GameFormModal";
import { ImportModal } from "./ImportModal";
import { Chip } from "./ui/Chip";
import { IconButton } from "./ui/IconButton";
import {
  SearchIcon,
  PlayersIcon,
  ClockIcon,
  PrinterIcon,
  PlusIcon,
  UploadIcon,
  ArrowDownIcon,
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
  titre: "Titre",
  notePerso: "Note perso",
  noteMoyenne: "Note moyenne",
  duree: "Duree",
  age: "Age",
  dateAcquisition: "Date d'acquisition",
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
  const [direction, setDirection] = useState<SortDirection>(
    NATURAL_SORT_DIRECTION.titre,
  );
  const [editGame, setEditGame] = useState<Game | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printJob, setPrintJob] = useState<PrintJob | null>(null);
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
    const bucket = DURATION_OPTIONS.find(
      (option) => option.key === durationKey,
    );
    return sortGames(
      filterGames(games, {
        query,
        players,
        duration: bucket ? { min: bucket.min, max: bucket.max } : null,
        kind: kind === "" ? null : kind,
      }),
      sort,
      direction,
    );
  }, [games, query, players, durationKey, kind, sort, direction]);

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (query.trim()) parts.push(`« ${query.trim()} »`);
    if (players !== null) parts.push(`${players} joueurs`);
    const bucket = DURATION_OPTIONS.find(
      (option) => option.key === durationKey,
    );
    if (bucket) parts.push(bucket.label);
    const kindOption = KIND_OPTIONS.find(
      (option) => option.value !== "" && option.value === kind,
    );
    if (kindOption) parts.push(kindOption.label);
    return parts.join(" · ");
  }, [query, players, durationKey, kind]);

  const startPrint = (config: PrintConfig) => {
    setPrintJob({
      sections: buildPrintSections(visible, config),
      summary,
      config,
    });
    setPrintOpen(false);
  };

  useEffect(() => {
    if (!printJob) {
      return;
    }
    const onAfterPrint = () => setPrintJob(null);
    window.addEventListener("afterprint", onAfterPrint);
    window.print();
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, [printJob]);

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

        <div className={styles.sort}>
          <span className={styles.sortLabel}>Trier par</span>
          <div className={styles.sortControl}>
            <select
              className={styles.sortSelect}
              value={sort}
              aria-label="Trier par"
              onChange={(event) => {
                const key = event.target.value as SortKey;
                setSort(key);
                setDirection(NATURAL_SORT_DIRECTION[key]);
              }}
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_LABELS[key]}
                </option>
              ))}
            </select>
            <IconButton
              variant="ghost"
              className={styles.directionButton}
              label={
                direction === "asc" ? "Ordre croissant" : "Ordre decroissant"
              }
              onClick={() =>
                setDirection((current) => (current === "asc" ? "desc" : "asc"))
              }
            >
              <ArrowDownIcon
                className={
                  direction === "asc" ? styles.sortArrowAsc : undefined
                }
              />
            </IconButton>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div
          className={styles.filterGroup}
          role="group"
          aria-label="Filtrer par nombre de joueurs"
        >
          <span
            className={styles.groupIcon}
            title="Nombre de joueurs"
            aria-hidden
          >
            <PlayersIcon />
          </span>
          <Chip active={players === null} onClick={() => setPlayers(null)}>
            Tous
          </Chip>
          {PLAYER_OPTIONS.map((count) => (
            <Chip
              key={count}
              active={players === count}
              onClick={() => setPlayers(players === count ? null : count)}
            >
              {count}
            </Chip>
          ))}
        </div>

        <div
          className={`${styles.filterGroup} ${styles.filterGroupEnd}`}
          role="group"
          aria-label="Filtrer par duree"
        >
          {[...DURATION_OPTIONS].reverse().map((option) => (
            <Chip
              key={option.key}
              active={durationKey === option.key}
              onClick={() =>
                setDurationKey(durationKey === option.key ? null : option.key)
              }
            >
              {option.label}
            </Chip>
          ))}
          <Chip
            active={durationKey === null}
            onClick={() => setDurationKey(null)}
          >
            Toutes
          </Chip>
          <span className={styles.groupIcon} title="Duree" aria-hidden>
            <ClockIcon />
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.actionsLeft}>
          <Chip
            active={detailed}
            onClick={() => setDetailed((value) => !value)}
          >
            {detailed ? "Moins d'infos" : "Plus d'infos"}
          </Chip>
          <p className={styles.count}>
            {visible.length} {visible.length > 1 ? "jeux" : "jeu"}
          </p>
        </div>
        <div className={styles.actionButtons}>
          {canEdit && (
            <IconButton label="Ajouter un jeu" onClick={openCreate}>
              <PlusIcon />
            </IconButton>
          )}
          {canEdit && (
            <IconButton
              label="Importer une collection"
              onClick={() => setImportOpen(true)}
            >
              <UploadIcon />
            </IconButton>
          )}
          <IconButton
            label="Imprimer la liste"
            onClick={() => setPrintOpen(true)}
          >
            <PrinterIcon />
          </IconButton>
        </div>
      </div>

      <div className={styles.screenList}>
        <GameList
          games={visible}
          onEdit={canEdit ? openEdit : undefined}
          detailed={detailed}
        />
      </div>

      {printJob && <PrintDocument job={printJob} />}

      {printOpen && (
        <PrintModal
          games={visible}
          summary={summary}
          onClose={() => setPrintOpen(false)}
          onPrint={startPrint}
        />
      )}

      {modalOpen && (
        <GameFormModal
          game={editGame}
          onClose={() => setModalOpen(false)}
          onSaved={onSaved}
        />
      )}

      {importOpen && (
        <ImportModal
          games={games}
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            router.refresh();
          }}
        />
      )}
    </section>
  );
}
