import type { IconComponent } from "./Field";
import styles from "./MetaItem.module.css";

type Props = {
  Icon: IconComponent;
  value: string;
  label: string;
};

export function MetaItem({ Icon, value, label }: Props) {
  return (
    <div className={styles.item}>
      <Icon className={styles.icon} />
      <span className={styles.value}>{value}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
