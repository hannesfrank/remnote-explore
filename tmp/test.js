const md = require('markdown-it')({html: true}).use(require('markdown-it-task-lists'), {
  label: true,
});

const result = md.render(
  `
- [x] **bold**
`
);

console.log(result);
