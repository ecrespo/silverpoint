# @silverpoint/fonts

**Optional.** Self-hosted EB Garamond for **silverpoint**, in three cuts (400, 500 and 400
italic, latin subset, `woff2`), with its `@font-face` rules. The charts are designed for this
typeface. Without it they fall back to `'Iowan Old Style', Georgia, serif` and report `SP013` in
development.

## Installation

```sh
npm install @silverpoint/fonts
```

Import the rules **once**, at the root of the app:

```ts
import '@silverpoint/fonts/fonts.css';
```

In Angular, put it in `src/styles.css`:

```css
@import '@silverpoint/fonts/fonts.css';
```

Your bundler copies the three `woff2` files. There is no request to a font CDN.

See [`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react),
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) and
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) for usage.

Code MIT. EB Garamond © The EB Garamond Project Authors, under the SIL Open Font License 1.1
(`OFL.txt`).
