# UI primitives

Each primitive is a `.tsx` plus a `.css` of the same name, imported by the component.

Two rules keep these styles predictable:

**Style on `data-*`, never on shared class names.** Every selector is rooted at
`[data-ui='<name>']`, so a component's styles can only reach its own markup. Class names
are global and collide with each other — a mascot rendering `className={state}` once picked
up `.quiet:hover` from the button styles.

**Variants set tokens, they don't set properties.** A variant declares `--button-ink`,
`--button-surface`, `--button-shadow`; the base rule is the only place that reads them. Dark
mode and hover states override tokens too, so a later rule can never win a `color` battle it
wasn't meant to enter.

Layout that belongs to a screen (margins, grid placement) stays in that screen's stylesheet
and selects the primitive by `[data-variant='…']` or a slot attribute.

The same split runs through the rest of the app: every component imports a `.css` file next to
it, and `src/style.css` keeps only what no component owns — design tokens, the reset, and element
defaults for headings, links, form controls, and the bare `button`. No class name is declared
there any more, so a stray `className` has nothing global left to collide with.
