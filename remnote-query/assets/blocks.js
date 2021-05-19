import filters from "../../dist/filter.js";
// Blockly.Blocks["todo_filter"] = {
//   init: function () {
//     this.appendDummyInput()
//       .appendField("Todo Status")
//       .appendField(
//         new Blockly.FieldDropdown([
//           ["Unfinished", "Unfinished"],
//           ["Finished", "Finished"],
//         ]),
//         "todo_status"
//       );
//     this.setPreviousStatement(true, "Filter");
//     this.setNextStatement(true, "Modifier");
//     this.setColour(230);
//     this.setTooltip("Filter Todos by their completion status.");
//     this.setHelpUrl("");
//   },
// };

const staticBlocks = [
  // {
  //   type: "document_filter",
  //   message0: "Document Status %1",
  //   args0: [
  //     {
  //       type: "field_dropdown",
  //       name: "document_status",
  //       options: [
  //         ["Pinned", "Pinned"],
  //         ["Draft", "Draft"],
  //         ["Finished", "Finished"],
  //         ["Any", "Any"],
  //       ],
  //     },
  //   ],
  //   previousStatement: "Filter",
  //   nextStatement: "Modifier",
  //   colour: 230,
  //   tooltip: "Filter Documents by their status.",
  //   helpUrl: "",
  // },
  // {
  //   type: "todo_filter",
  //   message0: "Todo Status %1",
  //   args0: [
  //     {
  //       type: "field_dropdown",
  //       name: "todo_status",
  //       options: [
  //         ["Finished", "Finished"],
  //         ["Unfinsihed", "Unfinsihed"],
  //         ["Any", "Any"],
  //       ],
  //     },
  //   ],
  //   previousStatement: "Filter",
  //   nextStatement: "Modifier",
  //   colour: 230,
  //   tooltip: "Show Todos with the given completion status.",
  //   helpUrl: "",
  // },
  {
    type: "filter_list",
    message0: "%1 Query %2 %3",
    args0: [
      {
        type: "field_dropdown",
        name: "OPERATOR",
        options: [
          ["AND", "AND"],
          ["OR", "OR"],
        ],
      },
      {
        type: "input_dummy",
      },
      {
        type: "input_statement",
        name: "FILTERS",
        // check: "Filter",
        align: "RIGHT",
      },
    ],
    colour: 110,
    nextStatement: null,
    tooltip:
      "Return rem that match ALL (AND) or ANY (OR) of the specified filters.",
    helpUrl: "",
  },
  {
    type: "orderby",
    message0: "Sort by %1 Descending %2",
    args0: [
      {
        type: "field_dropdown",
        name: "SORT_ORDER",
        options: [
          ["Created", "create"],
          ["Last Edit", "last-edit"],
          ["Alphabetical", "alpha"],
          ["Random", "random"],
        ],
      },
      {
        type: "field_checkbox",
        name: "DESC",
        checked: false,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: 0,
    tooltip: "Sort result.",
    helpUrl: "",
  },
  {
    type: "limit",
    message0: "Limit %1",
    args0: [
      {
        type: "field_number",
        name: "LIMIT",
        value: 10,
        min: 0,
      },
    ],
    previousStatement: null,
    colour: 50,
    tooltip: "Return only the first N results.",
    helpUrl: "",
  },
];

const autogeneratedBlocks = filters.map((filter) => ({
  type: filter.longName,
  message0: filter.description + "%1",
  args0: filter.choices
    ? [
        {
          type: "field_dropdown",
          name: filter.argName,
          options: filter.choices
            .map((choice) => [choice, choice])
            .concat(filter.required ? [] : [["Any", "Any"]]),
        },
      ]
    : [
        {
          type: "field_input",
          name: filter.argName,
          text: "",
        },
      ],
  previousStatement: "RemStream",
  nextStatement: "RemStream",
  colour: 230,
  tooltip: filter.longDescription || filter.description,
  // helpUrl: "",
}));
console.info(autogeneratedBlocks);

const blocks = [...staticBlocks, ...autogeneratedBlocks];

export default blocks;
