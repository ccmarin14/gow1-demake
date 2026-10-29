# Phaser AI development environment

This guide configures agent workflow only. It does not authorize gameplay, artwork,
level design, dependency upgrades or cloud services.

## Version and skills

- Current installed baseline: Phaser 3.90.0; package.json declares ^3.90.0.
- Load `.agents/skills/phaser3-project/SKILL.md` for project-specific API rules.
- Load the user-level `phaser-2d-game` skill for architecture (resolve its path from
  `.atl/skill-registry.md`).
- The global `animations` skill targets Phaser 4. Do not apply it uncritically to
  this project; the project skill takes precedence for version selection.
- Keep the existing browser-testing and character-consistency skills mandatory
  for their respective tasks. No global skill has been modified.

## Documentation and runtime access

Context7 and Chrome DevTools MCP already exist in the host configuration; do not
duplicate their registration. Their availability is session-specific.

1. Resolve `phaser` through Context7. The current versioned library identifier is
   `/phaserjs/phaser/v3_90_0`; resolve again when the installed version changes.
2. Query only the needed feature. Changelogs or generated snippets are not API
   authority: compare signatures with `node_modules/phaser/types/phaser.d.ts` and
   official version-matched examples before using them.
3. Use https://docs.phaser.io/ and https://github.com/phaserjs/phaser/tree/v3.90.0
   as official fallbacks. Check version labels rather than assuming latest is v3.
4. Test the browser connection with `list_pages`. This proves connectivity only,
   not that the game or its behavior has passed verification.
5. For gameplay verification use the existing browser skill, normal input,
   snapshots, frame progression and console evidence. Never kill another session's
   browser to obtain a connection.

## Existing checks and their scope

Run from the repository root; no new test framework or dependency is required.

| Command | What it checks / prerequisites |
| --- | --- |
| `node -p "require('./node_modules/phaser/package.json').version"` | Installed engine version; dependencies must already exist. |
| `./node_modules/.bin/tsc --noEmit` | Static TypeScript check only. |
| `npm run build` | TypeScript and Vite production build; writes ignored build artifacts. |
| `npm run dev` | Starts the development server; not a test. |
| `PYTHONDONTWRITEBYTECODE=1 python3 -m unittest scripts/test_kratos_modular_sample.py` | Optional isolated raster-sample tests; requires Python/Pillow and the current untracked sample files. Not game regression coverage. |

`npm run audit:sprites` and `scripts/verification/verify-live-run.mjs` are legacy
browser probes, not a verified general test entrypoint. Inspection on 2026-10-24
found fixed ports and an absolute external `BRAIN_DIR`. Inspect all uses and output
locations before running them; this environment task does not repair or run them.
There is deliberately no newly advertised `npm test` implying full game coverage.

## Optional tools, not installed by this task

Tiled, Phaser Editor and its MCP may be evaluated separately when visual authoring
is requested. Phaser Game Agent is a separate cloud service with credits, not a
prerequisite for this local workflow. Do not install or activate these implicitly.
