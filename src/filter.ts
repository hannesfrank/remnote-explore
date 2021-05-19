import { filter } from "jszip";
import {
  TodoStatus,
  HeaderSize,
  HighlightColor,
  DocumentStatus,
  Rem,
  RemStore,
  RichTextElement,
  RemId,
  LatexType,
} from "./models";
import { richText } from "./preprocessor";

abstract class RemFilter {
  docs: RemStore;
  abstract check(rem: Rem, ...args: any[]): boolean;
  constructor(docs: RemStore) {
    this.docs = docs;
  }
}

interface CLIRemFilterInterface {
  flag?: string;
  longName: string;
  description: string;
  argName: string;
  choices?: string[];
  multiple?: boolean;
  negatable?: boolean;
}

class TodoFilter extends RemFilter {
  docs: RemStore;
  static flag = "t";
  static longName = "todo";
  static description = "Todo Status";
  static argName = "todoStatus";
  static choices = Object.keys(TodoStatus);

  check(rem: Rem, status: TodoStatus | true) {
    if (rem.crt && rem.crt.t && rem.crt.t.s) {
      if (status === true) return true;
      return rem.crt.t.s.s === status;
    }
  }
}

class HeaderFilter extends RemFilter {
  docs: RemStore;
  static flag = "t";
  static longName = "header";
  static description = "Header Status";
  static argName = "headerSize";
  static choices = Object.keys(HeaderSize);

  check(rem, headerSize: HeaderSize | true) {
    if (rem.crt && rem.crt.r && rem.crt.r.s) {
      if (headerSize === true) return true;
      return rem.crt.r.s.s === headerSize;
    }
  }
}

class HighlightFilter extends RemFilter {
  docs: RemStore;
  static flag = "h";
  static longName = "highlight";
  static description = "Highlight Status";
  static argName = "highlightColor";
  static choices = Object.keys(HighlightColor);

  check(rem, color: HighlightColor | true) {
    if (rem.crt && rem.crt.h && rem.crt.h.c) {
      if (color === true) return true;
      return rem.crt.h.c.s === color;
    }
  }
}

class DocumentFilter extends RemFilter {
  docs: RemStore;
  static flag = "d";
  static longName = "document";
  static description = "Document Status";
  static argName = "documentStatus";
  static choices = Object.keys(DocumentStatus);

  check(rem, status: DocumentStatus | true) {
    if (rem.crt && rem.crt.o && rem.crt.o && rem.crt.o.s) {
      if (status === true) return true;
      return rem.crt.o.s.s === status;
    }
  }
}

type CLIRemFilter =
  | typeof DocumentFilter
  | typeof TodoFilter
  | typeof HeaderFilter
  | typeof HighlightFilter;

const filters: CLIRemFilter[] = [
  DocumentFilter,
  TodoFilter,
  HeaderFilter,
  HighlightFilter,
];

export default filters;

const filterDeclarations = [
  {
    flag: "t",
    longName: "todo",
    description: "Todo Status",
    argName: "todoStatus",
    choices: Object.keys(TodoStatus),
    predicate: isTodo,
  },
  {
    flag: "h",
    longName: "header",
    description: "Header Size",
    argName: "headerSize",
    choices: Object.keys(HeaderSize),
    predicate: isHeader,
  },
  {
    flag: "c",
    longName: "highlight",
    description: "Highlight Color",
    argName: "highlightColor",
    choices: Object.keys(HighlightColor),
    predicate: isHighlight,
  },
  {
    flag: "d",
    longName: "document",
    description: "Document Status",
    argName: "documentStatus",
    choices: Object.keys(DocumentStatus),
    predicate: isDocument,
  },
  {
    flag: "b",
    longName: "has-bold",
    description: "Contains bold inline formatting",
    predicate: hasBold,
  },
];
// export default filterDeclarations;

export function isTodo(rem, status: TodoStatus | true) {
  if (rem.crt && rem.crt.t && rem.crt.t.s) {
    if (status === true) return true;
    return rem.crt.t.s.s === status;
  }
}

export function isHeader(rem, size: HeaderSize | true) {
  if (rem.crt && rem.crt.r && rem.crt.r.s) {
    if (size === true) return true;
    return rem.crt.r.s.s === size;
  }
}

export function isHighlight(rem, color: HighlightColor | true) {
  if (rem.crt && rem.crt.h && rem.crt.h.c) {
    if (color === true) return true;
    return rem.crt.h.c.s === color;
  }
}

export function isDocument(rem, status: DocumentStatus | true) {
  if (rem.crt && rem.crt.o && rem.crt.o && rem.crt.o.s) {
    if (status === true) return true;
    return rem.crt.o.s.s === status;
  }
}

export function isEditLater(rem) {
  return rem.crt && rem.crt.e;
}

// References
export function hasReference(rem, refId) {
  hasRichTextElement(rem, (el) => isReference(el, refId));
}
export function hasTag(rem, tagId) {
  return rem.typeParents && rem.typeParents.includes(tagId);
}

enum RichTextFormat {
  // Simple rich text formats without extra properties
  Bold = "b",
  Italics = "l",
  Underline = "u",
  Quote = "q",
  Latex = "x", // block = true
  Highlight = "h", // h = 1..6
  Hyperlink = "url", // url = http..., title, text
}

// Inline Formatting
// TODO: Allow querying text (as regex), for user friendliness wrapped as /.*searchText.*/
function hasFormatting(rem: Rem, format: RichTextFormat) {
  hasRichTextElement(rem, (el) => el.i === "m" && el[format]);
}
function hasBold(rem: Rem) {
  return hasFormatting(rem, RichTextFormat.Bold);
}
function hasItalics(rem: Rem) {
  return hasFormatting(rem, RichTextFormat.Italics);
}
function hasUnderline(rem: Rem) {
  return hasFormatting(rem, RichTextFormat.Underline);
}
function hasQuote(rem: Rem) {
  return hasFormatting(rem, RichTextFormat.Quote);
}
// TODO: Test
function hasHighlight(rem: Rem, color: HighlightColor | true) {
  hasRichTextElement(
    rem,
    (el) => el.i === "h" && el[RichTextFormat.Highlight] === HighlightColor
  );
}

// TODO: hasLinebreak
// TODO: hasLink

// TODO: hasImage
// TODO: hasAudio
// TODO: hasVideo
// TODO: hasLatex inline/block
export function hasLatex(rem: Rem, type: LatexType) {
  if (type === undefined) {
    return hasRichTextElement(rem, (el) => el.i === "x");
  }
  if (type === LatexType.Block) {
  }
}
// TODO: hasCodeblock language

// TODO: isConcept
// TODO: isDescriptor
// TODO: isQuestion
// TODO: isSlot
// TODO: isTemplate
// TODO: isTag (has typeChildren), also ability to count/sort by their number

// TODO: hasCard

// Other
// TODO: isEmpty key|value|both
// Example: empty top level
// TODO: isToplevel
// TODO: isDuplicate (O(n^2))

// Path Queries
// ===================
// These filter do not work on individual rem, but on branches of the outline.
// Note that if a condition is fulfilled at an ancestor it will return
// all branches = descendants of that rem. For hasReference for example I need
// to add an additional check to return a common ancestor or all matching rem.
// E.g. for [[A]] AND [[B]] I want to return rem that either contain [[A]] or [[B]],
// but not descendants C with [[A]]/[[B]]/C where both references are on the branch.

// TODO: hasReference
// TODO: hasTag
// TODO: isDescendant

// Util
// ====

function hasRichTextElement(rem: Rem, predicate: (RichTextElement) => boolean) {
  richText(rem).some(predicate);
}

function isReference(richText: RichTextElement, refId: RemId) {
  // @ts-ignore
  return richText.i === "q" && richText._id === refId;
}
