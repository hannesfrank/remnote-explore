window.jsonfile = await window.showSaveFilePicker();

USER_ID = userIdNonReactive();
kbData = currentKnowledgebaseData();
KB_ID = kbData._id;
KB_NAME = kbData.name;
DB_NAME = `remnote-${KB_ID}`;
SYNC_INTERVAL = 10; // seconds

async function writeFile(fileHandle, contents) {
  // Create a FileSystemWritableFileStream to write to.
  const writable = await fileHandle.createWritable();
  // Write the contents of the file to the stream.
  await writable.write(contents);
  // Close the file and write the contents to disk.
  await writable.close();
}

import("https://unpkg.com/idb?module").then(async (idb) => {
  db = await idb.openDB(DB_NAME, 28);

  if (window.jsonfile) {
    if (window.jsonDumpHandler) {
      clearInterval(window.jsonDumpHandler);
    }
    window.jsonDumpHandler = setInterval(async () => {
      const rem = await db.getAll("quanta");
      const kbExport = {
        userId: USER_ID,
        knowledgebaseId: KB_ID,
        name: KB_NAME,
        exportDate: new Date().toISOString(),
        exportVersion: 1,
        docs: rem,
      };

      const jsonStr = JSON.stringify(kbExport);
      console.info("Dumping", rem.length, "rem to", window.jsonfile.name);
      await writeFile(window.jsonfile, jsonStr);
    }, SYNC_INTERVAL * 1000);
  }
});
