# build and test application
FROM node:14-buster-slim as compile

ENV NODE_ENV=development

WORKDIR /tmp
COPY .npmrc package.json package-lock.json /tmp/
RUN set -ex \
    && npm ci

COPY . /tmp/
RUN set -ex \
    && npm run lint \
    && npm run test \
    && npm run build \
    && ( find . -name '__mocks__' -exec rm -rf {} \; || true ) \
    && ( find . -name '*.spec.js' -exec rm -rf {} \; || true ) \
    && find . -name '*.ts' -exec rm -rf {} \;

# install node modules
FROM node:14-buster-slim as nodemodules

WORKDIR /tmp
COPY .npmrc package.json package-lock.json /tmp/
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN set -ex \
    && npm ci

# final build
FROM debian:buster-slim as dist

# Install core libs
RUN set -eux \
    && apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        tini \
    && apt-get purge -y --auto-remove \
    && rm -rf /var/lib/apt/lists/*

# install node from the node image
COPY --from=nodemodules /usr/local/bin/node /usr/local/bin/node

# app variables
ENV APP_ROOT          /opt/app

# make app directory
RUN set -xeu \
    && mkdir -p \
        $APP_ROOT

# generate the node_modules directory
ARG NODE_ENV=production
ENV NODE_ENV          $NODE_ENV
COPY /package.json /package-lock.json $APP_ROOT/
COPY --from=nodemodules /tmp/node_modules $APP_ROOT/node_modules

# copy application
COPY --from=compile /tmp/dist $APP_ROOT/src

WORKDIR $APP_ROOT

LABEL   description="metrics-proxy: Simple server to split kubernetes custom metrics to multiple metrics servers." \
        maintainer="Wei Kin Huang"

# boot up the application
ENTRYPOINT ["tini", "-s", "-g", "--"]
CMD ["node", "--no-deprecation", "--enable-source-maps", "/opt/app/src/index.js"]
