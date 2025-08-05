FROM n8nio/n8n:latest

USER root

COPY ./ /home/node/.n8n/custom

RUN chown -R node:node /home/node/.n8n/custom \
    && rm -rf /home/node/.n8n/custom/node_modules \
    && rm -f /home/node/.n8n/custom/pnpm-lock.yaml

RUN npm install -g pnpm

USER node

RUN pnpm install --prefix /home/node/.n8n/custom