import styles from "./Chip.module.css";

type Props = {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

export function Chip({ active, onClick, children }: Props) {
  return (
    <button
      type="button"
      className={active ? styles.active : styles.chip}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
