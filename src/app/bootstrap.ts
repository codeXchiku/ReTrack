import { clearRegistry, registerFeatures } from '@/core/registry/featureRegistry';
import { features } from './features';

let bootstrapped = false;

/**
 * Bootstraps the application by registering feature manifests.
 * Full startup sequence (database, migrations, etc.) will be added in SD-004.
 */
export function bootstrap(): void {
  if (bootstrapped && (typeof __DEV__ === 'undefined' || !__DEV__)) {
    return;
  }
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    clearRegistry();
  }
  registerFeatures(features);
  bootstrapped = true;
}
