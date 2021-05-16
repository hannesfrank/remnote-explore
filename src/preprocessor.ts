export function getRemText(
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

export default function preprocessRem(rem) {
  rem.text = getRemText(rem._id, rem);
  rem.isTopLevel = !!rem.parent;
  // rem.fullText =
  // TODO: Think about how to handle values along the path

  // Cleanup unnecessary data
  delete rem.subBlocks; // visibleRemOnDocument
}
