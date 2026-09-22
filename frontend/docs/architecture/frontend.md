# Frontend engineering contract

Read this only for implementation architecture, routing, API/state, testing, or
visual-verification work. It is not a visual design specification; use
[`../../DESIGN.md`](../../DESIGN.md) for that.

## Placement and composition

| Location | Owns |
| --- | --- |
| `src/styles/` | tokens, global roles, prose, font stacks, shared utilities |
| `src/components/ui/` | shadcn Base Vega primitives, kept close to upstream |
| `src/components/journiv/` | a product pattern shared by at least two features |
| `src/api/` | generated client, hand-written wrapper, auth, query keys/options |
| `src/app/` | router, query client, global light/dark theme |
| `src/i18n/` | language initialization, persistence, and translation resources |
| `src/app/pwa/` | manifest shortcuts list, service-worker registration and update state (`docs/features/pwa.md`) |
| `src/app/offline/` | bounded offline read cache, offline-restricted mode (`docs/features/pwa.md`) |
| `src/features/<feature>/` | feature UI and scoped CSS |
| `src/lib/` | shared pure helpers and lookup logic |
| `src/test/` | Vitest setup and viewport helpers |

Use `cn` only in `components/ui/`, where Tailwind class precedence must merge.
Use the lightweight `cx` in Journiv product code. Keep generic registry
primitives compositional and close to Base Vega. A custom product wrapper needs
real behaviour, not a different border, radius, or hover colour. Build a
cross-feature component only after a second feature needs it.

Use scoped feature CSS for durable product layout driven by tokens. Tailwind is
appropriate for local one-off layout; do not mechanically rewrite working CSS
into utilities.

`src/styles/selection.css` is the one place a registry primitive's *palette* is
overridden rather than left close to upstream: Base Vega signals a selected
tab/toggle by swapping `--muted` / `--background` / `--input`, which Minimal
Neutral collapses to one value (invisible selection, worst in dark). It conforms
those states to DESIGN.md's accent selection role in a single unlayered
stylesheet so every current and future picker inherits it — do not re-patch this
per feature.

## Internationalization

The React frontend uses `i18next` through `react-i18next`. Simplified Chinese
(`zh-CN`) is the product default and English (`en-US`) is the fallback and
secondary interface language. The per-device choice is stored under
`journiv.language`, applied before the first React render, and kept in sync with
the root document's `lang` attribute.

User-facing copy belongs in `src/i18n/resources.ts` and components read it with
`useTranslation`; do not add new inline English or Chinese strings to localized
surfaces. Use interpolation and i18next plural forms for dynamic copy. Date and
number formatters must use the active i18n locale instead of assuming the
browser locale. The language selector lives in Settings → Theme & time and is a
device setting, not part of the server-backed appearance form.

## Routing and responsive model

The router's route metadata, not pathname parsing, determines pane behaviour.
A detail route declares the existing route metadata; Settings declares its
existing settings metadata. Preserve the responsive route model and give each
pane one scroll owner. Global page-breakpoint, container-query, and adaptive
overlay rules are owned by [`DESIGN.md`](../../DESIGN.md); do not restate or
override them here. `useCompactViewport()` is reserved for the adaptive-overlay
primitive selection; feature code does not inspect viewport width to choose its
own layout.

## API and server state

The generated OpenAPI client is the code-level API contract. Use its operations
through the existing client and TanStack Query options/keys. Invalidate or
update the established query keys after mutations; do not add a parallel fetch
or cache layer.

After a backend API contract change, restart the backend, run `npm run api:pull`,
ensure the committed one-line `openapi/openapi.json` is current, run
`npm run api:generate`, and commit the generated client with the specification.
Do not infer endpoints from Markdown.

`api:pull` must run against a **Plus-enabled** backend: `openapi/openapi.json`
includes the `/api/v1/plus/*`, `/pub/*` and `/api/v1/oembed` routes, whose
schemas come from the proprietary `app.plus.plus_features` binary that is not in
this repository. A core-only checkout's `app.openapi()` omits those routes and
must not be used to update the committed specification. Start a Plus-enabled
backend, run the standard `api:pull` workflow above, re-minify the specification,
run `api:generate`, and commit both the regenerated specification and client.

`ApiError` preserves HTTP status. Treat an unavailable request as unavailable,
not as proof that a resource was deleted. Keep user-visible errors human and
never silently discard a failed action.

## Testing and visual verification

`npm run verify` runs formatting, lint, the design guard, types, Vitest, build,
and generated-API drift checks. It does not run Playwright.

The design guard statically checks token discipline, raw colours, arbitrary
spacing/font sizes, custom properties, breakpoints, direct UUID use, source
links from `DESIGN.md`, and documented token facts. Keep its protections; token
facts remain in `DESIGN.md` so the guard can cross-check them against CSS.

For visual changes, inspect light and dark at 1440×900, 1024×768, and 390×844.
Reference captures are under `docs/design/reference/`; regenerate them only
when visuals changed. Read [`../../e2e/README.md`](../../e2e/README.md) before
creating or modifying Playwright tests.
