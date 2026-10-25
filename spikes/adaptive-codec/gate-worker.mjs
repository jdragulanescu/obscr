// Disposable real-codec worker; terminated on cancellation or the 30-second deadline.
import { runGate } from './gate.mjs';
self.onmessage = async () => {
  try {
    const response = await fetch('./codec.wasm');
    if (!response.ok) throw Error(`WASM load failed: ${response.status}`);
    const result = await runGate(await response.arrayBuffer(), progress => self.postMessage({ progress }));
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: String(error) }); }
};
