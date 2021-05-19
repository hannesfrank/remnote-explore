import filters from "../../dist/filter.js";

const rqGenerator = new Blockly.Generator("rq");
export default rqGenerator;

rqGenerator["filter_list"] = function (block) {
  var dropdown_operator = block.getFieldValue("OPERATOR");
  var statements_filters = rqGenerator.statementToCode(block, "FILTERS");
  console.info(statements_filters);
  return `rq search ${
    dropdown_operator == "AND" ? " " : "--or "
  }${statements_filters}`;
};

filters.forEach((filter) => {
  rqGenerator[filter.longName] = function (block) {
    const value = block.getFieldValue(filter.argName);
    if (value === "Any") {
      return `--${filter.argName}`;
    } else {
      return `--${filter.argName} ${value}`;
    }
  };
});

rqGenerator["limit"] = function (block) {
  console.log("limit");
  const limit = block.getFieldValue("LIMIT");
  // TODO: Assemble JavaScript into code variable.
  return `--limit ${limit}`;
};

rqGenerator["orderby"] = function (block) {
  const sortOrder = block.getFieldValue("SORT_ORDER");
  const desc = block.getFieldValue("DESC");
  // TODO: Assemble JavaScript into code variable.
  return `--orderby ${sortOrder}` + (desc ? " --desc" : "");
};

// This generates the code for a stack of blocks.
// TODO: Evaluate if a all enclosing query block with extra statement slots for
// output modifiers would be better.
rqGenerator.scrub_ = function (block, code, opt_thisOnly) {
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  let nextCode = "";
  if (nextBlock) {
    nextCode = opt_thisOnly ? "" : " " + rqGenerator.blockToCode(nextBlock);
  }
  return code + nextCode;
};
