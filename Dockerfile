# install node_modules in a separate container
FROM node:12-alpine as npminstall

# generate the node_modules directory
ARG NODE_ENV=production
ENV NODE_ENV          $NODE_ENV
COPY /package.json /package-lock.json /tmp/
RUN set -xeuo pipefail \
    && export USER=root \
    && export HOME=/root \
    && cd /tmp \
    && mkdir -p \
        /tmp/.npm \
        /tmp/.npm-tmp \
    && npm config set unsafe-perm true \
    && npm config set cache /tmp/.npm --global\
    && npm config set tmp /tmp/.npm-tmp --global \
    && npm ci --quiet \
    && rm -rf \
        /tmp/package.json \
        /tmp/package-lock.json \
        /tmp/.npm \
        /tmp/.npm-tmp

FROM node:12-alpine

# Install core libs
RUN set -xeuo pipefail \
    && apk add --no-cache \
        --repository http://nl.alpinelinux.org/alpine/edge/main \
        --repository http://nl.alpinelinux.org/alpine/edge/community \
            ca-certificates \
            curl \
            tini

# app variables
ENV APP_ROOT          /opt/app
ENV CONFIG_ROOT       /config

# make app directory
RUN set -xeuo pipefail \
    && mkdir -p \
        /config \
        $APP_ROOT

# generate the node_modules directory
ARG NODE_ENV=production
ENV NODE_ENV          $NODE_ENV
COPY /package.json /package-lock.json $APP_ROOT/
COPY --from=npminstall /tmp/node_modules $APP_ROOT/node_modules

# copy application
COPY /_src $APP_ROOT/src

LABEL   description="metrics-proxy: Simple server to split kubernetes custom metrics to multiple metrics servers." \
        maintainer="Wei Kin Huang"

# boot up the application
WORKDIR $APP_ROOT
CMD [ "tini", "--", "node", "/opt/app/src/index.js" ]
