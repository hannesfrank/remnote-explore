import blocks from "../assets/blocks.js";
import rqGenerator from "../assets/generatorRq.js";

const toolbox = document.getElementById("toolbox");
const toolboxJson = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Filters",
      expanded: true,
      colour: 230,
      contents: [
        {
          kind: "block",
          type: "filter_list",
        },
        {
          kind: "label",
          text: "Power Ups",
        },
        {
          kind: "block",
          type: "document",
        },
        {
          kind: "block",
          type: "todo",
        },
        {
          kind: "block",
          type: "highlight",
        },
        {
          kind: "block",
          type: "header",
        },

        {
          kind: "label",
          text: "References",
        },
        {
          kind: "block",
          // type: "tag",
          blockxml: `<block type="tag">
          <field name="tag">REM_ID</field>
        </block>`,
        },
        {
          kind: "label",
          text: "Formatting",
        },
      ],
    },
    {
      kind: "category",
      name: "Modifiers",
      colour: 50,
      contents: [
        {
          kind: "block",
          type: "orderby",
        },
        {
          kind: "block",
          type: "limit",
        },
      ],
    },
    {
      kind: "category",
      name: "Presets",
      colour: 150,
      contents: [
        {
          kind: "label",
          text: "Serendipidy",
        },
        {
          kind: "block",
          blockxml: `            
            <block type="filter_list">
              <field name="OPERATOR">AND</field>
              <statement name="FILTERS">
                <block type="document">
                  <field name="documentStatus">Any</field>
                </block>
              </statement>
              <next>
                <block type="orderby">
                  <field name="SORT_ORDER">RANDOM</field>
                  <next>
                    <block type="limit">
                      <field name="LIMIT">1</field>
                    </block>
                  </next>
                </block>
              </next>
            </block>`,
        },
      ],
    },
    {
      kind: "block",
      blockxml:
        "<block type='math_number'><field name='NUM'>42</field></block>",
    },
  ],
};

const options = {
  toolbox: toolboxJson,
  collapse: true,
  comments: true,
  css: true,
  disable: true,
  maxBlocks: Infinity,
  trashcan: false,
  horizontalLayout: false,
  toolboxPosition: "start",
  media: "https://blockly-demo.appspot.com/static/media/",
  rtl: false,
  scrollbars: true,
  sounds: false,
  oneBasedIndex: false,
};
const workspace = Blockly.inject("blocklyDiv", options);

Blockly.defineBlocksWithJsonArray(blocks);

/* TODO: Change workspace blocks XML ID if necessary. Can export workspace blocks XML from Workspace Factory. */
const workspaceBlocks = document.getElementById("workspaceBlocks");

// /* Load blocks to workspace. */
Blockly.Xml.domToWorkspace(workspaceBlocks, workspace);

// Saving and restoring workspaces
// let workspaceXML = Blockly.Xml.workspaceToDom(Blockly.getMainWorkspace());
function loadWorkspace(workspaceXML) {
  let workspace = Blockly.getMainWorkspace();
  workspace.clear();
  if (workspaceXML) {
    Blockly.Xml.domToWorkspace(workspaceXML, workspace);
  }
}

document.getElementById("generate").addEventListener("click", function (event) {
  let code = rqGenerator.workspaceToCode(Blockly.getMainWorkspace());
  console.info(code);
});
