// Worker adapters share this lease for active work and retained image resources.
let owner = null;
export function acquireImageOperation(token) {
  if (owner !== null && owner !== token) return false;
  owner = token;
  return true;
}
export function releaseImageOperation(token) {
  if (owner === token) owner = null;
}
