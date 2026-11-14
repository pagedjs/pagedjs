FROM mcr.microsoft.com/playwright:v1.58.2-noble

ENV NODE_ENV=development
ENV PORT=9090
ENV DIRECTORY=/home/pwuser/pagedjs
ENV CONNECTION_TIMEOUT=60000

COPY docker-font.conf /etc/fonts/local.conf
ENV FREETYPE_PROPERTIES="truetype:interpreter-version=35"
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends \
		dumb-init \
		fontconfig \
		fonts-freefont-ttf \
		fonts-ipafont-gothic \
		fonts-kacst \
		fonts-liberation \
		fonts-thai-tlwg \
		fonts-wqy-zenhei \
		libxss1 \
		ttf-mscorefonts-installer \
	&& rm -rf /var/lib/apt/lists/*
RUN mkdir -p "$DIRECTORY" && chmod -R 777 "$DIRECTORY"
WORKDIR $DIRECTORY

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

EXPOSE $PORT

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
