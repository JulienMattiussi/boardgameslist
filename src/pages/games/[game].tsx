import { GetStaticProps, GetStaticPaths } from "next";
import renderToString from "next-mdx-remote/render-to-string";
import { MdxRemote } from "next-mdx-remote/types";
import hydrate from "next-mdx-remote/hydrate";
import matter from "gray-matter";
import { fetchGameContent } from "../../lib/games";
import fs from "fs";
import yaml from "js-yaml";
import { parseISO } from "date-fns";
import GameLayout from "../../components/GameLayout";

import InstagramEmbed from "react-instagram-embed";
import YouTube from "react-youtube";
import { TwitterTweetEmbed } from "react-twitter-embed";

export type Props = {
  title: string;
  dateString: string;
  slug: string;
  tags: string[];
  author: string;
  description?: string;
  source: MdxRemote.Source;
};

const components = { InstagramEmbed, YouTube, TwitterTweetEmbed };
const slugToGameContent = ((gameContents) => {
  let hash = {};
  gameContents.forEach((it) => (hash[it.slug] = it));
  return hash;
})(fetchGameContent());

export default function Game({
  title,
  dateString,
  slug,
  tags,
  author,
  description = "",
  source,
}: Props) {
  const content = hydrate(source, { components });
  return (
    <GameLayout
      title={title}
      date={parseISO(dateString)}
      slug={slug}
      tags={tags}
      author={author}
      description={description}
    >
      {content}
    </GameLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = fetchGameContent().map((it) => "/games/" + it.slug);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params.game as string;
  const source = fs.readFileSync(slugToGameContent[slug].fullPath, "utf8");
  const { content, data } = matter(source, {
    engines: {
      yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object,
    },
  });
  const mdxSource = await renderToString(content, { components, scope: data });
  return {
    props: {
      title: data.title,
      dateString: data.date,
      slug: data.slug,
      description: "",
      tags: data.tags,
      author: data.author,
      source: mdxSource,
    },
  };
};
