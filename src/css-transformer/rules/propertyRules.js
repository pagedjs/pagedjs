export default [
  {
    match: ({ property }) => property === "bleed",
    transform: () => ({ property: "--paged-bleed" }),
  },
  {
    match: ({ property }) => property === "position",
    transform: () => ({ property: "--paged-position" }),
  },
];
