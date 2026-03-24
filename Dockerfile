FROM mcr.microsoft.com/playwright:v1.58.2-noble

# Application parameters and variables
ENV NODE_ENV=development
ENV PORT=9090
ENV DIRECTORY=/home/pwuser/pagedjs

# Configuration for Chrome
ENV CONNECTION_TIMEOUT=60000

# Update Freetype
COPY docker-font.conf /etc/fonts/local.conf
ENV FREETYPE_PROPERTIES="truetype:interpreter-version=35"
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections
RUN apt-get update \
	&& apt-get install -y --no-install-recommends fontconfig ttf-mscorefonts-installer

# Install fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN apt-get update && apt-get install -y --no-install-recommends \
		fonts-liberation fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
	&& rm -rf /var/lib/apt/lists/*

# helps prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

RUN mkdir -p $DIRECTORY

# All running as root and as non-privileged user.
RUN chmod -R 777 $DIRECTORY

WORKDIR $DIRECTORY

COPY package.json package-lock.json $DIRECTORY/
RUN npm install

COPY . $DIRECTORY

EXPOSE $PORT

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
