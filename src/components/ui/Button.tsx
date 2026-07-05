import styles from "./Button.module.css";

type Props = {
  variant?: "primary" | "secondary" | "danger" | "soft";
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  type = "button",
  onClick,
  disabled,
  children,
}: Props) {
  return (
    <button
      type={type}
      className={styles[variant]}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
