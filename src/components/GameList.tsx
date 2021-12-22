import React from "react";
import { GameContent } from "../lib/games";
import GameItem from "./GameItem";
import TagLink from "./TagLink";
import Pagination from "./Pagination";
import { TagContent } from "../lib/tags";

type Props = {
  games: GameContent[];
  tags: TagContent[];
  pagination: {
    current: number;
    pages: number;
  };
};

export function GameList({ games, tags, pagination }: Props) {
  return (
    <div className={"container"}>
      <div className={"games"}>
        <ul className={"game-list"}>
          {games.map((it, i) => (
            <li key={i}>
              <GameItem game={it} />
            </li>
          ))}
        </ul>
        <Pagination
          current={pagination.current}
          pages={pagination.pages}
          link={{
            href: (page) => (page === 1 ? "/" : "/[page]"),
            as: (page) => (page === 1 ? null : "/" + page),
          }}
        />
      </div>
      <style jsx>{`
        .container {
          display: flex;
        }
        ul {
          margin: 0;
          padding: 0;
        }
        li {
          list-style: none;
        }
        .games {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
        }
        .games li {
          margin-bottom: 1.5rem;
        }
        .game-list {
          flex: 1 0 auto;
        }
      `}</style>
    </div>
  );
}
