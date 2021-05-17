export interface Rem {
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

export type RemStore = { [key: string]: Rem };

// Util
// =====================================
export type Timestamp = number;
export type RemId = string;

// Rich Text Elements
// =====================================
export type Reference = {
  i: "q";
  _id: RemId;
};
export type CodeBlock = {
  i: "o";
  language: string;
  text: string;
};
export type Image = {
  i: "i";
  url: string;
};
export type AudioVideo = {
  i: "a";
  url: string;
  onlyAudio: boolean;
};
export type InlineFormatting = {
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
export type Other = {
  // i: Exclude<string, "q" | "o" | "i" | "a" | "m">;
  i: "can't handle";
}; // Does it have text?
export type RichTextElement =
  | string
  | Reference
  | CodeBlock
  | Image
  | AudioVideo
  | InlineFormatting
  | Other;

// Power Ups
// =====================================
// TODO: Move to power up definition file
export enum TodoStatus {
  Finished = "Finished",
  Unfinished = "Unfinished",
}
export enum HeaderSize {
  H1 = "H1",
  H2 = "H2",
  H3 = "H3",
}
export enum HighlightColor {
  Red = "Red",
  Orange = "Orange",
  Yellow = "Yellow",
  Green = "Green",
  Blue = "Blue",
  Purple = "Purple",
}
export enum DocumentStatus {
  Draft = "Draft",
  Pinned = "Pinned",
  Finished = "Finished",
}
