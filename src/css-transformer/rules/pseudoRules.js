export default [
  {
    match: (sel) => sel.includes(":running("),
    transform: (sel) => sel.replace(/:running\(([^)]+)\)/g, ".running-$1"),
  },
  {
    match: (sel) => sel.includes(":nth-page("),
    transform: (sel) => sel.replace(/:nth-page\((\d+)\)/g, "paged-page:nth-of-type($1)"),
  },
];
