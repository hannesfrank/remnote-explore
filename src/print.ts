import chalk from "chalk";
import { Rem } from "./models";
import { getRemText } from "./preprocessor";

// Refactor
// - colors
// - lookups
export default function printRem(rem, docs) {
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
    todoMarker + chalk.bold(getRemText(rem._id, docs).slice(0, 50)),
    chalk.dim(`https://remnote.io/document/${_id}`)
  );
}
