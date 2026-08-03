/// <reference types="nativewind/types" />

// Metro turns `global.css` into a stylesheet module through the Nativewind
// transformer; TypeScript only needs to know the side-effect import is real.
declare module "*.css" {}
