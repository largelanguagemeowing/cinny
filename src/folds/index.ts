// Fork-only. Re-exports everything from folds but overrides the `Icons` enum
// with lucide-react icons (see ./icons). Wired via the bare-`folds` alias in
// vite.config.js, so every `import {...} from 'folds'` resolves here while
// subpaths like 'folds/dist/style.css' still resolve to the real package.
export * from 'folds/dist/index.js';
export { Icons } from './icons';
