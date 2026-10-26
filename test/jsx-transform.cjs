const { transformSync } = require("esbuild");

module.exports = {
  process(source, filename) {
    return transformSync(source, {
      loader: "jsx",
      format: "esm",
      sourcefile: filename,
      sourcemap: "inline",
      target: "node18",
    });
  },
};
