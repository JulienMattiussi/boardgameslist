import { GameContent } from "../lib/games";
import styles from "../../public/styles/content.module.css";
import Date from "./Date";
import Link from "next/link";
import { parseISO } from "date-fns";

type Props = {
  game: GameContent;
};
export default function GameItem({ game }: Props) {
  return (
    <Link href={"/games/" + game.slug}>
      <a>
        <Date date={parseISO(game.date)} />
        <h2>{game.title}</h2>
        <style jsx>
          {`
            a {
              color: #222;
              display: inline-block;
            }
            h2 {
              margin: 0;
              font-weight: 500;
            }
          `}
        </style>
        <div className={styles.content}>{game.body}</div>
      </a>
    </Link>
  );
}
