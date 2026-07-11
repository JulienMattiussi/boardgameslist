"use client";

import { useEffect, useMemo, useState } from "react";
import { Game } from "@/lib/games";
import {
  buildPrintSections,
  columnCountFor,
  PrintConfig,
  PrintDensity,
  SoloFilter,
} from "@/lib/print";
import { Chip } from "./ui/Chip";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { CloseIcon, PrinterIcon } from "./icons";
import styles from "./PrintModal.module.css";

type Props = {
  games: Game[];
  summary: string;
  onClose: () => void;
  onPrint: (config: PrintConfig) => void;
};

const DENSITY_OPTIONS: {
  value: PrintDensity;
  label: string;
  hint: string;
}[] = [
  {
    value: "rich",
    label: "Riche",
    hint: "Ajoute image, categories et themes. Moins de jeux par page.",
  },
  {
    value: "normal",
    label: "Normale",
    hint: "Titre, nombre de joueurs et duree.",
  },
  {
    value: "compact",
    label: "Compacte",
    hint: "Interligne et police resserres pour placer plus de jeux par page.",
  },
];

const SOLO_OPTIONS: { value: SoloFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "only", label: "Solo uniquement" },
  { value: "exclude", label: "Sans les jeux solo" },
];

const PREVIEW_MAX_ROWS = 14;

const STORAGE_KEY = "boardgameslist.print-options";

const DEFAULT_CONFIG: PrintConfig = {
  density: "normal",
  splitByType: false,
  splitByCategory: false,
  splitByTheme: false,
  splitByMechanic: false,
  splitByDuration: false,
  splitByPlayers: false,
  solo: "all",
};

function loadStoredConfig(): PrintConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveStoredConfig(config: PrintConfig): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    return;
  }
}

export function PrintModal({ games, summary, onClose, onPrint }: Props) {
  const initial = useMemo(() => loadStoredConfig(), []);
  const [density, setDensity] = useState<PrintDensity>(initial.density);
  const [splitByType, setSplitByType] = useState(initial.splitByType);
  const [splitByCategory, setSplitByCategory] = useState(
    initial.splitByCategory,
  );
  const [splitByTheme, setSplitByTheme] = useState(initial.splitByTheme);
  const [splitByMechanic, setSplitByMechanic] = useState(
    initial.splitByMechanic,
  );
  const [splitByDuration, setSplitByDuration] = useState(
    initial.splitByDuration,
  );
  const [splitByPlayers, setSplitByPlayers] = useState(initial.splitByPlayers);
  const [solo, setSolo] = useState<SoloFilter>(initial.solo);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    saveStoredConfig({
      density,
      splitByType,
      splitByCategory,
      splitByTheme,
      splitByMechanic,
      splitByDuration,
      splitByPlayers,
      solo,
    });
  }, [
    density,
    splitByType,
    splitByCategory,
    splitByTheme,
    splitByMechanic,
    splitByDuration,
    splitByPlayers,
    solo,
  ]);

  const sections = useMemo(
    () =>
      buildPrintSections(games, {
        density,
        splitByType,
        splitByCategory,
        splitByTheme,
        splitByMechanic,
        splitByDuration,
        splitByPlayers,
        solo,
      }),
    [
      games,
      density,
      splitByType,
      splitByCategory,
      splitByTheme,
      splitByMechanic,
      splitByDuration,
      splitByPlayers,
      solo,
    ],
  );

  const totalGames = useMemo(
    () => sections.reduce((sum, section) => sum + section.games.length, 0),
    [sections],
  );

  const previews = useMemo(
    () =>
      sections.map((section) => ({
        label: section.label,
        count: section.games.length,
        games: section.games,
      })),
    [sections],
  );

  const print = () => {
    if (totalGames === 0) {
      return;
    }
    onPrint({
      density,
      splitByType,
      splitByCategory,
      splitByTheme,
      splitByMechanic,
      splitByDuration,
      splitByPlayers,
      solo,
    });
  };

  const rich = density === "rich";
  const compact = density === "compact";

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Options d'impression"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Imprimer</h2>
          <IconButton label="Fermer" variant="ghost" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>

        <div className={styles.body}>
          <div className={styles.options}>
            <fieldset className={styles.group}>
              <legend className={styles.legend}>Densite</legend>
              <div className={styles.choices}>
                {DENSITY_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    active={density === option.value}
                    onClick={() => setDensity(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
              <p className={styles.hint}>
                {DENSITY_OPTIONS.find((option) => option.value === density)
                  ?.hint ?? ""}
              </p>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>
                Decouper en pages
                <span className={styles.legendNote}> (cumulables)</span>
              </legend>
              <div className={styles.choices}>
                <Chip
                  active={splitByType}
                  onClick={() => setSplitByType((value) => !value)}
                >
                  Par type de jeu
                </Chip>
                <Chip
                  active={splitByCategory}
                  onClick={() => setSplitByCategory((value) => !value)}
                >
                  Par categorie
                </Chip>
                <Chip
                  active={splitByTheme}
                  onClick={() => setSplitByTheme((value) => !value)}
                >
                  Par theme
                </Chip>
                <Chip
                  active={splitByMechanic}
                  onClick={() => setSplitByMechanic((value) => !value)}
                >
                  Par mecanique
                </Chip>
                <Chip
                  active={splitByDuration}
                  onClick={() => setSplitByDuration((value) => !value)}
                >
                  Par duree
                </Chip>
                <Chip
                  active={splitByPlayers}
                  onClick={() => setSplitByPlayers((value) => !value)}
                >
                  Par nombre de joueurs
                </Chip>
              </div>
              <p className={styles.hint}>
                Une page est generee pour chaque combinaison. Un jeu peut
                apparaitre sur plusieurs pages (plusieurs categories, themes,
                mecaniques, tranches de duree ou nombres de joueurs).
              </p>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>Jeux solo</legend>
              <div className={styles.choices}>
                {SOLO_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    active={solo === option.value}
                    onClick={() => setSolo(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </fieldset>
          </div>

          <div className={styles.previewPane}>
            <p className={styles.previewTitle}>
              Apercu ({previews.length} {previews.length > 1 ? "pages" : "page"}
              )
            </p>
            {previews.length === 0 ? (
              <p className={styles.empty}>Aucun jeu a imprimer.</p>
            ) : (
              <div className={styles.previewGrid}>
                {previews.map((preview, index) => (
                  <figure key={index} className={styles.page}>
                    <div className={styles.pageHeader}>
                      <span className={styles.pageBar} />
                      {preview.label && (
                        <span className={styles.pageLabel}>
                          {preview.label}
                        </span>
                      )}
                    </div>
                    <div
                      className={`${styles.pageColumns} ${
                        compact ? styles.pageColumnsCompact : ""
                      }`}
                      style={{ columnCount: columnCountFor(density) }}
                    >
                      {preview.games
                        .slice(
                          0,
                          (compact ? PREVIEW_MAX_ROWS * 2 : PREVIEW_MAX_ROWS) *
                            columnCountFor(density),
                        )
                        .map((game) => (
                          <span key={game.rowIndex} className={styles.row}>
                            {rich && <span className={styles.rowThumb} />}
                            <span className={styles.rowLines}>
                              <span className={styles.rowMain} />
                              {rich && <span className={styles.rowSub} />}
                              {rich && <span className={styles.rowSub} />}
                            </span>
                          </span>
                        ))}
                    </div>
                    <figcaption className={styles.pageCaption}>
                      {preview.label ? `${preview.label} · ` : ""}
                      {preview.count} {preview.count > 1 ? "jeux" : "jeu"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <p className={styles.summary}>
            {previews.length} {previews.length > 1 ? "pages" : "page"} ·{" "}
            {totalGames} {totalGames > 1 ? "jeux" : "jeu"}
          </p>
          <div className={styles.footerActions}>
            <Button variant="secondary" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={print} disabled={totalGames === 0}>
              <span className={styles.printLabel}>
                <PrinterIcon />
                Imprimer
              </span>
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
