/**
 * Syntax highlighting for the board's Markdown dialect, as data: the tokenizer
 * says what each run of source text is, and the host platform decides what that
 * looks like. Nothing here touches the DOM or React, so the same tokens drive a
 * web overlay and a React Native one.
 */

export { tokenizeMarkdown, type TokenizeOptions } from "./tokenize"
export { tokenStyles, type Token, type TokenKind } from "./kinds"
