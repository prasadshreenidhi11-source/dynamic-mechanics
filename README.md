# APEX Hypercars: scroll-scrubbed hero

A concept landing page for a fictional hypercar brand. The hero is a short AI-generated video (a yellow hypercar opening its hood and doors) that plays frame by frame as you scroll, then crossfades into an exploded V12 engine.

Concept design only. APEX is not a real brand.

## Features

- **Scroll-scrubbed hero**: 190 video frames drawn on a canvas, driven by scroll position with eased follow
- **Page segments**: Models, Performance (count-up numbers), Experience (parallax engine image), Contact (enquiry form), footer
- **Smart loader**: progress follows the real frame loading, then offers "Enter with sound" or "Without sound"
- **Right-side progress rail**: section markers, current section highlighted, click to jump
- **Sound toggle in the header**: generated ambience (WebAudio, no audio files) that opens up as the doors rise. Browsers only allow sound after a click, so the loader's Enter button starts it
- **Car colour picker (bottom-left)**: 8 colours, applied as a smooth tint to the hero; the site accent colour follows. Choice is remembered

## Run it

It is plain HTML, CSS and JavaScript with no build step. It must be served over HTTP (not opened as a file) so the frames load:

```bash
python -m http.server 5300
# then open http://127.0.0.1:5300/index.html
```

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page markup |
| `styles.css` | All styling |
| `app.js` | Hero scrub: loads frames, draws them to the canvas by scroll progress |
| `sections.js` | Reveal on scroll, count-up numbers, parallax, header background |
| `audio.js` | Generated ambience and the sound toggle |
| `loader.js` | Loader and the right-side progress rail |
| `colors.js` | Car colour picker |
| `frames_hd3/` | The 190 hero frames (1920x1080 WebP) |
| `video/hero.mp4` | Source clip (Veo 3.1 Lite, 720p, 8 s) |
| `assets/` | Engine image, card images, grain texture |

## How the hero was made

1. Stills (closed car, doors-open car, exploded engine) generated in Google Flow.
2. One 8 s video generated from the closed-car frame to the doors-open frame.
3. Frames extracted with ffmpeg, cleaned (deblock + denoise), upscaled to 1920x1080 and saved as WebP:

```bash
ffmpeg -i video/hero.mp4 \
  -vf "deblock=filter=strong:block=8,hqdn3d=5:4:3:3,scale=1920:1080:flags=lanczos,unsharp=7:7:0.5:3:3:0.0" \
  -c:v libwebp -quality 88 -start_number 1 frames_hd3/f_%04d.webp
```

If you change the number of frames, update `FRAME_COUNT` at the top of `app.js`.

## Known limits

- **Image sharpness**: the source video is 720p and heavily compressed, so the car looks soft at full screen. Frame cleanup helps but cannot add detail. A higher-quality source clip is the real fix.
- **Colour picker** is a tint on the video, not a re-render. Yellow to other colours works best; Silver and Nero are approximate.
- **Enquiry form** does not send anywhere yet.
- **Phone layout** has not been tested.
