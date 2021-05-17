import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import lunr from "lunr";
import * as JSZip from "jszip";

import { Rem } from "./models";

export async function readKBFromZip(zipPath: string) {
  const zipfile = fs.readFileSync(zipPath);
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

export async function makeIndex(zipPath: string) {
  const kb = await readKBFromZip(zipPath);
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

export async function extractJsonBackup(zipPath: string, targetFolder = ".") {
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

export function loadDocs(path = "rem.json") {
  // TODO: Postprocess dump to remove visibleRemOnDocument, Search records etc.
  // TODO: Properly open the store
  const data = fs.readFileSync(path, "utf-8");
  const kb = JSON.parse(data);
  let docs = {};
  for (const rem of kb.docs) {
    docs[rem._id] = rem;
  }
  return docs;
}
