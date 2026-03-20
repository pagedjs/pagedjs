pagedjs-cli
===========

Command line interface for rendering HTML to PDF using [Paged.js](https://pagedjs.org).

The CLI uses Puppeteer to load HTML documents in a headless browser, applies Paged.js pagination, and generates PDF output with support for outlines, trim boxes, and metadata.

## NPM Module
```sh
$ npm install pagedjs-cli
```

## Usage

### Command Line
```sh
$ pagedjs-cli ./path/to/index.html -o output.pdf
```

### Programmatic
```js
import Printer from 'pagedjs-cli';

let printer = new Printer({ headless: true });
let pdf = await printer.pdf('./path/to/index.html', {
    outlineTags: ['h1', 'h2', 'h3']
});
```

## Exports

### Printer
The main class that manages browser automation, rendering, and PDF generation.

```js
import Printer from 'pagedjs-cli';

let printer = new Printer({
    debug: false,
    allowLocal: true,
    allowRemote: true,
    timeout: 60000,
    emulateMedia: 'print'
});

printer.on('page', (page) => {
    console.log('Rendered page', page.position + 1);
});

printer.on('rendered', (msg) => {
    console.log(msg);
});

// Generate PDF
let pdf = await printer.pdf(input, options);

// Generate HTML
let html = await printer.html(input);

// Preview in browser (debug mode)
await printer.preview(input);
```

## CLI Options

```
pagedjs-cli [input] [options]

Options:
  -i, --inputs [inputs]              Input files
  -o, --output [output]              Output file path
  -d, --debug                        Debug mode (opens browser)
  -l, --landscape                    Landscape printing
  -s, --page-size [size]             Page size (e.g. A4, Letter)
  -w, --width [size]                 Page width in MM
  -h, --height [size]                Page height in MM
  -t, --timeout [ms]                 Max timeout in milliseconds
  -x, --html                         Output HTML instead of PDF
  -b, --blockLocal                   Disallow access to local files
  -r, --blockRemote                  Disallow remote requests
  --forceTransparentBackground       Print with transparent background
  --allowedPath [paths]              Only allow access to given filesystem paths (repeatable)
  --allowedDomain [domains]          Only allow access to given remote domains (repeatable)
  --outline-tags [tags]              HTML tags for PDF outline (default: h1,h2,h3)
  --additional-script <script>       Additional scripts to inject (repeatable)
  --browserEndpoint <endpoint>       Remote Chrome WebSocket endpoint
  --browserArgs <args>               Chrome launch arguments (comma separated)
  --media [media]                    Emulate media type (print or screen)
  --style <style>                    Additional CSS stylesheets (repeatable)
  --warn                             Enable warning logs
  --disable-script-injection         Disable injection of the polyfill script
  --extra-header <header:value>      Extra HTTP headers (repeatable)
```

## License

MIT License (MIT)
