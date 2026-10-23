# Spikes

Spikes are throwaway, untested, unmaintained experiments. They answer a question; they are not product features. Rewrite accepted decisions in production code with tests. Never copy a spike into production.

The app and CLI do not import these folders. The root Jest patterns do not select them. Each spike owns any extra dependencies. Package publication includes only `bin/` and `lib/`.

| Spike | Question | Run command |
|---|---|---|
| [Image survival](image-survival/README.md) | [What can a complete encoded image survive?](https://github.com/jdragulanescu/obscr/issues/16) | `npm run spike-image-survival` |
