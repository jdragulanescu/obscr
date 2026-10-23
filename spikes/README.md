# Spikes

Spikes are throwaway, untested, unmaintained experiments. Their recorded checks answer a bounded question; they are not the production test suite. Rewrite accepted decisions in production code, with tests. Never copy a spike into production.

| Spike | Question | Run command |
| --- | --- | --- |
| [Password device cost](password-device-cost/README.md) | [Which common password-processing profiles meet the device budget?](https://github.com/jdragulanescu/obscr/issues/27) | `npm run spike-password-device-cost` |
