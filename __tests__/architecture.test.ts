type DirEntry = {
  name: string;
  isDirectory: () => boolean;
};

type FsModule = {
  readdirSync: (dir: string, options: { withFileTypes: true }) => DirEntry[];
  readFileSync: (filePath: string, encoding: string) => string;
};

type PathModule = {
  resolve: (...paths: string[]) => string;
  join: (...paths: string[]) => string;
  relative: (from: string, to: string) => string;
  dirname: (p: string) => string;
  sep: string;
};

declare const __dirname: string;

const fs = require('fs') as FsModule;
const path = require('path') as PathModule;

function getFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractImports(filePath: string): { specifier: string; line: number }[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines: string[] = content.split('\n');
  const imports: { specifier: string; line: number }[] = [];
  const importRegex = /(?:import|export)\s+(?:.*?from\s+)?['"](.*?)['"]/g;

  lines.forEach((lineText: string, index: number) => {
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(lineText)) !== null) {
      const captured = match[1];
      if (captured) {
        imports.push({ specifier: captured, line: index + 1 });
      }
    }
  });

  return imports;
}

describe('Architecture boundaries', () => {
  const rootDir = path.resolve(__dirname, '..');
  const srcCoreDir = path.join(rootDir, 'src', 'core');
  const srcFeaturesDir = path.join(rootDir, 'src', 'features');

  it('src/core must not import from src/features', () => {
    const coreFiles = getFiles(srcCoreDir);
    const violations: string[] = [];

    for (const file of coreFiles) {
      const imports = extractImports(file);
      for (const imp of imports) {
        if (
          imp.specifier.startsWith('@/features') ||
          imp.specifier.includes('/features') ||
          imp.specifier.startsWith('../features')
        ) {
          violations.push(
            `${path.relative(rootDir, file)}:${imp.line} imports from features: "${imp.specifier}"`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('a feature must only import other features through their root index.ts', () => {
    const featureFiles = getFiles(srcFeaturesDir);
    const violations: string[] = [];

    for (const file of featureFiles) {
      const relativeToFeatures = path.relative(srcFeaturesDir, file);
      const currentFeature = relativeToFeatures.split(path.sep)[0];
      const imports = extractImports(file);

      for (const imp of imports) {
        // Check alias import: @/features/<otherFeature>/...
        if (imp.specifier.startsWith('@/features/')) {
          const parts = imp.specifier.replace('@/features/', '').split('/');
          const importedFeature = parts[0];
          // If it imports a different feature's inner files
          if (importedFeature !== currentFeature && parts.length > 1) {
            // Only root index or bare feature path is allowed
            if (parts.length === 2 && parts[1] === 'index') {
              // allowed
            } else {
              violations.push(
                `${path.relative(rootDir, file)}:${imp.line} imports inner file of "${importedFeature}": "${imp.specifier}"`,
              );
            }
          }
        }

        // Check relative cross-feature import (e.g. ../otherFeature/...)
        if (imp.specifier.startsWith('../') || imp.specifier.startsWith('../../')) {
          const resolved = path.resolve(path.dirname(file), imp.specifier);
          const relativeToFeaturesDir = path.relative(srcFeaturesDir, resolved);
          const targetFeature = relativeToFeaturesDir.split(path.sep)[0];

          if (
            !relativeToFeaturesDir.startsWith('..') &&
            targetFeature &&
            targetFeature !== currentFeature
          ) {
            const innerParts = relativeToFeaturesDir.split(path.sep).slice(1);
            if (innerParts.length > 0 && !(innerParts.length === 1 && innerParts[0]?.startsWith('index'))) {
              violations.push(
                `${path.relative(rootDir, file)}:${imp.line} relative import into inner file of "${targetFeature}": "${imp.specifier}"`,
              );
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
