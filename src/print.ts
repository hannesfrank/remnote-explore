import chalk from "chalk";
import { Rem } from "./models.js";
import { remText } from "./preprocessor.js";

// Refactor
// - colors
// - lookups
export default function printRem(rem, docs) {
  const { key, value, _id, crt, ...other }: Rem = rem;
  const docMarker = { Pinned: "P", Draft: "D", Finished: "F", None: " " }[
    (rem.crt && rem.crt.o && rem.crt.o.s && rem.crt.o.s.s) || "None"
  ];
  const headerMarker = {
    H1: "H1",
    H2: "H2",
    H3: "H3",
    None: "  ",
  }[(rem.crt && rem.crt.r && rem.crt.r.s && rem.crt.r.s.s) || "None"];

  const highlightMarker = {
    Red: chalk.bgMagenta(`${docMarker} ${headerMarker}`),
    Orange: chalk.bgRed(`${docMarker} ${headerMarker}`),
    Yellow: chalk.bgYellow(`${docMarker} ${headerMarker}`),
    Green: chalk.bgGreen(`${docMarker} ${headerMarker}`),
    Blue: chalk.bgCyan(`${docMarker} ${headerMarker}`),
    Purple: chalk.bgBlue(`${docMarker} ${headerMarker}`),
    None: `${docMarker} ${headerMarker}`,
  }[(rem.crt && rem.crt.h && rem.crt.h.c && rem.crt.h.c.s) || "None"];

  const todoMarker = { Finished: "[x] ", Unfinished: "[ ] ", None: "" }[
    (rem.crt && rem.crt.t && rem.crt.t.s && rem.crt.t.s.s) || "None"
  ];

  const tags =
    rem.typeParents &&
    rem.typeParents
      .map((tag) => "#" + remText(tag, docs).slice(0, 15))
      .join(" ");

  console.log(
    highlightMarker,
    todoMarker +
      chalk.bold(remText(rem._id, docs).split("\n").join().slice(0, 50)),
    chalk.dim(`https://remnote.io/document/${_id}`),
    tags
  );
}
