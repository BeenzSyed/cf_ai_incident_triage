export function onRequest({ request, env }) {
  return env.TRIAGE.fetch(request);
}
