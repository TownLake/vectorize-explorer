## Simple Cloudflare Vectorize DB Explorer

Cloudflare's [Vectorize](https://developers.cloudflare.com/vectorize/) product is a globally distributed vector database that enables you to build full-stack, AI-powered applications with Cloudflare Workers. I recently set it up to add vector-embedded search for my [personal blog](https://blog.samrhea.com/) posts. I wound up building a simple UI that allows me to test the search as well as view the associated metadata for the entries.

You can view a working version of this here.

You can fork this project and deploy it to Cloudflare Pages to explore your own Vectorize DB. Instructions to do so below.

### Vector Embedding

I have written posts on this blog for years, and I continue to add new ones, so I introduced a [GitHub action](https://github.com/TownLake/blog-samrhea/actions/workflows/blog-vector.yaml) in the blog repository that will take new posts and send them to Vectorize and it [also has a flow](https://github.com/TownLake/blog-samrhea/blob/main/.github/workflows/blog-vector.yaml#L10) that I can add old posts manually.

The manual option is tedious but I did not want all posts sent. You can adapt it to batch posts if you'd like.

### Local Review

This repository contains a [script](https://github.com/TownLake/vectorize-explorer/blob/main/scripts/get-vector-metadata.py) where you can start reviewing your vector metadata without deploying the application as a whole.

1) Copy or download the python script linked above.
2) Replace `TOKEN` with your actual Cloudflare bearer token (it needs read/write permissions for Vectorize).
3) Replace `account-id` and `index-name` in the url with your account ID and the name of your Vectorize index.

The script makes two requests so be sure to replace it in both.

### Deploying the app

The app consists of a lightweight UI and two routes that perform the search and metadata functions.

#### Search

I have the search function configured to only retriever the `title`, `slug`, and `score` fields. The function also appends the `slug` field to the base URL of my blog so users can click to the post from the search results.

You can do the same thing or edit it for the metadata fields you need in [this](https://github.com/TownLake/vectorize-explorer/blob/main/src/routes/search/%2Bserver.ts#L75) section.

The search function needs you to configure the Vectorize and AI bindings in your wrangler file [here](https://github.com/TownLake/vectorize-explorer/blob/main/wrangler.json).

#### Metadata

[Metadata](https://github.com/TownLake/vectorize-explorer/blob/main/src/routes/metadata/%2Bserver.ts) is clunkier. I wanted a way to see essentially which posts had and had not been embedded. The function does not use the bindings but instead adapts the python script above to make two requests. It tops out at 100 entries.

If you want to do the same thing, follow the steps below.

1) Add [these variables](https://github.com/TownLake/vectorize-explorer/blob/main/src/routes/metadata/%2Bserver.ts#L5) as secrets in your Cloudflare Pages project.
2) The fields displayed in the table are hardcoded [here](https://github.com/TownLake/vectorize-explorer/blob/main/src/routes/%2Bpage.svelte#L147). Replace those field names with the metadata fields you want. You can use the python script above to get the field names available to you if you need.
