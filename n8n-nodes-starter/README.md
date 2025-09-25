# Picsart nodes for n8n

Custom n8n nodes that integrate Picsart image APIs:
- Picsart Enhance: upscale an image (2–8x) and output as binary.
- Picsart Remove Background: remove background and optionally style the result.

## Prerequisites

You need the following installed on your development machine:

* [git](https://git-scm.com/downloads)
* Node.js and npm. Minimum version Node 20. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL [here](https://github.com/nvm-sh/nvm). For Windows users, refer to Microsoft's guide to [Install NodeJS on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
* Install n8n with:
  ```
  npm install n8n -g
  ```
* Recommended: follow n8n's guide to [set up your development environment](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/).

## Quick start (Docker)

1) Build and run
```
docker build --no-cache -t picsart-n8n-nodes .
docker run -d --rm -p 5678:5678 --name picsart-n8n-nodes picsart-n8n-nodes
```

2) Open n8n: http://localhost:5678

3) Add credentials
- Settings → Credentials → add “Picsart API” and paste your API Key.

4) Use the nodes
- Create a workflow and add one of:
  - Picsart Enhance
  - Picsart Remove Background

## Node details

### Picsart Enhance
- Parameters:
  - Image URL (required): 1–2083 chars, must be a valid URL. The URL file extension (if present) must be JPG/PNG/WEBP and match the Format.
  - Upscale Factor: integer 2–16.
  - Format: JPG | PNG | WEBP (defaults to JPG).
- Output: binary data under `binary.data` and JSON metadata.

### Picsart Remove Background
- Parameters:
  - Image URL (required): source image URL.
  - Output Type: cutout | mask (default cutout).
  - Background options (mutually exclusive in UI and validated in execute):
    - Bg Image URL
    - Bg Color (CSS color or hex)
  - Bg Blur: 0–100
  - Bg Width/Height: integers (optional)
  - Scale: fit | fill
  - Auto Center: true | false (works only with cutout)
  - Stroke: size 0–100, color, opacity 0–100
  - Shadow: disabled | custom | directional, with opacity/blur/offsets
  - Format: JPG | PNG | WEBP
- Output: binary data under `binary.data` and JSON metadata.

## Local development
```
npm install
npm run build
```
Run with Docker as above, or use n8n locally with `n8n-node-dev`.

## More information

Refer to n8n docs for node creation and testing: https://docs.n8n.io/integrations/creating-nodes/

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
