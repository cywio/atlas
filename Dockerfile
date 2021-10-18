# Build stage
FROM node:15-alpine AS build
WORKDIR /build

# Install modules with dev dependencies
COPY package.json yarn.lock /build/
RUN yarn install --froezn-lockfile

# Build
COPY . /build
RUN yarn db:generate
RUN yarn build

# Regenerate node modules as production
RUN rm -rf ./node_modules
RUN apk --no-cache add cmake clang clang-dev make gcc g++ libc-dev linux-headers
RUN apk add --no-cache --virtual .gyp \
        python \
        make \
        g++ \
    && yarn install --production --frozen-lockfile \
    && apk del .gyp

# Bundle stage
FROM node:15-alpine AS production

WORKDIR /app

# Copy from build stage
COPY --from=build /build/node_modules ./node_modules
COPY --from=build /build/yarn.lock /build/package.json ./
COPY --from=build /build/public ./public
COPY --from=build /build/prisma ./prisma
COPY --from=build /build/.next ./.next

# Start script
USER node
EXPOSE 3000
CMD ["yarn", "start:prod"]
