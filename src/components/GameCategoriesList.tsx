import React from "react";
import { GameContent } from "../lib/games";
import GameItem from "./GameItem";
import TagLink from "./TagLink";
import Pagination from "./Pagination";
import { TagContent } from "../lib/tags";

type Props = {
  tags: TagContent[];
};

export function GameCategoriesList({ tags }: Props) {
  return (
    <>
      <ul className="categories">
        {tags.map((it, i) => (
          <li key={i}>
            <TagLink tag={it} />
          </li>
        ))}
      </ul>
      <style jsx>{`
        ul {
          opacity: 0;
          width: 100%;
          list-style: none;
          margin: 0;
          padding: 8px 0px;

          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        li {
          list-style: none;
          margin-bottom: 0.75em;
        }
        li:hover {
          text-decoration: underline;
          text-underline-offset: 8px;
        }

        @media (min-width: 769px) {
          ul {
            opacity: 1;
            width: 7rem;
            top: auto;
            display: block;
            transform: translateY(0);
          }
          li {
            font-size: 1rem;
            padding: 0;
          }
        }
      `}</style>
    </>
  );
}
