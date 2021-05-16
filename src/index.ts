import * as fs from "fs";
import chalk from "chalk";
import lunr from "lunr";
import { Command, option, Option, parseOptions } from "commander";
import * as JSZip from "jszip";

async function readKB(zippath: string) {
  const zipfile = fs.readFileSync(zippath);
  return await JSZip.loadAsync(zipfile).then(async (zip) => {
    zip.forEach((path, file) => {
      // console.log(path, file.dir, file.name, file.date);
    });
    const content = await zip.file("rem.json")!.async("string");
    const kb = JSON.parse(content);
    // console.info(chalk.blue.bold("Stats of KB"), chalk.green.bold(kb.name));
    console.info(chalk.blue("User Id:         "), kb.userId);
    console.info(chalk.blue("Knowledgebase Id:"), kb.knowledgebaseId);
    console.info(chalk.blue("Export Date:     "), kb.exportDate);
    console.info(chalk.blue("Export Version:  "), kb.exportVersion);
    console.info(chalk.blue("# Rem:           "), kb.docs.length);
    return kb;
  });
}

async function makeIndex() {
  const kb = await readKB("RemNote_Export_May_7th_2021_hannesfrank_json.zip");
  const docs: Rem[] = kb.docs;
  const idx = lunr(function () {
    this.field("key");
    this.field("value");
    // this.metadataWhitelist = ["key"];
    this.ref("_id");

    // for (const rem of docs) {
    //   this.add(rem);
    // }
  });

  const mapping: any = {};

  for (const rem of docs) {
    mapping[rem._id] = rem;
  }
  return [idx, mapping];
}

interface Rem {
  key: RichTextElement[];
  value: RichTextElement[];
  _id: RemId;
  crt: object;
  children: RemId[];
  parent: RemId | null;
  createdAt: Timestamp;
  u: Timestamp;
  typeParents: RemId[];
  typeChildren: RemId[];
}

type Timestamp = number;
type RemId = string;
type Reference = {
  i: "q";
  _id: RemId;
};
type CodeBlock = {
  i: "o";
  language: string;
  text: string;
};
type Image = {
  i: "i";
  url: string;
};
type AudioVideo = {
  i: "a";
  url: string;
  onlyAudio: boolean;
};
type InlineFormatting = {
  i: "m";
  text: string;
  cId: string; // Cloze Id
  u: boolean; // Underline
  b: boolean; // Bold
  l: boolean; // Italic
  q: boolean; // Quote
  x: boolean; // Latex
  h: 1 | 2 | 3 | 4 | 5 | 6; // Highlight
  url: string; // Hyperlink
};
type Other = {
  // i: Exclude<string, "q" | "o" | "i" | "a" | "m">;
  i: "can't handle";
}; // Does it have text?
type RichTextElement =
  | string
  | Reference
  | CodeBlock
  | Image
  | AudioVideo
  | InlineFormatting
  | Other;

// TODO: Move to power up definition file

enum TodoStatus {
  Finished,
  Unfinished,
}
enum HeaderSize {
  H1,
  H2,
  H3,
}
enum HighlightColor {
  Red,
  Orange,
  Yellow,
  Green,
  Blue,
  Purple,
}
enum DocumentStatus {
  Draft,
  Pinned,
  Finished,
}

function loadDocs(path = "rem.json") {
// TODO: Postprocess dump to remove visibleRemOnDocument, Search records etc.
  // TODO: Properly open the store
  const dump = require("rem.json");
let docs = {};
for (const rem of dump.docs) {
  docs[rem._id] = rem;
}
  return docs;
}

function preprocessRem(rem) {
  rem.text = getRemText(rem._id, rem);
  rem.isTopLevel = !!rem.parent;
  // rem.fullText =
  // TODO: Think about how to handle values along the path

  // Cleanup unnecessary data
  delete rem.subBlocks; // visibleRemOnDocument
}

function getRemText(
  remId: RemId,
  docs: { [key: string]: Rem },
  exploredRem: RemId[] = []
): string {
  let rem = docs[remId];
  if (!rem) return;

  const richTextElementsText = rem.key.map((richTextElement) => {
    // If the element is a string, juts return it
    if (typeof richTextElement === "string") {
      return richTextElement;
    } else if ("text" in richTextElement) {
      return richTextElement.text;
      // If the element is a Rem Reference (i == "q"), then recursively get that Rem Reference's text.
    } else if (richTextElement.i === "q") {
      return !exploredRem.includes(richTextElement._id)
        ? getRemText(
        richTextElement._id,
            docs,
        exploredRem.concat([richTextElement._id])
          )
        : "";
    } else if (richTextElement.i === "a") {
      return `<${richTextElement.onlyAudio ? "audio" : "video"}:${
        richTextElement.url
      }>`;
    } else if (richTextElement.i === "i") {
      return `<image:${richTextElement.url}>`;
    } else {
      // If the Rem is some other rich text element, just take its .text property.
      return `<unknown rich text ${richTextElement.i}>`;
    }
  });
  return richTextElementsText.join("");
}

function isTodo(rem, status: TodoStatus | true) {
  if (rem.crt && rem.crt.t && rem.crt.t.s) {
    if (status === true) return true;
    return rem.crt.t.s.s === status;
  }
}

function isHeader(rem, size: HeaderSize | true) {
  if (rem.crt && rem.crt.r && rem.crt.r.s) {
    if (size === true) return true;
    return rem.crt.r.s.s === size;
  }
}

function isHighlight(rem, color: HighlightColor | true) {
  if (rem.crt && rem.crt.h && rem.crt.h.c) {
    if (color === true) return true;
    return rem.crt.h.c.s === color;
  }
}

function isDocument(rem, status: DocumentStatus | true) {
  if (rem.crt && rem.crt.o && rem.crt.o && rem.crt.o.s) {
    if (status === true) return true;
    return rem.crt.o.s.s === status;
  }
}

function isEditLater(rem) {
  return rem.crt && rem.crt.e;
}

function hasTag(rem, tagId) {
  return rem.typeParents && rem.typeParents.includes(tagId);
}

function stripPrefix(str, prefix: string) {
  return str.startsWith(prefix) ? str.slice(prefix.length) : str;
}

const program = new Command();
program
  .option("--kb-path [kbPath]", "Path to rem.json and cards.json. Default: .")
  .command("search")
  .addOption(
    new Option("-t, --todo [todoStatus]", "Todo").choices([
      "Finished",
      "Unfinished",
    ])
  )
  .addOption(
    new Option("-h, --header [size]", "Header Size").choices(["H1", "H2", "H3"])
  )
  .addOption(
    new Option("-c, --highlight [color]", "Highlight Color").choices([
      "Blue",
      "Green",
      "Orange",
      "Purple",
      "Red",
      "Yellow",
    ])
  )
  .addOption(
    new Option("-d, --document [documentStatus]", "Document Status").choices([
      "Draft",
      "Pinned",
      "Finished",
    ])
  )
  .option("-o, --or", "OR predicates instead of AND")

  .addOption(
    new Option("-s, --orderby [order]", "Sort by last").choices([
      "edit-asc",
      "edit-desc",
      "create-asc",
      "create-desc",
      "alpha",
    ])
  )
  .option("-l, --limit <limit>", "Limit number of results")
  .option(
    "-r, --ref <refs...>",
    "Rem Ids of references contained in the rem or an ancestor."
  )
  .option(
    "-g, --tags <tags...>",
    "Tag Ids of tags contained in the rem or an ancestor."
  )
  .option("-p, --print [format]", "Print more than just the rem id")
  .option(
    "-n, --count",
    "Print the number of found rem instead of their rem ids."
  )
  // Print options
  //   --url
  //   --markdown
  //   --portal
  //   sort tree
  // Full path references
  // regex
  // rem type (concept/descriptor)
  // card status
  // top level
  // Number of practices
  // Daily documents/Date scopes with natural language
  // Is descendant
  // -n --refName
  //   $(rq s some ref name) to return the id for --ref
  // Upper case flags, -R, --Nref for negating
  //   negation only works if you have a positive filter already
  .description("Search for plain text in a rem.")
  .action(async (options) => {
    const docs = loadDocs();

    const predicates = [];

    // console.error(options);

    if (options.todo) {
      predicates.push((rem) => isTodo(rem, options.todo));
    }

    if (options.header) {
      predicates.push((rem) => isHeader(rem, options.header));
    }

    if (options.highlight) {
      predicates.push((rem) => isHighlight(rem, options.highlight));
    }

    if (options.document) {
      predicates.push((rem) => isDocument(rem, options.document));
    }

    if (options.tags) {
      console.error("tags:", options.tags);
      options.tags.map((tag) =>
        predicates.push((rem) => hasTag(rem, stripPrefix(tag, "##")))
      );
    }

    if (predicates.length == 0) {
      return;
    }

    let result = Object.values<Rem>(docs).filter(
      (rem) =>
        (options.or && predicates.some((p) => p(rem))) ||
        predicates.every((p) => p(rem))
    );

    if (options.orderby) {
      let sortFunc;
      switch (options.orderby) {
        case "edit-desc":
          sortFunc = (rem1, rem2) => (rem1.u > rem2.u ? -1 : 1);
          break;
        case "edit-asc":
          sortFunc = (rem1, rem2) => (rem1.u < rem2.u ? -1 : 1);
          break;
        case "create-desc":
          sortFunc = (rem1, rem2) => (rem1.createdAt > rem2.createdAt ? -1 : 1);
          break;
        case "create-asc":
          sortFunc = (rem1, rem2) => (rem1.createdAt < rem2.createdAt ? -1 : 1);
          break;
        case "alpha":
        default:
          sortFunc = (rem1, rem2) =>
            getRemText(rem1._id, docs).localeCompare(
              getRemText(rem2._id, docs)
            );
      }

      result.sort(sortFunc);
    }

    if (options.count) {
      console.log(result.length);
      return;
    }

    if (options.limit) {
      const limit = parseInt(options.limit);
      if (limit > 0) {
        // TODO: Make quiet flag?
        console.error("Limit", options.limit, "/ Total", result.length);
        result = result.slice(0, parseInt(options.limit));
      } else {
        console.error(`--limit is not a number.`);
        return;
      }
    }

    result.map((rem) => {
      if (options.print) {
        printRem(rem, docs);
      } else {
        console.log(rem._id);
      }
    });
  });

program
  .command("match <text...>")
  .description("Print rem that exactly match the given text.")
  .action(async (text) => {
    text = text.join(" ");
    console.log("Matching", text);
    const [idx, docs] = await makeIndex();
    const results = idx.search(`key:${text}`);
    for (const res of results) {
      printRem(docs[res.ref], docs);
    }
  });

// Refactor
// - colors
// - lookups
function printRem(rem, docs) {
  const { key, value, _id, crt, ...other }: Rem = rem;
  const docMarker = { Pinned: "P", Draft: "D", Finished: "F", None: " " }[
    (rem.crt && rem.crt.o && rem.crt.o.s && rem.crt.o.s.s) || "None"
  ];
  const highlightMarker = {
    Red: chalk.bgMagenta(docMarker),
    Orange: chalk.bgRed(docMarker),
    Yellow: chalk.bgYellow(docMarker),
    Green: chalk.bgGreen(docMarker),
    Blue: chalk.bgCyan(docMarker),
    Purple: chalk.bgBlue(docMarker),
    None: docMarker,
  }[(rem.crt && rem.crt.h && rem.crt.h.c && rem.crt.h.c.s) || "None"];

  const todoMarker = { Finished: "[x] ", Unfinished: "[ ] ", None: "" }[
    (rem.crt && rem.crt.t && rem.crt.t.s && rem.crt.t.s.s) || "None"
  ];
  console.log(
    highlightMarker,
    todoMarker + chalk.bold(getRemText(rem._id).slice(0, 50)),
    chalk.dim(`https://remnote.io/document/${_id}`)
  );
}

// For those simple line formats I could make a StreamPrintHandler consisting of prefix, transform, suffix
// For more complex formats like markdown/html/tree I need to read in all remIds first
program
  .command("print")
  .description("Prints rem ids given on stdin.")
  .option("-p, --portal-markup", "Transform to pastable RemNote portals.")
  .option(
    "-P, --portal",
    "Focus a rem with an empty portal below and execute this generated code in the Console."
  )
  .action(async (options) => {
    const docs = loadDocs();

    // TODO: Piping to this does not work in powershell
    if (options.portalMarkup) {
      console.error(
        chalk.blueBright.bold(
          "Note: You can only copy&paste one portal at a time into RemNote."
        )
      );
    } else if (options.portal) {
      console.log(`// Click parent of portal
// Assume the portal is its first child
portal = window.currentFocusedRem().childrenRem()[0]

// Rem to add to the portal`);
    }

    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    //  for await (const remId of rl) {
    //    console.log(printRem(docs[remId]));
    //  }
    rl.on("line", (remId) => {
      if (remId in docs) {
        if (options.portalMarkup) {
          console.log(`((${remId}`);
        } else if (options.portal) {
          console.info(
            `rem = window.q("${remId}"); if (rem) rem.addToPortal(portal._id);`
          );
        } else {
          printRem(docs[remId], docs);
        }
      } else {
        console.error(remId, "not found!");
      }
    });
  });

import * as path from "path";

async function extractJsonBackup(zipPath: string, targetFolder = ".") {
  const zipfile = fs.readFileSync(zipPath);

  return await JSZip.loadAsync(zipfile).then(async (zip) => {
    zip.forEach((path, file) => {
      // console.log(path, file.dir, file.name, file.date);
    });
    const content = await zip.file("rem.json")!.async("string");
    const cards = await zip.file("cards.json")!.async("string");
    const kb = JSON.parse(content);
    // TODO: Prepare kb.docs for faster processing
    fs.writeFileSync(path.join(targetFolder, "rem.json"), JSON.stringify(kb));
    fs.writeFileSync(path.join(targetFolder, "cards.json"), cards);
    // console.info(chalk.blue.bold("Stats of KB"), chalk.green.bold(kb.name));
    console.info(chalk.blue("User Id:         "), kb.userId);
    console.info(chalk.blue("Knowledgebase Id:"), kb.knowledgebaseId);
    console.info(chalk.blue("Export Date:     "), kb.exportDate);
    console.info(chalk.blue("Export Version:  "), kb.exportVersion);
    console.info(chalk.blue("# Rem:           "), kb.docs.length);
  });
}

program
  .command("extract [zip] [targetFolder]")
  .description("Extract a json backup to the current directory.")
  .action(async (zipPath, targetFolder) => {
    extractJsonBackup(zipPath, targetFolder);
  });

export { program };
