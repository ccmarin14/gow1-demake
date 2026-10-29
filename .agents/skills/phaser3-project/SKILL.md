---
name: phaser3-project
description: "Trigger: Phaser gameplay, scenes, sprites, animations, camera or debugging. Apply this project's Phaser 3 version and evidence rules."
license: MIT
metadata:
  author: project-maintainers
  version: "1.0"
---

# Phaser 3 Project Environment

## Activation Contract

Load this project skill for Phaser work, alongside the existing architecture skill. For browser checks load browser-testing-with-devtools; for character art also load pixel-art-character-consistency.

## Hard Rules

- Read package.json and the installed Phaser version before choosing APIs. The current baseline is 3.90.0; do not upgrade it as an environment repair.
- Do not treat the global Phaser 4 animations skill as authoritative for this Phaser 3 project. Verify borrowed snippets against installed types and version-matched official examples.
- Keep gameplay, art, level design and dependency changes outside environment-only requests.
- Do not install paid services, cloud game agents or new MCP servers without explicit authorization.
- Preserve all existing visual evidence requirements; compilation does not establish animation quality.

## Decision Gates

| Need | Action |
| --- | --- |
| API documentation | Resolve Phaser through Context7 and prefer the matching version; verify signatures in installed types. |
| Context7 missing or irrelevant | Use official version-matched documentation/examples; report the fallback. |
| Runtime evidence | Use Chrome DevTools MCP; disclose connection failures instead of claiming execution. |
| Legacy verification script | Check its paths, prerequisites and side effects before running; never register it as a general test without verification. |

## Execution Steps

1. Read the environment guide linked below.
2. Confirm the installed version and relevant skill paths.
3. Retrieve the needed API reference, then inspect local declarations.
4. Run only the checks appropriate to the authorized change.
5. Separate static checks, browser evidence and aesthetic acceptance in the result.

## Output Contract

Report changed files, checked version, observed checks, failures and unverified items. Do not label a sample test as full game coverage.

## References

- [Environment guide](../../../docs/phaser-ai-environment.md)
