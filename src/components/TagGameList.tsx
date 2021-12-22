import React from "react";
import { GameContent } from "../lib/games";
import { TagContent } from "../lib/tags";
import GameItem from "./GameItem";
import Pagination from "./Pagination";

type Props = {
  games: GameContent[];
  tag: TagContent;
  pagination: {
    current: number;
    pages: number;
  };
};
export default function TagGameList({ games, tag, pagination }: Props) {
  return (
    <div className={"container"}>
      <h1>
        All games / <span>{tag.name}</span>
      </h1>
      <ul>
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
          href: () => "/games/tags/[[...slug]]",
          as: (page) =>
            page === 1
              ? "/games/tags/" + tag.slug
              : `/games/tags/${tag.slug}/${page}`,
        }}
      />
      <style jsx>
        {`
          .container {
            margin: 0 auto;
            max-width: 1200px;
            width: 100%;
            padding: 0 1.5rem;
            display: flex;
            flex-direction: column;
          }
          h1 {
            margin: 0 0 2rem;
            padding: 0;
            font-weight: 100;
            font-size: 1.75rem;
            color: #9b9b9b;
          }
          h1 span {
            font-weight: bold;
            color: #222;
          }
          ul {
            margin: 0;
            padding: 0;
            flex: 1 0 auto;
          }
          li {
            list-style: none;
            margin-bottom: 1.5rem;
          }

          @media (min-width: 769px) {
            h1 {
              font-size: 2rem;
            }
          }
        `}
      </style>
    </div>
  );
}
