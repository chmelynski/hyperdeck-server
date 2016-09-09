uglifyjs --mangle --mangle-regex="/^_/" -- components.js components/code.js components/data.js components/file.js components/repl.js components/link.js > hyperdeck.min.js
