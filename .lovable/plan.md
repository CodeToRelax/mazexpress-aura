## Upgrade Policies editor to a rich Markdown editor

Replace the plain `Textarea` in `src/screens/settings/PoliciesCard.tsx` with a richer editing experience that still saves Markdown (the backend contract is unchanged — Markdown in, Markdown rendered with `react-markdown`).

### Editor choice: `@uiw/react-md-editor`

- Battle-tested Markdown editor with a built-in toolbar, keyboard shortcuts, drag-to-resize, and live preview.
- Toolbar buttons act as **snippet inserters** for: bold, italic, strikethrough, H1–H3, quote, code, code block, unordered list, ordered list, checklist, link, image, table, horizontal rule.
- Keyboard shortcuts: `Cmd/Ctrl+B` bold, `Cmd/Ctrl+I` italic, `Cmd/Ctrl+K` link, etc.
- Output is plain Markdown (a string) — drop-in replacement for the current `value`/`onChange` text state, no API changes.
- Has an Edit / Preview / Live split-view toggle built in, so we can drop our custom Edit/Preview button.
- Lightweight (~50KB gzipped) and works in dark mode via a `data-color-mode` attribute.

Alternative considered: TipTap (WYSIWYG). Rejected because it's heavy, requires a Markdown serializer, and risks data loss on round-trips with content authored in raw Markdown. Markdown-native editor is the safer fit for a legal/policies field.

### Changes

1. **Add dependency**: `@uiw/react-md-editor`.

2. **`src/screens/settings/PoliciesCard.tsx`**
   - Replace the `Textarea` + custom Edit/Preview toggle with `<MDEditor value={...} onChange={...} height={420} preview="edit" />`.
   - Keep the per-tab structure (Policies / Prohibited Items / Extra), the dirty-tracking, the character counter, the 50,000-char cap (enforced in `onChange`), the Save button, and the ACL guard.
   - Remove our local `view` state and the standalone Eye/Pencil button — `MDEditor`'s built-in toolbar offers Edit/Live/Preview modes.
   - Set `data-color-mode` on the editor wrapper based on the current theme so it matches dark/light mode (`useTheme` hook already exists).
   - Import the editor's CSS once: `import '@uiw/react-md-editor/markdown-editor.css';`.
   - Style overrides: a small CSS block (or `className`) so the editor's border radius / background blends with our `glass-card` look.

3. **`src/pages/Policies.tsx`** — no change. It's read-only and already renders saved Markdown via `react-markdown`.

4. **`src/utilities/api/policies.api.ts`** — no change. Still PATCHes only `policies | prohibitedItems | extra`.

### Snippet/toolbar coverage answer

Yes — the new editor provides a full toolbar that **inserts Markdown snippets** at the cursor (e.g. clicking "Link" inserts `[label](url)`, "Table" inserts a 3×3 table skeleton, "Code Block" wraps selection in triple backticks). It also supports keyboard shortcuts for the common ones. So users get both: clickable snippet buttons and raw-Markdown editing power.

### Out of scope

- No backend changes.
- No change to the public-facing `/policies` viewer page.
- No change to localization keys.
