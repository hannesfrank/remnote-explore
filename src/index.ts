import chalk from "chalk";
import { Command, option, Option, parseOptions } from "commander";
import {
  AudioVideo,
  CodeBlock,
  DocumentStatus,
  HeaderSize,
  HighlightColor,
  Image,
  InlineFormatting,
  Other,
  Reference,
  Rem,
  RemId,
  RichTextElement,
  Timestamp,
  TodoStatus,
} from "./models";
import { remText } from "./preprocessor";
import printRem from "./print";
import { extractJsonBackup, makeIndex, loadDocs } from "./util";

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
            remText(rem1._id, docs).localeCompare(remText(rem2._id, docs));
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
    const [idx, docs] = await makeIndex("backup.json");
    const results = idx.search(`key:${text}`);
    for (const res of results) {
      printRem(docs[res.ref], docs);
    }
  });

// For those simple line formats I could make a StreamPrintHandler consisting of prefix, transform, suffix
// For more complex formats like markdown/html/tree I need to read in all remIds first
// TODO: Piping to this does not work in powershell
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

program
  .command("extract [zip] [targetFolder]")
  .description("Extract a json backup to the current directory.")
  .action(async (zipPath, targetFolder) => {
    extractJsonBackup(zipPath, targetFolder);
  });

export { program };
