import { GetStaticPaths, GetStaticProps } from "next";
import Layout from "../../../components/Layout";
import BasicMeta from "../../../components/meta/BasicMeta";
import OpenGraphMeta from "../../../components/meta/OpenGraphMeta";
import TwitterCardMeta from "../../../components/meta/TwitterCardMeta";
import TagGameList from "../../../components/TagGameList";
import config from "../../../lib/config";
import { countGames, listGameContent, GameContent } from "../../../lib/games";
import { getTag, listTags, TagContent } from "../../../lib/tags";
import Head from "next/head";

type Props = {
  games: GameContent[];
  tag: TagContent;
  page?: string;
  pagination: {
    current: number;
    pages: number;
  };
};
export default function Index({ games, tag, pagination, page }: Props) {
  const url = `/games/tags/${tag.name}` + (page ? `/${page}` : "");
  const title = tag.name;
  return (
    <Layout>
      <BasicMeta url={url} title={title} />
      <OpenGraphMeta url={url} title={title} />
      <TwitterCardMeta url={url} title={title} />
      <TagGameList games={games} tag={tag} pagination={pagination} />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const queries = params.slug as string[];
  const [slug, page] = [queries[0], queries[1]];
  const games = listGameContent(
    page ? parseInt(page as string) : 1,
    config.games_per_page,
    slug
  );
  const tag = getTag(slug);
  const pagination = {
    current: page ? parseInt(page as string) : 1,
    pages: Math.ceil(countGames(slug) / config.games_per_page),
  };
  const props: {
    games: GameContent[];
    tag: TagContent;
    pagination: { current: number; pages: number };
    page?: string;
  } = { games, tag, pagination };
  if (page) {
    props.page = page;
  }
  return {
    props,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = listTags().flatMap((tag) => {
    const pages = Math.ceil(countGames(tag.slug) / config.games_per_page);
    return Array.from(Array(pages).keys()).map((page) =>
      page === 0
        ? {
            params: { slug: [tag.slug] },
          }
        : {
            params: { slug: [tag.slug, (page + 1).toString()] },
          }
    );
  });
  return {
    paths: paths,
    fallback: false,
  };
};
