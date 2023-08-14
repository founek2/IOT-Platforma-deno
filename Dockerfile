FROM denoland/deno

WORKDIR /app

COPY ./ ./
RUN deno cache src/index.ts

CMD ["run", "--allow-net","--allow-read", "--allow-env", "src/index.ts"]