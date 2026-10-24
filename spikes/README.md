# Spikes

Spikes are disposable experiments: untested as production software, unmaintained, and outside production builds. They provide evidence for decisions. Rewrite accepted decisions in production code with its own tests; do not copy a spike into production.

| Spike | Question | Run command |
| --- | --- | --- |
| [Adaptive codec](adaptive-codec/README.md) | [Prove adaptive message coding and salt discovery across browser and CLI](https://github.com/jdragulanescu/obscr/issues/35) | `npm run spike-adaptive-codec` |
