// Deliberately self-contained: the runtime installs this function in the isolated API worker.
export function createRouter() {
  const routes = [];
  const router = {};
  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    router[method] = (path, handler) => {
      if (typeof path !== 'string' || !path.startsWith('/') || typeof handler !== 'function')
        throw Error('Register a route with a /path and a handler function.');
      routes.push({ method: method.toUpperCase(), segments: path.split('/'), handler });
      return router;
    };
  }
  router.handle = async (request, db) => {
    const url = new URL(request.path, 'https://practice.invalid');
    let segments;
    try {
      segments = url.pathname.split('/').map(decodeURIComponent);
    } catch {
      return { status: 400, body: { error: 'Malformed path' } };
    }
    for (const route of routes) {
      if (
        route.method !== request.method.toUpperCase() ||
        route.segments.length !== segments.length
      )
        continue;
      const params = Object.create(null);
      if (
        !route.segments.every((part, i) => {
          if (!part.startsWith(':')) return part === segments[i];
          if (!segments[i]) return false;
          params[part.slice(1)] = segments[i];
          return true;
        })
      )
        continue;
      return route.handler({ ...request, params, query: url.searchParams }, db);
    }
    return { status: 404, body: { error: 'Not found' } };
  };
  return router;
}
