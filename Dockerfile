FROM node:20

WORKDIR /app

COPY ./ ./
RUN yarn

CMD ["yarn", "dev"] 