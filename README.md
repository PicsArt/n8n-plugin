# PicsArt-n8n-nodes

pnpm run build

docker build -t picsart-n8n-nodes .

docker run -it --rm -p 5678:5678 picsart-n8n-nodes
