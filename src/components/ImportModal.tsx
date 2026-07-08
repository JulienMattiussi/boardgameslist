"use client";

import { useRef, useState } from "react";
import { Game } from "@/lib/games";
import { BggGame } from "@/lib/bgg/map";
import { MyludoImport, ImportPlan } from "@/lib/myludo/types";
import { parseCollection, formatFromName, ImportSource } from "@/lib/import";
import { buildImportPlan } from "@/lib/myludo/dedup";
import {
  compareGames,
  isIdenticalDuplicate,
  CardRow,
} from "@/lib/myludo/compare";
import { newFields, mergeFields } from "@/lib/myludo/merge";
import { CloseIcon } from "./icons";
import { IconButton } from "./ui/IconButton";
import { Button } from "./ui/Button";
import styles from "./ImportModal.module.css";

type Props = {
  games: Game[];
  onClose: () => void;
  onImported: () => void;
};

type Operation = { rowIndex: number | null; fields: Record<string, unknown> };

type Side = "existing" | "import";

type Decision = {
  keepBoth: boolean;
  picks: Record<string, Side>;
  shortcut: Side | "both" | null;
};

const MATCH_LABELS: Record<"myludo_id" | "bgg_id" | "ean", string> = {
  myludo_id: "identifiant Myludo",
  bgg_id: "identifiant BGG",
  ean: "code-barres (EAN)",
};

const ENRICH_CONCURRENCY = 4;

function conflictLabels(rows: CardRow[]): string[] {
  return rows
    .filter((row) => row.status === "conflict")
    .map((row) => row.label);
}

function isEmptyList(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function isEmptyText(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === "";
}

function enrichFields(fields: Record<string, unknown>, bgg: BggGame): void {
  if (isEmptyList(fields.categories)) fields.categories = bgg.categories;
  if (isEmptyList(fields.themes)) fields.themes = bgg.themes;
  if (isEmptyList(fields.mecanismes)) fields.mecanismes = bgg.mecanismes;
  if (isEmptyList(fields.auteurs)) fields.auteurs = bgg.auteurs;
  if (isEmptyList(fields.editeur)) fields.editeur = bgg.editeur;
  if (isEmptyText(fields.image)) fields.image = bgg.image;
  if (isEmptyText(fields.description)) fields.description = bgg.description;
  if (fields.noteMoyenne === undefined || fields.noteMoyenne === null) {
    fields.noteMoyenne = bgg.noteMoyenne;
  }
}

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (index < items.length) {
        await worker(items[index++]);
      }
    },
  );
  await Promise.all(runners);
}

async function fetchBggGame(bggId: string): Promise<BggGame | null> {
  const data = await fetch(`/api/bgg/thing?id=${encodeURIComponent(bggId)}`)
    .then((res) => (res.ok ? res.json() : null))
    .catch(() => null);
  return (data?.game as BggGame | undefined) ?? null;
}

export function ImportModal({ games, onClose, onImported }: Props) {
  const [fileName, setFileName] = useState("");
  const [imports, setImports] = useState<MyludoImport[] | null>(null);
  const [source, setSource] = useState<ImportSource>("myludo");
  const [parseError, setParseError] = useState("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [skipNew, setSkipNew] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);
  const [decisions, setDecisions] = useState<Map<number, Decision>>(new Map());
  const [enrichTotal, setEnrichTotal] = useState(0);
  const [enrichDone, setEnrichDone] = useState(0);
  const cancelEnrich = useRef(false);

  async function onPick(file: File | null) {
    setFileName(file?.name ?? "");
    setImports(null);
    setParseError("");
    if (!file) {
      return;
    }
    const format = formatFromName(file.name);
    if (!format) {
      setParseError("Format non reconnu (attendu : csv, json ou xlsx).");
      return;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const parsed = parseCollection(format, bytes);
      setSource(parsed.source);
      setImports(parsed.imports);
    } catch (err) {
      setParseError(`Fichier illisible : ${(err as Error).message}`);
    }
  }

  function toggleSkip(key: number) {
    setSkipNew((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function toggleSkipAll(indices: number[], skip: boolean) {
    setSkipNew((prev) => {
      const next = new Set(prev);
      for (const index of indices) {
        if (skip) {
          next.add(index);
        } else {
          next.delete(index);
        }
      }
      return next;
    });
  }

  function applyShortcut(
    index: number,
    labels: string[],
    choice: Side | "both",
  ) {
    setDecisions((prev) => {
      const next = new Map(prev);
      if (choice === "both") {
        next.set(index, { keepBoth: true, picks: {}, shortcut: "both" });
      } else {
        const picks: Record<string, Side> = {};
        labels.forEach((label) => {
          picks[label] = choice;
        });
        next.set(index, { keepBoth: false, picks, shortcut: choice });
      }
      return next;
    });
  }

  function pickField(index: number, label: string, side: Side) {
    setDecisions((prev) => {
      const next = new Map(prev);
      const current = next.get(index);
      const base = current && !current.keepBoth ? current.picks : {};
      next.set(index, {
        keepBoth: false,
        picks: { ...base, [label]: side },
        shortcut: null,
      });
      return next;
    });
  }

  function isResolved(index: number, labels: string[]): boolean {
    const decision = decisions.get(index);
    if (!decision) {
      return false;
    }
    if (decision.keepBoth) {
      return true;
    }
    return labels.every((label) => label in decision.picks);
  }

  const resolveSource = (existingSource?: string): string => {
    if (source === "myludo") {
      return "myludo";
    }
    return existingSource === "myludo" ? "myludo" : "bgg";
  };

  function buildOperations(current: ImportPlan): Operation[] {
    const operations: Operation[] = [];
    current.entries.forEach((entry, index) => {
      if (entry.kind === "new") {
        if (!skipNew.has(index)) {
          operations.push({
            rowIndex: null,
            fields: newFields(entry.incoming, resolveSource()),
          });
        }
        return;
      }
      const rows = compareGames(entry.existing, entry.incoming);
      if (entry.kind === "match" && isIdenticalDuplicate(rows)) {
        const target = resolveSource(entry.existing.source);
        const injectsId =
          (entry.incoming.bggId !== "" && entry.existing.bggId === "") ||
          (entry.incoming.myludoId !== "" && entry.existing.myludoId === "");
        if (entry.existing.source !== target || injectsId) {
          operations.push({
            rowIndex: entry.existing.rowIndex,
            fields: mergeFields(entry.existing, entry.incoming, [], target),
          });
        }
        return;
      }
      const decision = decisions.get(index);
      if (!decision) {
        return;
      }
      if (decision.keepBoth) {
        operations.push({
          rowIndex: null,
          fields: newFields(entry.incoming, resolveSource()),
        });
        return;
      }
      if (decision.shortcut === "existing") {
        return;
      }
      const replaceKeys = rows
        .filter(
          (row) =>
            row.status === "conflict" && decision.picks[row.label] === "import",
        )
        .flatMap((row) => row.keys);
      operations.push({
        rowIndex: entry.existing.rowIndex,
        fields: mergeFields(
          entry.existing,
          entry.incoming,
          replaceKeys,
          resolveSource(entry.existing.source),
        ),
      });
    });
    return operations;
  }

  async function apply() {
    if (!plan) {
      return;
    }
    setBusy(true);
    setError("");
    const operations = buildOperations(plan);

    const enrichable = operations.filter(
      (op) => typeof op.fields.bggId === "string" && op.fields.bggId !== "",
    );
    if (enrichable.length > 0) {
      cancelEnrich.current = false;
      setEnrichTotal(enrichable.length);
      setEnrichDone(0);
      await runPool(enrichable, ENRICH_CONCURRENCY, async (op) => {
        if (cancelEnrich.current) {
          return;
        }
        const game = await fetchBggGame(String(op.fields.bggId));
        if (game) {
          enrichFields(op.fields, game);
        }
        setEnrichDone((done) => done + 1);
      });
      setEnrichTotal(0);
    }

    const res = await fetch("/api/import/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operations }),
    });
    setBusy(false);
    if (res.ok) {
      onImported();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import impossible.");
    }
  }

  const entries = plan
    ? plan.entries.map((entry, index) => ({ entry, index }))
    : [];
  const news = entries.filter(({ entry }) => entry.kind === "new");
  const compared = entries.flatMap(({ entry, index }) => {
    if (entry.kind === "new") {
      return [];
    }
    const rows = compareGames(entry.existing, entry.incoming);
    const identical = entry.kind === "match" && isIdenticalDuplicate(rows);
    return [{ entry, index, rows, identical }];
  });
  const duplicates = compared.filter((item) => item.identical);
  const toValidate = compared.filter((item) => !item.identical);

  const current = plan && step < toValidate.length ? toValidate[step] : null;
  const currentConflicts = current ? conflictLabels(current.rows) : [];
  const currentResolved = current
    ? isResolved(current.index, currentConflicts)
    : false;
  const decision = current ? decisions.get(current.index) : undefined;
  const canKeepBoth = !(
    current?.entry.kind === "match" && current.entry.matchedBy === "myludo_id"
  );
  const remaining = toValidate.filter(
    (item) => !isResolved(item.index, conflictLabels(item.rows)),
  ).length;
  const reviewComplete = remaining === 0;
  const isLastStep = step >= toValidate.length - 1;
  const importCount = plan ? buildOperations(plan).length : 0;

  function pickOf(label: string): Side | undefined {
    return decision && !decision.keepBoth ? decision.picks[label] : undefined;
  }

  function renderValue(row: CardRow, side: Side) {
    const value = (side === "existing" ? row.existing : row.incoming) || "-";
    if (row.status === "conflict" && current) {
      const selected = pickOf(row.label) === side;
      return (
        <button
          type="button"
          className={`${styles.pick} ${selected ? styles.pickOn : styles.pickOff}`}
          onClick={() => pickField(current.index, row.label, side)}
          disabled={decision?.keepBoth}
        >
          {value}
        </button>
      );
    }
    const isNew = row.status === "fill" && side === "import";
    return <span className={isNew ? styles.add : ""}>{value}</span>;
  }

  function renderCardRow(row: CardRow, side: Side) {
    const isConflict = row.status === "conflict" && current;
    return (
      <div key={row.label} className={styles.cardRow}>
        <span className={isConflict ? styles.conflictLabel : styles.cardLabel}>
          {isConflict && current && (
            <input
              type="radio"
              name={`field-${current.index}-${row.label}`}
              checked={pickOf(row.label) === side}
              onChange={() => pickField(current.index, row.label, side)}
              disabled={decision?.keepBoth}
            />
          )}
          {row.label}
        </span>
        {renderValue(row, side)}
      </div>
    );
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Importer une collection"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Importer une collection</h2>
          <IconButton label="Fermer" variant="ghost" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>

        <div className={styles.body}>
          {!plan && (
            <div className={styles.pick}>
              <p className={styles.hint}>
                Export Myludo (CSV, JSON ou XLSX) ou collection BoardGameGeek
                (CSV). Le format est detecte automatiquement.
              </p>
              <label className={styles.filePick}>
                <input
                  type="file"
                  accept=".csv,.json,.xlsx"
                  className={styles.fileInput}
                  onChange={(event) => onPick(event.target.files?.[0] ?? null)}
                />
                <span className={styles.fileButton}>Choisir un fichier</span>
                <span className={styles.fileName}>
                  {fileName || "Aucun fichier selectionne"}
                </span>
              </label>
              {imports && (
                <p className={styles.valid}>
                  Fichier {source === "bgg" ? "BoardGameGeek" : "Myludo"} :{" "}
                  {imports.length} {imports.length > 1 ? "jeux" : "jeu"} detecte
                  {imports.length > 1 ? "s" : ""}.
                </p>
              )}
              {parseError && <p className={styles.invalid}>{parseError}</p>}
            </div>
          )}

          {plan && (
            <div className={styles.review}>
              <div className={styles.lists}>
                <section>
                  <h3 className={styles.section}>
                    Nouveaux jeux ({news.length})
                    {news.length > 0 && (
                      <button
                        type="button"
                        className={styles.selectAll}
                        onClick={() =>
                          toggleSkipAll(
                            news.map(({ index }) => index),
                            news.every(({ index }) => !skipNew.has(index)),
                          )
                        }
                      >
                        {news.every(({ index }) => !skipNew.has(index))
                          ? "Tout decocher"
                          : "Tout cocher"}
                      </button>
                    )}
                  </h3>
                  <p className={styles.hint}>
                    {news.length === 0
                      ? "Aucun nouveau jeu dans ce fichier."
                      : "Absents de la collection. Decochez ceux a ne pas ajouter."}
                  </p>
                  {news.map(({ entry, index }) =>
                    entry.kind === "new" ? (
                      <label key={index} className={styles.row}>
                        <input
                          type="checkbox"
                          checked={!skipNew.has(index)}
                          onChange={() => toggleSkip(index)}
                        />
                        {entry.incoming.titre}
                        {entry.incoming.categories.length > 0 && (
                          <span className={styles.cat}>
                            {entry.incoming.categories.join(", ")}
                          </span>
                        )}
                      </label>
                    ) : null,
                  )}
                </section>

                <section>
                  <h3 className={styles.section}>
                    Doublons ({duplicates.length})
                  </h3>
                  <p className={styles.hint}>
                    {duplicates.length === 0
                      ? "Aucun doublon present."
                      : "Deja dans la collection, identiques a l'export. Rien a importer."}
                  </p>
                  {duplicates.map(({ entry, index }) => (
                    <label key={index} className={styles.row}>
                      <input
                        type="checkbox"
                        checked={false}
                        disabled
                        readOnly
                      />
                      {entry.incoming.titre}
                      {entry.incoming.categories.length > 0 && (
                        <span className={styles.cat}>
                          {entry.incoming.categories.join(", ")}
                        </span>
                      )}
                    </label>
                  ))}
                </section>
              </div>

              <section>
                <h3 className={styles.section}>
                  Correspondances a valider ({toValidate.length}
                  {remaining > 0 ? ` / ${remaining} restant` : ""})
                </h3>
                {toValidate.length === 0 && (
                  <p className={styles.hint}>
                    Aucune correspondance a valider.
                  </p>
                )}
                {current && (
                  <div className={styles.validate}>
                    <p className={styles.hint}>
                      Comparaison {step + 1} / {toValidate.length}. Champs vides
                      completes automatiquement ; pour un conflit (en rouge),
                      cliquez la valeur a conserver.
                    </p>
                    <div className={styles.validateHead}>
                      {current.entry.incoming.titre}
                      <span className={styles.by}>
                        {current.entry.kind === "match"
                          ? `trouve par ${MATCH_LABELS[current.entry.matchedBy]}`
                          : `titre proche de ${current.entry.existing.titre}`}
                      </span>
                    </div>
                    <div className={styles.cards}>
                      <div className={styles.card}>
                        <div className={styles.cardHead}>Actuel</div>
                        {current.rows
                          .filter((row) => row.existing || row.incoming)
                          .map((row) => renderCardRow(row, "existing"))}
                      </div>
                      <div className={styles.card}>
                        <div className={styles.cardHead}>Import</div>
                        {current.rows
                          .filter((row) => row.existing || row.incoming)
                          .map((row) => renderCardRow(row, "import"))}
                      </div>
                    </div>
                    <div className={styles.wizard}>
                      <div className={styles.choice}>
                        <label>
                          <input
                            type="radio"
                            name={`validate-${current.index}`}
                            checked={decision?.shortcut === "existing"}
                            onChange={() =>
                              applyShortcut(
                                current.index,
                                currentConflicts,
                                "existing",
                              )
                            }
                          />
                          Garder l&apos;actuel
                        </label>
                        <label>
                          <input
                            type="radio"
                            name={`validate-${current.index}`}
                            checked={decision?.shortcut === "import"}
                            onChange={() =>
                              applyShortcut(
                                current.index,
                                currentConflicts,
                                "import",
                              )
                            }
                          />
                          Garder l&apos;import
                        </label>
                        {canKeepBoth && (
                          <label>
                            <input
                              type="radio"
                              name={`validate-${current.index}`}
                              checked={decision?.shortcut === "both"}
                              onChange={() =>
                                applyShortcut(
                                  current.index,
                                  currentConflicts,
                                  "both",
                                )
                              }
                            />
                            Garder les deux
                          </label>
                        )}
                        <div className={styles.nav}>
                          <Button
                            variant="secondary"
                            onClick={() => setStep(step - 1)}
                            disabled={step === 0}
                          >
                            Precedent
                          </Button>
                          <Button
                            onClick={() => setStep(step + 1)}
                            disabled={!currentResolved || isLastStep}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {toValidate.length > 0 && (
                  <p
                    className={`${styles.status} ${remaining === 0 ? styles.statusDone : ""}`}
                  >
                    {remaining > 0
                      ? `${remaining} choix restant${remaining > 1 ? "s" : ""} pour valider l'import.`
                      : "Tous les choix sont faits. Cliquez sur Importer."}
                  </p>
                )}
              </section>
            </div>
          )}

          {error && <p className={styles.invalid}>{error}</p>}
        </div>

        <footer className={styles.footer}>
          {enrichTotal > 0 && (
            <span className={styles.progress}>
              Enrichissement BGG {enrichDone}/{enrichTotal}
              <button
                type="button"
                className={styles.skip}
                onClick={() => {
                  cancelEnrich.current = true;
                }}
              >
                Passer
              </button>
            </span>
          )}
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Annuler
          </Button>
          {plan ? (
            <Button
              onClick={apply}
              disabled={busy || !reviewComplete || importCount === 0}
            >
              {busy
                ? enrichTotal > 0
                  ? "Enrichissement..."
                  : "Import..."
                : `Importer ${importCount} ${importCount > 1 ? "jeux" : "jeu"}`}
            </Button>
          ) : (
            <Button
              onClick={() =>
                imports && setPlan(buildImportPlan(imports, games))
              }
              disabled={!imports}
            >
              Analyser
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
