"use client";

import { useEffect, useState } from "react";
import { Game } from "@/lib/games";
import { CATEGORIES, THEMES, MECANISMES, EDITEURS } from "@/lib/taxonomies";
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
  PlayersIcon,
  ClockIcon,
  AgeIcon,
  StarIcon,
} from "./icons";
import { TagAutocomplete } from "./TagAutocomplete";
import { Field, IconComponent } from "./ui/Field";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";
import { BggGame } from "@/lib/bgg/map";
import controls from "./ui/controls.module.css";
import styles from "./GameFormModal.module.css";

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
  hint?: string;
};

const FIELDS: FieldDef[] = [
  {
    key: "auteurs",
    label: "Auteur(s)",
    type: "text",
    Icon: PersonIcon,
    hint: "separes par ;",
  },
  { key: "emplacement", label: "Emplacement", type: "text", Icon: PinIcon },
];

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
  bggId: "",
  description: "",
};

function num(value: number | null): string {
  return value === null ? "" : String(value);
}

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
    age: num(game.age),
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
    bggId: game.bggId,
  };
}

export function GameFormModal({ game, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => gameToForm(game));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [bggOpen, setBggOpen] = useState(false);
  const [bggInput, setBggInput] = useState("");
  const [bggLoading, setBggLoading] = useState(false);
  const [bggError, setBggError] = useState("");

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

  const openBgg = () => {
    setBggOpen(true);
    setBggError("");
    if (bggInput === "" && form.bggId !== "") {
      setBggInput(form.bggId);
    }
  };

  const applyBgg = (bgg: BggGame) => {
    setForm((prev) => {
      const overwrite = prev.source !== "myludo";
      const fill = (key: string, value: string) =>
        prev[key].trim() !== "" ? prev[key] : value;
      const over = (key: string, value: string) =>
        value !== "" ? value : prev[key];
      const put = overwrite ? over : fill;
      return {
        ...prev,
        bggId: bgg.bggId,
        source: prev.source === "manuel" ? "bgg" : prev.source,
        titre: put("titre", bgg.titre),
        description: fill("description", bgg.description),
        edition: put("edition", num(bgg.annee)),
        joueursMin: put("joueursMin", num(bgg.joueursMin)),
        joueursMax: put("joueursMax", num(bgg.joueursMax)),
        dureeMin: put("dureeMin", num(bgg.dureeMin)),
        dureeMax: put("dureeMax", num(bgg.dureeMax)),
        age: put("age", num(bgg.age)),
        categories: put("categories", bgg.categories.join("; ")),
        themes: put("themes", bgg.themes.join("; ")),
        mecanismes: put("mecanismes", bgg.mecanismes.join("; ")),
        auteurs: put("auteurs", bgg.auteurs.join("; ")),
        editeur: put("editeur", bgg.editeur.join("; ")),
        noteMoyenne: put("noteMoyenne", num(bgg.noteMoyenne)),
        image: put("image", bgg.image),
      };
    });
  };

  const fetchFromBgg = async () => {
    if (bggInput.trim() === "") {
      setBggError("Colle une URL ou un id BoardGameGeek.");
      return;
    }
    setBggLoading(true);
    setBggError("");
    try {
      const res = await fetch(
        `/api/bgg/thing?id=${encodeURIComponent(bggInput)}`,
      );
      const data = await res.json();
      if (!res.ok || !data.game) {
        throw new Error();
      }
      applyBgg(data.game as BggGame);
      setBggOpen(false);
    } catch {
      setBggError("Recuperation BGG indisponible.");
    }
    setBggLoading(false);
  };

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

  const textInput = (
    key: string,
    type: "text" | "number" | "date" = "text",
  ) => (
    <input
      className={controls.input}
      type={type}
      value={form[key]}
      onChange={(event) => set(key, event.target.value)}
    />
  );

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
          <IconButton label="Fermer" variant="ghost" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </header>

        <div className={styles.bggBar}>
          {!bggOpen ? (
            <div className={styles.bggClosed}>
              <Button variant="secondary" onClick={openBgg}>
                Recuperer depuis BGG
              </Button>
              {form.bggId && (
                <a
                  className={styles.bggLink}
                  href={`https://boardgamegeek.com/boardgame/${form.bggId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fiche BGG #{form.bggId}
                </a>
              )}
              <span className={styles.myludoTag}>
                Myludo {form.myludoId ? `#${form.myludoId}` : "-"}
              </span>
            </div>
          ) : (
            <div className={styles.bggPanel}>
              <div className={styles.bggSearch}>
                <input
                  className={controls.input}
                  value={bggInput}
                  placeholder="URL ou id BoardGameGeek (ex: 13)"
                  onChange={(event) => setBggInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void fetchFromBgg();
                    }
                  }}
                  autoFocus
                />
                <Button
                  variant="secondary"
                  onClick={() => void fetchFromBgg()}
                  disabled={bggLoading}
                >
                  {bggLoading ? "..." : "Recuperer"}
                </Button>
                <IconButton
                  label="Fermer BGG"
                  variant="ghost"
                  onClick={() => setBggOpen(false)}
                >
                  <CloseIcon />
                </IconButton>
              </div>
              <p className={styles.bggHint}>
                Colle l&apos;URL de la fiche BGG du jeu (ou son id). Les champs
                vides seront remplis.
              </p>
              {bggError && <p className={styles.error}>{bggError}</p>}
            </div>
          )}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Field label="Titre *" Icon={TagIcon} className={styles.span2}>
            <input
              className={controls.input}
              value={form.titre}
              onChange={(event) => set("titre", event.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Joueurs (min - max)" Icon={PlayersIcon}>
            <div className={styles.pair}>
              {textInput("joueursMin", "number")}
              {textInput("joueursMax", "number")}
            </div>
          </Field>

          <Field label="Sous-titre" Icon={TextIcon} className={styles.span2}>
            {textInput("sousTitre")}
          </Field>

          <Field label="Duree (min - max)" Icon={ClockIcon}>
            <div className={styles.pair}>
              {textInput("dureeMin", "number")}
              {textInput("dureeMax", "number")}
            </div>
          </Field>

          <div className={styles.duo}>
            <Field
              label="Source"
              Icon={DatabaseIcon}
              className={styles.duoItem}
            >
              <input
                className={`${controls.input} ${controls.readonly}`}
                value={form.source}
                readOnly
              />
            </Field>
            <Field
              label="Date d'acquisition"
              Icon={CalendarIcon}
              className={styles.duoItem}
            >
              {textInput("dateAcquisition", "date")}
            </Field>
          </div>

          <div className={styles.duo}>
            <Field
              label="Edition"
              Icon={CalendarIcon}
              className={styles.duoItem}
            >
              {textInput("edition", "number")}
            </Field>
            <Field label="Age" Icon={AgeIcon} className={styles.duoItem}>
              <div className={styles.adorned}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={form.age}
                  onChange={(event) =>
                    set("age", event.target.value.replace(/[^\d]/g, ""))
                  }
                />
                <span className={styles.adornment}>+</span>
              </div>
            </Field>
          </div>

          <Field label="Notes (perso - moyenne)" Icon={StarIcon}>
            <div className={styles.pair}>
              {textInput("notePerso", "number")}
              <input
                className={`${controls.input} ${controls.readonly}`}
                type="number"
                value={form.noteMoyenne}
                readOnly
              />
            </div>
          </Field>

          <Field label="Categories" Icon={LayersIcon} hint="separees par ;">
            <TagAutocomplete
              value={form.categories}
              onChange={(value) => set("categories", value)}
              options={CATEGORIES}
              inputClassName={controls.input}
            />
          </Field>

          <Field label="Themes" Icon={PaletteIcon} hint="separes par ;">
            <TagAutocomplete
              value={form.themes}
              onChange={(value) => set("themes", value)}
              options={THEMES}
              inputClassName={controls.input}
            />
          </Field>

          <Field label="Mecanismes" Icon={GearIcon} hint="separes par ;">
            <TagAutocomplete
              value={form.mecanismes}
              onChange={(value) => set("mecanismes", value)}
              options={MECANISMES}
              inputClassName={controls.input}
            />
          </Field>

          <Field label="Editeur(s)" Icon={BuildingIcon} hint="separes par ;">
            <TagAutocomplete
              value={form.editeur}
              onChange={(value) => set("editeur", value)}
              options={EDITEURS}
              inputClassName={controls.input}
            />
          </Field>

          {FIELDS.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              Icon={field.Icon}
              hint={field.hint}
            >
              {textInput(field.key, field.type)}
            </Field>
          ))}

          <Field label="Image (URL)" Icon={ImageIcon} className={styles.span2}>
            {textInput("image")}
          </Field>

          <Field label="EAN" Icon={BarcodeIcon} hint="separes par ;">
            {textInput("ean")}
          </Field>

          <Field label="Description" Icon={TextIcon} className={styles.wide}>
            <textarea
              className={controls.textarea}
              rows={3}
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {game && (
              <IconButton
                label="Supprimer le jeu"
                variant="danger"
                onClick={() => setConfirming(true)}
              >
                <TrashIcon />
              </IconButton>
            )}
            <div className={styles.actionsRight}>
              <Button variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
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
                <Button
                  variant="secondary"
                  onClick={() => setConfirming(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
