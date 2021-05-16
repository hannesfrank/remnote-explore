# Remnote Explorer

## Installation

1. Make sure you have `node` with `npm` installed.
2. Clone this repo.
3. Run `npm start`.
4. You should now have `rq` cli app.

## Usage

- Download a JSON backup from your knowledge base.
- Extract the JSON backup. You should have two files `rem.json` and `cards.json` in your current working directory.
- Search the KB with `rq search ...`. See `rq help search` for a list of all filters.

### Live Updating JSON Backup

TODO: Add user script here.

<!--
## Ideas

- list top level Rems (with stats)
  - with word count
  - reference count
  - tag count
  - portal count
- transfor all formatting

- Insights

  - top word count
  - edit history
    - rems edited per day
  - spaced repetition stats

- Maybe SQL like query language

- Export which preserves all information
  - RoamResearch
  - Anki
-->

## Development

```bash
# Install dependencies
npm ci
# Install the rq command line tool and the library
npm install -g .
```

To work on the command line first run

```sh
npm run build:watch
```

This compiles the TypeScript source on the fly when you edit it.

<!-- ### Pasting Portals

To use the portal paste helper plugin ([which does not work yet](https://forum.remnote.io/t/ability-to-paste-multiple-portals-api-support-for-rem-id-rem-id-rem-id/4619)), use

```sh
npx live-server .
```

and add `http://127.0.0.1:8080/support/paste-portal.html` as plugin. -->

<!-- ## GUI

- Blockly: Very cool and integratable into RemNote, but some development effort to make the DSL
  - https://developers.google.com/blockly/guides/overview
  - Block Factory: https://blockly-demo.appspot.com/static/demos/blockfactory/index.html
  - https://developers.google.com/blockly/guides/create-custom-blocks/generating-code
- https://ugui.io/tutorials/getting-started.html
- GraphQL Query for Rem output
  - List with parent, level <2 children
  - List all descendant todos
- CLUI: https://blog.replit.com/clui
- Build a cli with Inquirer.js
- For python there is https://github.com/chriskiehl/Gooey -->
