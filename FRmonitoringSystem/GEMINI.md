# FRmonitoringSystem — Gemini Instructions

- Read `AGENTS.md` before working. It is the project source of truth.
- Read `DESIGN.md` before any UI/design work. It is the visual source of truth.
- Inspect existing code before editing; preserve existing functionality and architecture.
- Always use these skills when applicable:
  - `reactjs`
  - `tailwind-4-docs`
  - `web-design-guidelines`

- Stack: React + Vite + Tailwind CSS v4 + React Router + Lucide React.
- Maps MUST use Leaflet.js + React Leaflet and Esri World Imagery.
- Keep map/data/UI logic modular. Don't hardcode large geographic datasets in components.
- Prefer simple, reusable, maintainable solutions. Avoid unnecessary dependencies or abstractions.
- Never expose or commit secrets, API keys, tokens, credentials, or `.env` files.
- Preserve teammates' work. No destructive Git commands or unrelated rewrites.
- After meaningful changes, run/build the app and fix errors.
- For UI changes, verify the actual browser result.
- Keep the core goal in mind: a polished, interactive geographic monitoring experience.

When requirements are unclear, inspect `AGENTS.md`, `DESIGN.md`, and the existing code before deciding.
