"use client";

import { useState } from "react";
import styles from "./TagAutocomplete.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  inputClassName: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function TagAutocomplete({
  value,
  onChange,
  options,
  inputClassName,
}: Props) {
  const [open, setOpen] = useState(false);

  const tokens = value.split(";").map((token) => token.trim());
  const active = tokens[tokens.length - 1];
  const chosen = new Set(tokens.slice(0, -1).map(normalize));
  const query = normalize(active);

  const suggestions = options
    .filter(
      (option) =>
        !chosen.has(normalize(option)) &&
        (query === "" || normalize(option).includes(query))
    )
    .slice(0, 8);

  function pick(option: string) {
    const parts = [...tokens.slice(0, -1), option].filter(
      (token) => token !== ""
    );
    onChange(`${parts.join("; ")}; `);
  }

  return (
    <div className={styles.wrap}>
      <input
        className={inputClassName}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && suggestions.length > 0 && (
        <ul className={styles.list}>
          {suggestions.map((option) => (
            <li key={option}>
              <button
                type="button"
                className={styles.option}
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(option);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
