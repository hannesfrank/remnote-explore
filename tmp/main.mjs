import fetch, {FetchError} from 'node-fetch';
import RemNoteAPI from './remnote-api.mjs';
import dotenv from 'dotenv';
dotenv.config();
import slugify from 'slugify';
import gardenConfig from './garden.config.mjs';
import * as fs from 'fs';

const PUBLISH_TAG_ID = gardenConfig.publishTag;
const PUBLISH_LOG_NAME = gardenConfig.publishLogName;
const USER_ID = process.env.USER_ID;
const API_KEY = process.env.API_KEY;

console.log('process.env.NODE_ENV', process.env.NODE_ENV);

class Store {
  session;
  store = {};

  constructor(session) {
    this.session = session;
  }

  async getRem(remId) {
    if (Array.isArray(remId)) {
      return await Promise.all(remId.map((rId) => this.getRem(rId)));
    }

    let rem;
    if (this.store[remId]) {
      rem = this.store[remId];
    } else {
      rem = await this.session.getRem(remId);
      this.store[remId] = this._resolveReferences(rem);
    }

    return JSON.parse(JSON.stringify(rem));
  }
  /**
   * Rem references are represented an object { q: REM_ID } in a list of rich text elements. This
   * functions adds a text attribute to this object which contains the list of  rich text elements
   * of the referenced rem.
   */
  _resolveReferences(rem) {
    // rem.text = session.getRemText();
    return rem;
  }

  async _getRemText(rem, exploredRem = []) {
    const richTextElementsText = await Promise.all(
      rem.key.map(async (richTextElement) => {
        // If the element is a string, juts return it
        if (typeof richTextElement == 'string') {
          return richTextElement;
          // If the element is a Rem Reference (i == "q"), then recursively get that Rem Reference's text.
        } else if (
          richTextElement.i == 'q' &&
          !exploredRem.includes(richTextElement._id)
        ) {
          const referencedRem = this.getRem(richTextElement._id);
          return await this._getRemText(
            richTextElement._id,
            exploredRem.concat([richTextElement._id])
          );
        } else {
          // If the Rem is some other rich text element, just take its .text property.
          return richTextElement.text;
        }
      })
    );
    return richTextElementsText.join('');
  }
}

async function publish() {
  const session = new RemNoteAPI(USER_ID, API_KEY);
  const store = new Store(session);

  if (process.env.DEBUG) {
    console.debug('DEBUG: Loading cached rem from file!');
    if (fs.existsSync('store.json')) {
      store.store = JSON.parse(fs.readFileSync('store.json'));
    }
  }

  const publishTagRem = await store.getRem(PUBLISH_TAG_ID);
  const articleFolder = './src/posts/';
  await Promise.all(
    publishTagRem.tagChildren.map(async (rId) => {
      const {markdown, title} = await formatArticleAsMarkdown(rId, store);
      const articleName = `${slugify(title, {remove: /[^a-zA-Z0-9 ]/g})}-${rId}.md`;
      const articlePath = articleFolder + articleName;
      fs.writeFileSync(articlePath, markdown);
      console.info(`"${articlePath}" published!`);
    })
  );

  if (process.env.DEBUG) {
    console.debug('DEBUG: Saving cached rem to file!');
    fs.writeFileSync('store.json', JSON.stringify(store.store, null, 2));
  }
}

async function formatArticleAsMarkdown(articleId, store) {
  const articleRem = await store.getRem(articleId);
  const title = articleRem.nameAsMarkdown;
  const creationDate = new Date(articleRem.createdAt);
  // TODO: Tags are handled by name and not by id, i.e. do not respect hierarchy.
  const tags = (await store.getRem(articleRem.tagParents)).map(
    (tag) => tag.nameAsMarkdown
  );
  const nonPowerUpTags = tags.filter((t) => !['Document', 'Header'].includes(t));
  const tagList = nonPowerUpTags.map((t) => `  - "${t}"`).join('\n');
  const frontmatter = `---
title: "${title}"
date: ${formatDate(creationDate)}
tags: 
${tagList}
lastUpdate:
---`;

  // Since visibleRemOnDocument ordered from new to old creation date we need to do a tree traversal.
  // const contentIds = articleRem.visibleRemOnDocument;
  // if (!articleRem.visibleRemOnDocument) {
  //   console.warn(`${articleId} has no visibleRemOnDocument`);
  // }
  // const contentRem = await store.getRem(articleRem.visibleRemOnDocument);
  // const directChildrenIds = articleRem.children;

  async function asyncFlat(promises) {
    const arrs = await Promise.all(promises);
    return arrs.flat();
  }

  // Old direct tree traversal.
  // async function dfs(r, depth) {
  //   if (depth !== -1 && (!r || !articleRem.visibleRemOnDocument.includes(r._id))) {
  //     return [];
  //   }

  //   const children = await store.getRem(r.children);
  //   if (depth === -1) {
  //     // r is articleRem
  //     const children = await store.getRem(r.children);
  //     return await asyncFlat(children.map((c) => dfs(c, depth + 1)));
  //   }

  //   const h = await headerLevel(r, store);
  //   if (h > 0) {
  //     // h + 1 to start with h2 and reserve h1 for title
  //     return [
  //       '',
  //       '#'.repeat(h + 1) + ' ' + r.nameAsMarkdown,
  //       ...(await asyncFlat(children.map((c) => dfs(c, 0)))),
  //     ];
  //   }
  //   // TODO: Handle todos.

  //   // TODO: Handle configurable indentation here.
  //   // Writer mode: https://forum.remnote.io/t/writer-friendly-export/2085
  //   // Return shallow rem as paragraphs
  //   if (depth == 0) {
  //     return [
  //       '',
  //       r.nameAsMarkdown,
  //       ...(await asyncFlat(children.map((c) => dfs(c, depth + 1)))),
  //     ];
  //   }
  //   // Return deeper rem as nested list
  //   if (depth > 0) {
  //     return [
  //       '  '.repeat(depth) + '- ' + r.nameAsMarkdown,
  //       ...(await asyncFlat(children.map((c) => dfs(c, depth + 1)))),
  //     ];
  //   }
  // }

  async function dfsHierarchy(rem, depth) {
    if (depth !== -1 && (!rem || !articleRem.visibleRemOnDocument.includes(rem._id))) {
      return [];
    }

    if (depth === -1) {
      // r is articleRem
      return await asyncFlat(rem.children.map((c) => dfsHierarchy(c, depth + 1)));
    }

    // Handle power up/descriptor formatting
    let remText = rem.nameAsMarkdown;
    // I don't know yet how to cleanly handle overlapping descriptors since there is an order required,
    // but maybe also some extra handling for todo headers?
    if (rem.descriptors.length > 1) {
      console.warn('Multiple descriptors not yet supported');
    }

    // TODO: Looks like a fully generic solution is hard to achieve because there is some overlapping markup:
    //  Both todos and lists (from indentation) need to start with a '-' which therefore can not be added independently.
    for (const descriptorRem of rem.descriptors) {
      const {descriptorFor, value, transformMarkdown} = descriptorRem.descriptorData;
      remText = transformMarkdown(remText, value);
    }

    let childrenText;

    const h = await headerLevel(rem, store);
    // Reset indentation
    if (h > 0) {
      childrenText = await asyncFlat(rem.children.map((c) => dfsHierarchy(c, 0)));
    } else {
      childrenText = await asyncFlat(rem.children.map((c) => dfsHierarchy(c, depth + 1)));
      // Add indentation and bullets here to the children instead of the rem itself.
      // This way we can check if the list item already starts with a bullet point (from the list)
      // and we can skip it and only add the indentation.
      // if (depth > 0) {
      // Indent children
      // Workaround for Todos which already start with "- ["
      childrenText = childrenText.map((c) => (/^\s*-\s/.test(c) ? '  ' : '  - ') + c);
      // }
    }

    const paragraph = depth === 0 ? [''] : [];
    return [...paragraph, remText, ...childrenText];

    // TODO: Handle configurable indentation here.
    // Writer mode: https://forum.remnote.io/t/writer-friendly-export/2085
    // Return shallow rem as paragraphs
    if (depth == 0) {
      return [
        '',
        r.nameAsMarkdown,
        ...(await asyncFlat(children.map((c) => dfs(c, depth + 1)))),
      ];
    }
    // Return deeper rem as nested list
    if (depth > 0) {
      return [
        '  '.repeat(depth) + '- ' + r.nameAsMarkdown,
        ...(await asyncFlat(children.map((c) => dfs(c, depth + 1)))),
      ];
    }
  }

  const rootIndentLevel = -1;
  const hierarchy = await buildHierarchy(articleRem, rootIndentLevel, store);
  const content = await dfsHierarchy(hierarchy, rootIndentLevel);
  const markdown = frontmatter + '\n\n' + content.join('\n');

  return {
    title,
    creationDate,
    tags,
    markdown,
  };
}

// // TODO: Checking every rem rem for all possible power ups does _a lot_ of iterations.
// async function getPowerUpValue(possiblePowerUpValues, rem, store) {
//   const children = await store.getRem(rem.children);
//   const allDescriptors = await Promise.all(
//     children.map(async (c, i) => {
//       if (
//         !c.remType === 'descriptor' ||
//         !Array.isArray(c.content) ||
//         !c.content[0] ||
//         !c.content[0].i === 'q'
//       )
//         return;
//       const ref = await store.getRem(c.content[0]._id);
//       return ref.nameAsMarkdown;
//     })
//   );
//   return allDescriptorValues
//     .filter((v) => v)
//     .find((v) => possiblePowerUpValues.includes(v));
// }

async function matchPowerUpDescriptor(rem, powerUps, store) {
  if (rem.remType !== 'descriptor') return;
  // TODO: Support non-reference descriptors?
  const descriptorKey = await nameOfLeadingReference(rem.name, store);
  const descriptorValue = await nameOfLeadingReference(rem.content, store);

  for (const descriptor of powerUps) {
    if (descriptorKey === descriptor.key && descriptor.values.includes(descriptorValue)) {
      return {...descriptor, value: descriptorValue};
    }
  }
}

async function nameOfLeadingReference(richText, store) {
  if (Array.isArray(richText) && richText[0] && richText[0].i === 'q') {
    const ref = await store.getRem(richText[0]._id);
    return ref.nameAsMarkdown;
  }
}

async function headerLevel(rem, store) {
  const headerValue = findDescriptorValueFor(rem, 'Header', 'Size');

  // TODO: Check if this is the correct 'Size' descriptor
  // // TODO: determine header tag generic
  // if (!rem.tagParents.includes('fEnxFNsoeLxtofM8G')) return 0;
  switch (headerValue) {
    case 'H1':
      return 1;
    case 'H2':
      return 2;
    case 'H3':
      return 3;
    default:
      return 0;
  }
}

function findDescriptorValueFor(rem, descriptorFor, key) {
  const descriptor = rem.descriptors.find(
    (descriptor) =>
      descriptor.descriptorData.descriptorFor === descriptorFor &&
      descriptor.descriptorData.key === key
  );
  if (descriptor) return descriptor.descriptorData.value;
}

async function formatArticleToHTML(articleId, store, options) {
  // TODO: Implement. Formatting using this might be more flexible for references.
  const visibleOnly = options.visibleOnly ?? false;
  async function dfs() {}
  var html = katex.renderToString('c = \\pm\\sqrt{a^2 + b^2}', {
    throwOnError: false,
    displayMode: true,
  });
}

/**
 * Writes a log entry for each (automatic) export into your knowledge base.
 * - Digital Garden Publish Log
 *   - [January xth, 2021]: Published N documents including M rem.
 */
async function writeLog() {
  const remId = getOrCreateRem(PUBLISH_LOG_NAME);
  // TODO: Implement
}

function formatDate(d) {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

function padZero(num) {
  return ('0' + num).slice(-2);
}

/**
 * let (for PowerUps) in RemNote have a reference both as key and as value.
 * We want to check if the text of those references is matches the declared key/values below.
 */
const descriptorFormatters = [
  {
    descriptorFor: 'Todo',
    key: 'Status',
    values: ['Finished', 'Unfinished'],
    transformMarkdown: function (markdown, value) {
      return `- [${value === 'Finished' ? 'x' : ' '}] ${markdown}`;
    },
  },
  {
    descriptorFor: 'Header',
    key: 'Size',
    values: ['H1', 'H2', 'H3'],
    transformMarkdown: function (markdown, value) {
      const level = {H1: 1, H2: 2, H3: 3}[value];
      // level + 1 to start with h2 and reserve h1 for title
      return '\n' + '#'.repeat(level + 1) + ' ' + markdown;
    },
  },
  // 'Highlight': {

  // }
];

/** Build the hierarchy bottom up.
 *
 *  Descriptors found in the descriptorFormatters list are automatically removed from the children
 *  list and returned as key-value pairs to the parent.
 */
async function buildHierarchy(rem, depth, store) {
  if (!rem) return;
  if (!rem.children) return {rem};

  const childrenRemIds = await store.getRem(rem.children);
  const children = await Promise.all(
    childrenRemIds.map((c) => buildHierarchy(c, depth + 1, store))
  );
  await Promise.all(
    children.map(
      async (c) =>
        (c.descriptorData = await matchPowerUpDescriptor(c, descriptorFormatters, store))
    )
  );
  rem.descriptors = children.filter((c) => c.descriptorData);
  rem.children = children.filter((c) => !c.descriptorData);
  rem.depth = depth;
  return rem;
}

async function test() {
  const session = new RemNoteAPI(USER_ID, API_KEY);
  const store = new Store(session);

  if (fs.existsSync('store.json')) {
    store.store = JSON.parse(fs.readFileSync('store.json'));
    console.info('Loaded store from disk.');
  }

  const hierarchy = await buildHierarchy(
    await store.getRem('nJa4Z64Lgz5HdHcZQ'),
    -1,
    store
  );
  console.log(hierarchy);
  console.log('=================================');
  console.log(await formatArticleAsMarkdown('nJa4Z64Lgz5HdHcZQ', store));
}

await publish();
// await test();
