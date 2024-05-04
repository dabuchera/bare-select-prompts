# bare-select-prompts

Single and multiple select prompts for interactive CLIs.

```
npm i bare-select-prompts
```

## Usage

``` js
const selection = require("bare-select-prompts");

process.stdin.setRawMode(true);

const sl = selection.createInterface({
  input: process.stdin,
  output: process.stdout,
  options: ["foo", "bar", "baz"],
});

sl.on("selection", (selection) => {
  console.log("The user selected: " + (selection ? selection : "nothing"));
  process.exit();
});

sl.on("close", () => {
  console.log("Exiting...");
  process.exit();
});
```

## License

Apache-2.0
