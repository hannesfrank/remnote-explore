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
import filters from "./filter";
import { hasTag } from "./filter";
import { remText } from "./preprocessor";
import printRem from "./print";
import { extractJsonBackup, makeIndex, loadDocs } from "./util";

// TODO: Fallback defaults
// TODO: Implement multiple
// TODO: Implement negatable
// TODO: Use a custom preprocessor function which just returns the predicate
//   Q: How to handle docs encapsulation then?
function addFilterOption(filter, program) {
  let option = new Option(
    `-${filter.shortName}, --${filter.longName}` +
      (filter.argName
        ? ` [${filter.argName}${filter.multiple ? "..." : ""}]`
        : ""),
    filter.description
  );
  if (filter.choices) {
    option = option.choices(filter.choices);
  }
  program.addOption(option);
}

const program = new Command();
const searchCommand = program
  .option("--kb-path [kbPath]", "Path to rem.json and cards.json. Default: .")
  .command("search");

filters.forEach((option) => addFilterOption(option, searchCommand));

searchCommand
  .option("-o, --or", "OR predicates instead of AND")
  .addOption(
    new Option(
      "--orderby [order]",
      "Sort by rem property ascending. See also --desc"
    ).choices(["last-edit", "create", "alpha", "random"])
  )
  .option("--desc", "Reverse sort order")
  .option("-l, --limit <limit>", "Limit number of results")
  .option(
    "-r, --ref <refs...>",
    "Rem Ids of references contained in the rem or an ancestor."
  )
  // .option(
  //   "-g, --tags <tags...>",
  //   "Tag Ids of tags contained in the rem or an ancestor."
  // )
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

    function addFilter(Filter, option) {
      const filterInstance = new Filter(docs);
      predicates.push((rem) => filterInstance.check(rem, option));
    }

    // console.error(options);
    for (const Filter of filters) {
      if (Filter.longName in options) {
        const option = options[Filter.longName];

        if (Array.isArray(option)) {
          option.forEach((val) => addFilter(Filter, val));
        } else {
          addFilter(Filter, option);
        }
      }
    }

    // if (options.tag) {
    //   console.error("tags:", options.tag);
    //   options.tags.map((tag) =>
    //     predicates.push((rem) => hasTag(rem, stripPrefix(tag, "##")))
    //   );
    // }

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
        case "last-edit":
          sortFunc = (rem1, rem2) => (rem1.u < rem2.u ? -1 : 1);
          break;
        case "create":
          sortFunc = (rem1, rem2) => (rem1.createdAt < rem2.createdAt ? -1 : 1);
          break;
        case "alpha":
        default:
          sortFunc = (rem1, rem2) =>
            remText(rem1._id, docs).localeCompare(remText(rem2._id, docs));
      }

      if (options.orderby === "random") {
        for (let i = result.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [result[i], result[j]] = [result[j], result[i]];
        }
      } else {
        result.sort(sortFunc);
      }
    }

    if (options.desc && options.orderby !== "random") {
      result.reverse();
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
    "-c, --portal-code",
    "Focus a rem with an empty portal below and execute this generated code in the Console."
  )
  .option("-r, --rich-text", "The rem's key as rich text array.")
  .action(async (options) => {
    const docs = loadDocs();

    if (options.portalMarkup) {
      console.error(
        chalk.blueBright.bold(
          "Note: You can only copy&paste one portal at a time into RemNote."
        )
      );
    } else if (options.portalCode) {
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
        } else if (options.portalCode) {
          console.log(
            `rem = window.q("${remId}"); if (rem) rem.addToPortal(portal._id);`
          );
        } else if (options.richText) {
          console.log(docs[remId].key);
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
