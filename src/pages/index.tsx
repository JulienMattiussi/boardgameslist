import { GetStaticProps } from "next";

import Layout from "../components/Layout";
import BasicMeta from "../components/meta/BasicMeta";
import OpenGraphMeta from "../components/meta/OpenGraphMeta";
import TwitterCardMeta from "../components/meta/TwitterCardMeta";
import { SocialList } from "../components/SocialList";
import { ExternalLinks } from "../components/ExternalLinks";
import { GameList } from "../components/GameList";
import { GameCategoriesList } from "../components/GameCategoriesList";

import config from "../lib/config";
import { countGames, listGameContent, GameContent } from "../lib/games";
import { listTags, TagContent } from "../lib/tags";

type Props = {
  games: GameContent[];
  tags: TagContent[];
  pagination: {
    current: number;
    pages: number;
  };
};

export default function Index({ games, tags, pagination }: Props) {
  const url = "/";
  return (
    <Layout>
      <BasicMeta url={url} />
      <OpenGraphMeta url={url} />
      <TwitterCardMeta url={url} />
      <div className="container">
        <div>
          <header>
            <h1>Jeux de plateau</h1>
            <span className="handle">Par Aurel</span>
          </header>
          <section>
            <h2>Derniers ajouts</h2>
            <GameList games={games} tags={tags} pagination={pagination} />
          </section>
        </div>
      </div>
      <div className="aside">
        <h5>Liens utiles</h5>
        <ExternalLinks />
        <h5>Categories</h5>
        <GameCategoriesList tags={tags} />
        <h5>Réseaux "Sociaux"</h5>
        <SocialList />
      </div>
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          padding: 0 1.5rem;
          max-width: 900px;
        }
        h1 {
          font-size: 2.5rem;
          margin: 0;
          font-weight: 500;
        }
        h2 {
          font-size: 1.5rem;
          font-weight: 400;
          line-height: 1.25;
          text-decoration: underline;
          text-underline-offset: 8px;
        }
        h5 {
          margin: 16px 0px 8px;
        }

        .fancy {
          color: #15847d;
        }
        .handle {
          display: inline-block;
          margin-top: 0.275em;
          color: #9b9b9b;
          letter-spacing: 0.05em;
        }

        @media (min-width: 769px) {
          h1 {
            font-size: 3rem;
          }
          h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const games = listGameContent(1, config.games_per_page);
  const tags = listTags();
  const pagination = {
    current: 1,
    pages: Math.ceil(countGames() / config.games_per_page),
  };
  return {
    props: {
      games,
      tags,
      pagination,
    },
  };
};
