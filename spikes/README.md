# Spikes

Spikes are throwaway experiments: untested as product code and unmaintained. They supply observations for decisions. Rewrite accepted decisions in production code; never copy a spike into the product.

| Spike | Question | Run command |
| --- | --- | --- |
| `unprotected-salt` | [Does an unprotected random salt improve complete-image hiding, and what recovery remains?](https://github.com/jdragulanescu/obscr/issues/31) | `npm run spike-unprotected-salt` |
