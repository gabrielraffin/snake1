FROM public.ecr.aws/bitnami/node:20

ARG NODE_ENV
ARG LOG_LEVEL
ARG PORT
ARG SNAKE_INTERNAL_NAME

ENV NODE_ENV=$NODE_ENV
ENV LOG_LEVEL=$LOG_LEVEL
ENV PORT=$PORT
ENV SNAKE_INTERNAL_NAME=$SNAKE_INTERNAL_NAME

# Bundle app source
COPY node_modules node_modules
COPY build build

EXPOSE $PORT

CMD [ "node", "build/index.js" ]
