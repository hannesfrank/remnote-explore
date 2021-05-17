import {
  TodoStatus,
  HeaderSize,
  HighlightColor,
  DocumentStatus,
  Rem,
  RemStore,
} from "./models";

type Filter = (rem: Rem) => boolean;

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

export function hasTag(rem, tagId) {
  return rem.typeParents && rem.typeParents.includes(tagId);
}
