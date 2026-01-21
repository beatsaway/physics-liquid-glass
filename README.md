# Liquid Glass Metaballs (Fork)

This repository is a fork of the original Three.js + Rapier liquid glass metaballs demo. The core rendering and physics remain, but this fork focuses on **interactive controls, presets, and scene selection** to make experimentation easier for users.

## What Changed in This Fork
- **Control panel UI**: A bottom overlay panel with compact sliders and a centered toggle button.
- **Slider controls**: Live controls for split mesh count, size variance(new parameter), metaball size, glue strength, spread, speed variance(new parameter), recenter force (new parameter), noise(new parameter), and swirl(new parameter).
- **Preset system**: Multiple named presets, a preset dropdown, and keyboard cycling with `N`.
- **Label reset**: Clicking any slider label tweens that value back to the current preset’s default.
- **Scene selection**: Environment HDR JPG dropdown + default environment set to `vysok-k-men-2K`.
- **Mouse wheel depth**: Scroll wheel moves the metaball group closer/farther from the camera.
- **Mobile-first layout**: Same bottom panel layout on desktop and mobile, 3 sliders per row, and click‑outside to close.

## How to Use
- Open `index.html` in a browser.
- Click the **...** button to open the controls panel.
- Use the dropdowns to switch environment or preset.
- Press `N` to cycle presets.
- Click a slider label to reset it to the active preset’s default.
- Press `Space` to pick a random environment.

## Dependencies
- [Three.js](https://threejs.org/) (Orbit Controls, Marching Cubes)
- [Rapier Physics](https://rapier.rs/)

## Development
All changes live in `index.html`, `index.js`, and `getBodies.js`. Update those files to add presets, tweak physics, or adjust the UI.

## License
MIT. Same as the original project.

Forked from https://github.com/bobbyroe/physics-liquid-glass
New features: control panel UI, more sliders, presets + dropdown, label reset,
scene selector, mouse-wheel depth, and mobile-friendly layout.
