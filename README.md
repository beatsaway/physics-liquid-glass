# Liquid Glass Metaballs (Fork)
Demo: https://physics-liquid-glass.netlify.app/

This is a fork of the original Three.js + Rapier liquid glass metaballs demo. The core rendering and physics are unchanged; the focus here is on **interactive controls, presets, and scene selection** to make experimentation easier.

## Features in This Fork
- **New parameters added**: size/speed variance, recenter force, noise, and swirl.
- **Control panel UI**: Bottom overlay with compact sliders and a centered toggle button.
- **Preset system**: Named presets, dropdown selector, and keyboard cycling with `N`.
- **Label reset**: Click any slider label to tween back to the active preset default.
- **More HDR scenes**: Additional HDRs sourced from https://cgees.com/hdris.
- **Scene selection**: Environment HDR JPG dropdown and default `vysok-k-men-2K`.
- **Mouse wheel depth**: Scroll wheel moves the metaball group closer/farther.
- **Mobile-first layout**: Same bottom panel on desktop and mobile, 3 sliders per row

## How to Use
- Open `index.html` in a browser.
- Click the **...** button to open the controls panel.
- Use the dropdowns to switch environment or preset.
- Press `N` to cycle presets.
- Click a slider label to reset it to the active preset’s default.
- Press `Space` to pick a random environment.

## Development Notes
All changes live in `index.html`, `index.js`, and `getBodies.js`. Update those files to add presets, tweak physics, or adjust the UI.

## Dependencies
- [Three.js](https://threejs.org/) (Orbit Controls, Marching Cubes)
- [Rapier Physics](https://rapier.rs/)

## License and Credits
MIT. Same as the original project. Forked from https://github.com/bobbyroe/physics-liquid-glass.

If you enjoy using this fork, buymeacoffee.com/beatsaway.