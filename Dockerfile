FROM denoland/deno

WORKDIR /app
USER deno

COPY ./ ./
RUN deno cache src/index.ts

CMD ["run", "--allow-net","--allow-read", "--allow-env", "src/index.ts"]