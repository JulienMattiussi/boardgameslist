import styles from "./IconButton.module.css";

type Props = {
  label: string;
  onClick: () => void;
  variant?: "soft" | "danger" | "ghost";
  className?: string;
  children: React.ReactNode;
};

export function IconButton({
  label,
  onClick,
  variant = "soft",
  className,
  children,
}: Props) {
  return (
    <button
      type="button"
      className={[styles.button, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
