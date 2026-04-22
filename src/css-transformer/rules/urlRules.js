import { ABSOLUTE_URL_RE } from "../transformers/transformUrls.js";

export default [
  {
    match: (url, ctx) =>
      ctx && ctx.baseURL && !ABSOLUTE_URL_RE.test(String(url).trim()),
    transform: (url, ctx) => {
      try {
        return new URL(url, ctx.baseURL).href;
      } catch {
        return url;
      }
    },
  },
];
