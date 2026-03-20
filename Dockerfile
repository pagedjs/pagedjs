FROM node:20-bookworm-slim

ARG DEBIAN_FRONTEND=noninteractive

# Install Chrome dependencies, fonts, and display server
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  wget \
  git \
  openssh-client \
  xvfb \
  libxss1 \
  dbus \
  dbus-x11 \
  fontconfig \
  fonts-freefont-ttf \
  fonts-gfs-neohellenic \
  fonts-indic \
  fonts-ipafont-gothic \
  fonts-kacst \
  fonts-liberation \
  fonts-noto-cjk \
  fonts-noto-color-emoji \
  fonts-roboto \
  fonts-thai-tlwg \
  fonts-ubuntu \
  fonts-wqy-zenhei \
  && rm -rf /var/lib/apt/lists/*

# Freetype hinting configuration
COPY docker/docker-font.conf /etc/fonts/local.conf
ENV FREETYPE_PROPERTIES="truetype:interpreter-version=35"

# Chrome/dbus environment
ENV DBUS_SESSION_BUS_ADDRESS=autolaunch:
RUN service dbus start

# Run as non-root user (node user comes with node: base image)
USER node

ENV DIRECTORY=/home/node/pagedjs
RUN mkdir -p $DIRECTORY
WORKDIR $DIRECTORY

# Install dependencies (Puppeteer downloads Chrome automatically)
COPY --chown=node:node package.json package-lock.json $DIRECTORY/
COPY --chown=node:node packages/ $DIRECTORY/packages/
RUN npm install

COPY --chown=node:node . $DIRECTORY

CMD ["./packages/cli/src/cli.js"]
