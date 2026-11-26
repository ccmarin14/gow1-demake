---
name: phaser3-project
description: "Trigger: Phaser gameplay, scenes, sprites, animations, camera or debugging. Apply this project's Phaser 3.90.0 version and verification rules."
license: MIT
metadata:
  author: project-maintainers
  version: "1.1"
---

# Phaser 3 Project Environment

## Activation Contract

Load this project skill for Phaser work. For browser checks also load `browser-testing-with-devtools`; for character art also load `pixel-art-character-consistency`.

## Hard Rules

- Current engine baseline is **Phaser 3.90.0** (`package.json` declares `^3.90.0`). Do not apply Phaser 4 APIs.
- Resolve Phaser docs via Context7 using `/phaserjs/phaser/v3_90_0` when needed, and verify signatures against `node_modules/phaser/types/phaser.d.ts`.
- Read and update [`docs/estado.md`](../../../docs/estado.md) as the single source of truth for project state.
- `pnpm build` checks TypeScript and bundling only; verify runtime behavior in a real browser (Chrome DevTools MCP or local headless Chrome via CDP) checking for zero console errors and zero failed network requests.
