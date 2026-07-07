"use client";

import { useEffect, useMemo, useState } from "react";
import { Game } from "@/lib/games";
import {
  buildPrintSections,
  layoutColumns,
  PrintConfig,
  PrintRichness,
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

const RICHNESS_OPTIONS: { value: PrintRichness; label: string }[] = [
  { value: "minimal", label: "Minimale" },
  { value: "rich", label: "Riche (image, categories, themes)" },
];

const SOLO_OPTIONS: { value: SoloFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "only", label: "Solo uniquement" },
  { value: "exclude", label: "Sans les jeux solo" },
];

const PREVIEW_MAX_ROWS = 14;

export function PrintModal({ games, summary, onClose, onPrint }: Props) {
  const [richness, setRichness] = useState<PrintRichness>("minimal");
  const [optimizeTitles, setOptimizeTitles] = useState(false);
  const [splitByType, setSplitByType] = useState(false);
  const [splitByDuration, setSplitByDuration] = useState(false);
  const [splitByPlayers, setSplitByPlayers] = useState(false);
  const [solo, setSolo] = useState<SoloFilter>("all");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const sections = useMemo(
    () =>
      buildPrintSections(games, {
        richness,
        optimizeTitles,
        splitByType,
        splitByDuration,
        splitByPlayers,
        solo,
      }),
    [
      games,
      richness,
      optimizeTitles,
      splitByType,
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
        columns: layoutColumns(section.games, optimizeTitles),
      })),
    [sections, optimizeTitles],
  );

  const print = () => {
    if (totalGames === 0) {
      return;
    }
    onPrint({
      richness,
      optimizeTitles,
      splitByType,
      splitByDuration,
      splitByPlayers,
      solo,
    });
  };

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
                {RICHNESS_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    active={richness === option.value}
                    onClick={() => setRichness(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className={styles.group}>
              <legend className={styles.legend}>Mise en page</legend>
              <div className={styles.choices}>
                <Chip
                  active={optimizeTitles}
                  onClick={() => setOptimizeTitles((value) => !value)}
                >
                  {"Optimiser l'espace des titres"}
                </Chip>
              </div>
              <p className={styles.hint}>
                Ignore le tri : regroupe les titres de longueur voisine et
                adapte la largeur des colonnes.
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
                Une page est generee pour chaque combinaison. Le decoupage par
                nombre de joueurs peut faire apparaitre un jeu sur plusieurs
                pages.
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
                    <div className={styles.pageColumns}>
                      {preview.columns.map((column, colIndex) => (
                        <div
                          key={colIndex}
                          className={styles.pageColumn}
                          style={{ flexGrow: column.weight }}
                        >
                          {column.games
                            .slice(0, PREVIEW_MAX_ROWS)
                            .map((game) => (
                              <span key={game.rowIndex} className={styles.row}>
                                {richness === "rich" && (
                                  <span className={styles.rowThumb} />
                                )}
                                <span className={styles.rowLines}>
                                  <span className={styles.rowMain} />
                                  {richness === "rich" && (
                                    <span className={styles.rowSub} />
                                  )}
                                </span>
                              </span>
                            ))}
                        </div>
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
