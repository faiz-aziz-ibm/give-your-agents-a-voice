# Give your agents a voice · IBM watsonx Orchestrate × ElevenLabs

Poster site for the voice-agents film, in the same design system as the film.

- `index.html` is the built page. GitHub Pages serves it as-is (`.nojekyll`).
- `assets/` holds the film (`voice-agents-film.mp4`, v5), its poster, the link-preview image, logos and the favicon.
- `tools/template.html` is the source. `tools/build.mjs` inlines three things:
  - the hero line drawing (`tools/drawing.mjs`: the call → the voice → the action);
  - the world map with its greeting pins (`tools/world.json`, from `tools/geo-outline.mjs`);
  - the "Get in touch" link (`tools/config.json` → `cta`).

```bash
node tools/build.mjs          # rebuild index.html
node tools/serve.mjs 4174     # local preview at http://localhost:4174
```
