# AGENTS.md

Guidance for AI coding agents working on this repository.

## About this repository

This is a fork of [Hypfer/hass-scene_presets](https://github.com/Hypfer/hass-scene_presets),
a Home Assistant custom integration that applies Hue-like scene presets to any `light` entity.
The fork keeps the domain `scene_presets` so it can replace the original installation as a drop-in.

Fork goals are tracked in [ROADMAP.md](ROADMAP.md).

## Layout

- `custom_components/scene_presets/` - the integration (Python, no external requirements)
  - `__init__.py` - service registration and schemas
  - `dynamic_scenes.py` - dynamic scene engine (endless loops applying shuffled presets)
  - `saved_scenes.py` - persistent saved scenes (HA storage) and mapping to service calls (fork)
  - `scene.py` - scene platform, one entity per saved scene (fork)
  - `optional_lights.py` - optional lights that join an active scene when turned on (fork)
  - `presets.py` - applies a preset to a list of light entities
  - `color_management.py`, `color_temperature.py` - color selection and CT fallback
  - `view.py`, `websocket_api.py` - panel registration, static assets, websocket commands
    (fork: `get_saved_scenes`, `resolve_targets`)
  - `presets.json`, `assets/` - built-in presets and their images
  - `frontend/scene_presets_panel.js` - **built** panel bundle, committed to the repo
  - `frontend/scene-presets-room-card.js` - room card (plain JS, no build step), served and
    auto-loaded via `view.py`; borrows Lit from Home Assistant's own elements
  - `services.yaml` - service descriptions shown in the HA UI
- `js/` - panel source (React + TypeScript), built with webpack into `frontend/`
- `docs/` - user documentation

## Rules

- Language on GitHub (commits, branches, issues, PRs, code comments) is English.
- No AI attribution anywhere: no `Co-Authored-By` lines, no "Generated with" notes.
- License is Apache-2.0. Keep `LICENSE` and upstream copyright notices. Every upstream file you
  modify gets a short header comment `# Modified by andrejem (<year>): <what changed>`
  (or the `//` equivalent in TypeScript).
- Keep backward compatibility of services: new parameters must be optional and the default
  behavior must stay identical to upstream.
- Keep changes that could go upstream (e.g. per-light timing) separate from fork-only features
  so they can be offered as a pull request to Hypfer later.
- Update `ROADMAP.md`, `Readme.md` and `docs/` together with every functional change.
- Pure documentation changes may be committed directly to `master`; code changes go through a
  feature branch and a pull request.
- The maintainer runs `git push` himself. Do not push.

## Frontend notes

- Custom elements receive props as JS properties (React 19), not as HTML attributes. Selectors such as
  `ha-icon[icon=...]` do not match; query the `icon` property instead.
- `mwc-button` is no longer rendered by Home Assistant 2026.x. Use plain styled `<button>` elements.

## Building the panel

Only needed when `js/` changes:

```
npm ci
npm run build
```

Commit the resulting `custom_components/scene_presets/frontend/scene_presets_panel.js`.

## Testing

There is no automated test suite. Test manually in Home Assistant:

1. Copy `custom_components/scene_presets` to `/config/custom_components/` (or install the fork via HACS).
2. Restart Home Assistant.
3. Use Developer Tools > Actions to call the services and watch the lights / the HA log.
