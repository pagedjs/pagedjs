export default [
  {
    match: ({ property }) => property === "position",
    transform: () => ({ property: "--paged-position" }),
  },
];
