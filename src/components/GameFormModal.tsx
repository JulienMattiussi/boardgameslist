"use client";

import { useEffect, useState } from "react";
import { Game } from "@/lib/games";
import { CATEGORIES, THEMES, EDITEURS } from "@/lib/taxonomies";
import {
  CloseIcon,
  TrashIcon,
  TagIcon,
  TextIcon,
  DatabaseIcon,
  CalendarIcon,
  LayersIcon,
  PaletteIcon,
  BuildingIcon,
  GearIcon,
  PersonIcon,
  PinIcon,
  ImageIcon,
  BarcodeIcon,
  HashIcon,
  PlayersIcon,
  ClockIcon,
  AgeIcon,
  StarIcon,
} from "./icons";
import { TagAutocomplete } from "./TagAutocomplete";
import styles from "./GameFormModal.module.css";

type IconComponent = (props: { className?: string }) => React.ReactElement;

type Props = {
  game: Game | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = Record<string, string>;

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  Icon: IconComponent;
  step?: string;
  hint?: string;
};

const FIELDS: FieldDef[] = [
  { key: "mecanismes", label: "Mecanismes", type: "text", Icon: GearIcon, hint: "separes par ;" },
  { key: "auteurs", label: "Auteur(s)", type: "text", Icon: PersonIcon, hint: "separes par ;" },
  { key: "emplacement", label: "Emplacement", type: "text", Icon: PinIcon },
  { key: "image", label: "Image (URL)", type: "text", Icon: ImageIcon },
  { key: "ean", label: "EAN", type: "text", Icon: BarcodeIcon, hint: "separes par ;" },
];

function num(value: number | null): string {
  return value === null ? "" : String(value);
}

const EMPTY_FORM: FormState = {
  titre: "",
  sousTitre: "",
  source: "manuel",
  edition: "",
  joueursMin: "",
  joueursMax: "",
  dureeMin: "",
  dureeMax: "",
  age: "",
  categories: "",
  themes: "",
  mecanismes: "",
  editeur: "",
  auteurs: "",
  notePerso: "",
  noteMoyenne: "",
  dateAcquisition: "",
  emplacement: "",
  image: "",
  ean: "",
  myludoId: "",
  description: "",
};

function gameToForm(game: Game | null): FormState {
  if (!game) {
    return { ...EMPTY_FORM };
  }
  return {
    titre: game.titre,
    source: game.source || "manuel",
    description: game.description,
    sousTitre: game.sousTitre,
    edition: num(game.edition),
    joueursMin: num(game.joueursMin),
    joueursMax: num(game.joueursMax),
    dureeMin: num(game.dureeMin),
    dureeMax: num(game.dureeMax),
    age: game.age,
    categories: game.categories.join("; "),
    themes: game.themes.join("; "),
    mecanismes: game.mecanismes.join("; "),
    editeur: game.editeur.join("; "),
    auteurs: game.auteurs.join("; "),
    notePerso: num(game.notePerso),
    noteMoyenne: num(game.noteMoyenne),
    dateAcquisition: game.dateAcquisition,
    emplacement: game.emplacement,
    image: game.image,
    ean: game.ean.join("; "),
    myludoId: game.myludoId,
  };
}

export function GameFormModal({ game, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => gameToForm(game));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch("/api/games", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rowIndex: game?.rowIndex }),
    });
    setDeleting(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de la suppression.");
      setConfirming(false);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.titre.trim() === "") {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setError("");
    const payload: Record<string, unknown> = { ...form };
    if (game) {
      payload.rowIndex = game.rowIndex;
    }
    const res = await fetch("/api/games", {
      method: game ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erreur lors de l'enregistrement.");
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={game ? "Modifier le jeu" : "Ajouter un jeu"}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            {game ? "Modifier le jeu" : "Ajouter un jeu"}
          </h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Fermer"
          >
            <CloseIcon />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field2}>
            <span className={styles.label}>
              <TagIcon className={styles.labelIcon} />
              Titre *
            </span>
            <input
              className={styles.input}
              value={form.titre}
              onChange={(e) => set("titre", e.target.value)}
              autoFocus
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>
              <PlayersIcon className={styles.labelIcon} />
              Joueurs (min - max)
            </span>
            <div className={styles.pair}>
              <input
                className={styles.input}
                type="number"
                aria-label="Joueurs min"
                value={form.joueursMin}
                onChange={(e) => set("joueursMin", e.target.value)}
              />
              <input
                className={styles.input}
                type="number"
                aria-label="Joueurs max"
                value={form.joueursMax}
                onChange={(e) => set("joueursMax", e.target.value)}
              />
            </div>
          </div>

          <label className={styles.field2}>
            <span className={styles.label}>
              <TextIcon className={styles.labelIcon} />
              Sous-titre
            </span>
            <input
              className={styles.input}
              value={form.sousTitre}
              onChange={(e) => set("sousTitre", e.target.value)}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>
              <ClockIcon className={styles.labelIcon} />
              Duree (min - max)
            </span>
            <div className={styles.pair}>
              <input
                className={styles.input}
                type="number"
                aria-label="Duree min"
                value={form.dureeMin}
                onChange={(e) => set("dureeMin", e.target.value)}
              />
              <input
                className={styles.input}
                type="number"
                aria-label="Duree max"
                value={form.dureeMax}
                onChange={(e) => set("dureeMax", e.target.value)}
              />
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              <DatabaseIcon className={styles.labelIcon} />
              Source
            </span>
            <input
              className={`${styles.input} ${styles.readonly}`}
              value={form.source}
              readOnly
            />
          </label>

          <div className={styles.field}>
            <div className={styles.duo}>
              <label className={styles.duoItem}>
                <span className={styles.label}>
                  <CalendarIcon className={styles.labelIcon} />
                  Edition
                </span>
                <input
                  className={styles.input}
                  type="number"
                  value={form.edition}
                  onChange={(e) => set("edition", e.target.value)}
                />
              </label>
              <label className={styles.duoItem}>
                <span className={styles.label}>
                  <AgeIcon className={styles.labelIcon} />
                  Age
                </span>
                <input
                  className={styles.input}
                  type="text"
                  placeholder="10+"
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <StarIcon className={styles.labelIcon} />
              Notes (perso - moyenne)
            </span>
            <div className={styles.pair}>
              <input
                className={styles.input}
                type="number"
                step="0.1"
                aria-label="Note perso"
                value={form.notePerso}
                onChange={(e) => set("notePerso", e.target.value)}
              />
              <input
                className={`${styles.input} ${styles.readonly}`}
                type="number"
                step="0.1"
                aria-label="Note moyenne"
                value={form.noteMoyenne}
                readOnly
              />
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <LayersIcon className={styles.labelIcon} />
              Categories <em className={styles.hint}>separees par ;</em>
            </span>
            <TagAutocomplete
              value={form.categories}
              onChange={(v) => set("categories", v)}
              options={CATEGORIES}
              inputClassName={styles.input}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <PaletteIcon className={styles.labelIcon} />
              Themes <em className={styles.hint}>separes par ;</em>
            </span>
            <TagAutocomplete
              value={form.themes}
              onChange={(v) => set("themes", v)}
              options={THEMES}
              inputClassName={styles.input}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              <BuildingIcon className={styles.labelIcon} />
              Editeur(s) <em className={styles.hint}>separes par ;</em>
            </span>
            <TagAutocomplete
              value={form.editeur}
              onChange={(v) => set("editeur", v)}
              options={EDITEURS}
              inputClassName={styles.input}
            />
          </div>

          {FIELDS.map((field) => (
            <label key={field.key} className={styles.field}>
              <span className={styles.label}>
                <field.Icon className={styles.labelIcon} />
                {field.label}
                {field.hint && <em className={styles.hint}>{field.hint}</em>}
              </span>
              <input
                className={styles.input}
                type={field.type}
                step={field.step}
                value={form[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            </label>
          ))}

          <div className={styles.field}>
            <div className={styles.duo}>
              <label className={styles.duoItem}>
                <span className={styles.label}>
                  <CalendarIcon className={styles.labelIcon} />
                  Date d'acquisition
                </span>
                <input
                  className={styles.input}
                  type="date"
                  value={form.dateAcquisition}
                  onChange={(e) => set("dateAcquisition", e.target.value)}
                />
              </label>
              <label className={styles.duoItem}>
                <span className={styles.label}>
                  <HashIcon className={styles.labelIcon} />
                  Myludo ID
                </span>
                <input
                  className={`${styles.input} ${styles.readonly}`}
                  value={form.myludoId}
                  readOnly
                />
              </label>
            </div>
          </div>

          <label className={styles.fieldWide}>
            <span className={styles.label}>
              <TextIcon className={styles.labelIcon} />
              Description
            </span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {game && (
              <button
                type="button"
                className={styles.delete}
                onClick={() => setConfirming(true)}
                title="Supprimer le jeu"
                aria-label="Supprimer le jeu"
              >
                <TrashIcon />
              </button>
            )}
            <div className={styles.actionsRight}>
              <button
                type="button"
                className={styles.cancel}
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="submit"
                className={styles.submit}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>

        {confirming && (
          <div className={styles.confirm}>
            <div className={styles.confirmBox}>
              <p className={styles.confirmText}>
                Supprimer definitivement{" "}
                <strong>{form.titre || "ce jeu"}</strong> ?
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancel}
                  onClick={() => setConfirming(false)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className={styles.deleteConfirm}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
