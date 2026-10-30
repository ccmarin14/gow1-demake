// Node test hook: lets `node --experimental-transform-types` run the TypeScript
// sources, whose relative imports omit the `.ts` extension (Vite resolves them).
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    const relative = specifier.startsWith('./') || specifier.startsWith('../');
    if (relative && !specifier.endsWith('.ts')) {
      return next(`${specifier}.ts`, context);
    }
    throw error;
  }
}
