// All worker adapters in one tab/process share this heavyweight-operation lease.
let owner = null;
export function acquireImageOperation(token) {
  if (owner !== null) return false;
  owner = token;
  return true;
}
export function releaseImageOperation(token) {
  if (owner === token) owner = null;
}
