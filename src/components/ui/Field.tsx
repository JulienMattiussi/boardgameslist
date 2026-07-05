import styles from "./Field.module.css";

export type IconComponent = (props: {
  className?: string;
}) => React.ReactElement;

type Props = {
  label: string;
  Icon?: IconComponent;
  hint?: string;
  className?: string;
  children: React.ReactNode;
};

export function Field({ label, Icon, hint, className, children }: Props) {
  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <span className={styles.label}>
        {Icon && <Icon className={styles.labelIcon} />}
        {label}
        {hint && <em className={styles.hint}>{hint}</em>}
      </span>
      {children}
    </div>
  );
}
