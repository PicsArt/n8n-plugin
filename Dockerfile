FROM n8nio/n8n:latest

USER root

COPY ./ /home/node/.n8n/custom

RUN chown -R node:node /home/node/.n8n/custom \
    && rm -rf /home/node/.n8n/custom/node_modules

USER node

# rebuild.sh builds dist/ on the host; install runtime deps only (npm ships with the n8n image)
RUN npm install --prefix /home/node/.n8n/custom --omit=dev --ignore-scripts
