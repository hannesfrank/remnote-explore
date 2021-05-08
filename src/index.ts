import * as fs from "fs";
import chalk from "chalk";
import lunr from "lunr";
import { Command } from "commander";
import * as JSZip from "jszip";

const program = new Command();

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

interface Rem {
  key: any;
  value: any;
  // key: any[];
  // value: any[];
  _id: string;
}

async function makeIndex() {
  const kb = await readKB("RemNote_Export_May_7th_2021_hannesfrank_json.zip");
  const docs: Rem[] = kb.docs;
  const idx = lunr(function () {
    this.field("key");
    this.field("value");
    // this.metadataWhitelist = ["key"];
    this.ref("_id");

    for (const rem of docs) {
      this.add(rem);
    }
  });

  const mapping: any = {};

  for (const rem of docs) {
    mapping[rem._id] = rem;
  }
  return [idx, mapping];
}

program
  .command("search <text...>")
  .description("Search for plain text in a rem.")
  .action(async (text) => {
    console.log("Searching ", text.join(" "));
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
      const {key, value, _id, ...other}: Rem = docs[res.ref];
      console.log(JSON.stringify({key, value, _id}));
    }
  });

program.parse(process.argv);
