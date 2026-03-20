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
  --outline-tags [tags]              HTML tags for PDF outline
  --additional-script <script>       Additional scripts to inject
  --browserEndpoint <endpoint>       Remote Chrome WebSocket endpoint
  --browserArgs <args>               Chrome launch arguments
  --media [media]                    Emulate media type
  --style <style>                    Additional CSS stylesheets
  --warn                             Enable warning logs
  --disable-script-injection         Disable polyfill injection
  --extra-header <header:value>      Extra HTTP headers
```

## License

MIT License (MIT)
