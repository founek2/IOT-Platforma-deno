FROM denoland/deno

WORKDIR /app

COPY ./ ./
RUN deno cache src/index.ts
RUN deno check src/index.ts

CMD ["run", "--allow-net","--allow-read=.", "--allow-write=.", "--no-check", "--allow-env", "src/index.ts"]