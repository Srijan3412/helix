import { FileNode, AnalysisResult } from "@shared/types";
import { Project, SourceFile, SyntaxKind } from "ts-morph";
import fs from "fs/promises";

export interface ArchitectureLayers {
  routes: string[];
  controllers: string[];
  services: string[];
  repositories: string[];
  models: string[];
  database: string[];
  middleware: string[];
  config: string[];
  tests: string[];
  utils: string[];
}

export class LayerDetectorService {
  private static projectCache: Map<string, Project> = new Map();

  static async detect(result: AnalysisResult): Promise<ArchitectureLayers> {
    const files = result.files || [];
    const dbInfo = result.metadata?.databaseInfo;

    const layers: ArchitectureLayers = {
      routes: [],
      controllers: [],
      services: [],
      repositories: [],
      models: [],
      database: [],
      middleware: [],
      config: [],
      tests: [],
      utils: []
    };

    const rules = [
      { layer: "routes" as const, regex: /\broutes\b|\broute\b|\.route\b|src\/routes\//i },
      { layer: "controllers" as const, regex: /\bcontrollers\b|\bcontroller\b|\.controller\b|src\/controllers\//i },
      { layer: "services" as const, regex: /\bservices\b|\bservice\b|\.service\b|src\/services\//i },
      { layer: "repositories" as const, regex: /\brepositories\b|\brepository\b|\brepo\b|\.repository\b|\.repo\b|src\/repositories\//i },
      { layer: "models" as const, regex: /\bmodels\b|\bmodel\b|\bentities\b|\bentity\b|\.model\b|\.entity\b|src\/models\//i },
      { layer: "middleware" as const, regex: /\bmiddleware\b|\bmiddleware\b|\.middleware\b|src\/middleware\//i },
      { layer: "config" as const, regex: /\bconfig\b|\bconfiguration\b|\.config\b|src\/config\//i },
      { layer: "tests" as const, regex: /\.test\b|\.spec\b|__tests__\b|tests?\//i },
      { layer: "utils" as const, regex: /\butils\b|\butility\b|\.util\b|src\/utils\//i },
    ];

    const classificationMethod: Record<string, 'ast' | 'regex' | 'fallback'> = {};

    for (const file of files) {
      const pathLower = file.path.toLowerCase();

      if (
        pathLower.startsWith("route:") ||
        pathLower.startsWith("env:") ||
        pathLower.startsWith("db:") ||
        pathLower.startsWith("entity:")
      ) {
        continue;
      }

      let matched = false;

      try {
        const astLayer = await LayerDetectorService.analyzeFileAST(file.path);
        if (astLayer && astLayer in layers) {
          layers[astLayer as keyof ArchitectureLayers].push(file.path);
          classificationMethod[file.path] = 'ast';
          matched = true;
          continue;
        }
      } catch (error) {
        // Fallback silently
      }

      if (!matched) {
        for (const rule of rules) {
          if (rule.regex.test(file.path)) {
            layers[rule.layer].push(file.path);
            classificationMethod[file.path] = 'regex';
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        if (/\bprisma\b|schema\.prisma|\bconnection\b|\bdb\b|\.sql\b|\.schema\b/i.test(file.path)) {
          layers.database.push(file.path);
          classificationMethod[file.path] = 'fallback';
          matched = true;
        }
      }
    }

    if (dbInfo?.type) {
      layers.database.push(`DB: ${dbInfo.type}`);
    } else if (dbInfo?.databases && dbInfo.databases.length > 0) {
      dbInfo.databases.forEach(db => layers.database.push(`DB: ${db}`));
    }

    (layers as any).__classificationMethod = classificationMethod;

    return layers;
  }



static calculateLayerMetrics(
  layers: ArchitectureLayers,
  result: AnalysisResult
): Array < {
  name: string;
  files: string[];
  health: number;
  confidence: number;
  color?: string;
} > {
  const classificationMethod = (layers as any).__classificationMethod || {};

  const layerColors: Record<string, string> = {
  routes: "#6366f1",
    controllers: "#8b5cf6",
      services: "#3b82f6",
        repositories: "#06b6d4",
          models: "#10b981",
            database: "#f59e0b",
              middleware: "#f472b6",
                config: "#8b5cf6",
                  tests: "#34d399",
                    utils: "#f97316"
};

return Object.entries(layers)
  .filter(([key]) => key !== '__classificationMethod')
  .map(([name, files]) => {
    let health = 80;

    // File count scoring
    if (files.length === 0) health = 0;
    else if (files.length < 3) health += 5;
    else if (files.length > 50) health -= 20;
    else if (files.length > 30) health -= 10;

    // Complexity scoring
    if (result?.staticAnalysis?.complexity) {
      const layerComplexity = result.staticAnalysis.complexity
        .filter((c: any) => files.includes(c.file))
        .reduce((sum: number, c: any) => sum + c.score, 0);
      const avgComplexity = layerComplexity / (files.length || 1);
      if (avgComplexity > 15) health -= 15;
      else if (avgComplexity > 10) health -= 8;
      else if (avgComplexity > 5) health -= 3;
      else if (avgComplexity > 0) health += 5;
    }

    // Dead code penalty
    if (result?.staticAnalysis?.deadCode) {
      const deadFiles = result.staticAnalysis.deadCode
        .filter((d: any) => files.includes(d.file)).length;
      const deadPercentage = (deadFiles / (files.length || 1)) * 100;
      if (deadPercentage > 30) health -= 20;
      else if (deadPercentage > 15) health -= 10;
      else if (deadPercentage > 0) health -= 5;
    }

    // God services penalty
    if (result?.staticAnalysis?.godServices) {
      const godFiles = result.staticAnalysis.godServices
        .filter((g: any) => files.includes(g.file)).length;
      const godPercentage = (godFiles / (files.length || 1)) * 100;
      if (godPercentage > 20) health -= 25;
      else if (godPercentage > 10) health -= 15;
      else if (godPercentage > 0) health -= 8;
    }

    // Calculate confidence
    let confidence = 0.7;
    if (files.length > 0) {
      const totalFiles = Object.keys(classificationMethod).length;
      const astFiles = Object.values(classificationMethod).filter(m => m === 'ast').length;
      const astPercentage = totalFiles > 0 ? astFiles / totalFiles : 0;
      confidence += astPercentage * 0.2;
      const regexFiles = Object.values(classificationMethod).filter(m => m === 'regex').length;
      const regexPercentage = totalFiles > 0 ? regexFiles / totalFiles : 0;
      confidence -= regexPercentage * 0.1;
    }

    health = Math.max(10, Math.min(100, health));
    confidence = Math.max(0.1, Math.min(1, confidence));

    return {
      name,
      files,
      health,
      confidence,
      color: layerColors[name.toLowerCase()] || "#10b981"
    };
  });
}

  /**
   * AST-based file classification using ts-morph
   * Returns layer name or null if unable to classify
   */
private static async analyzeFileAST(filePath: string): Promise < string | null > {  // ✅ No space
  try {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if(!ext || !['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
  return null;
}

// Get or create project instance
const project = LayerDetectorService.getOrCreateProject();

// Add the source file
let sourceFile: SourceFile | undefined;
try {
  sourceFile = project.addSourceFileAtPath(filePath);
} catch (error) {
  // If file can't be parsed, skip
  return null;
}

// Check 1: Decorators (most reliable)
const decorators = sourceFile.getDecorators();
for (const decorator of decorators) {
  const decoratorName = decorator.getName();

  if (decoratorName === 'Controller' || decoratorName === 'controller') {
    return 'controllers';
  }
  if (decoratorName === 'Injectable' || decoratorName === 'Service' || decoratorName === 'service') {
    return 'services';
  }
  if (decoratorName === 'Entity' || decoratorName === 'Model' || decoratorName === 'model') {
    return 'models';
  }
  if (decoratorName === 'Repository' || decoratorName === 'repository') {
    return 'repositories';
  }
  if (decoratorName === 'Middleware' || decoratorName === 'middleware') {
    return 'middleware';
  }
  if (decoratorName === 'Config' || decoratorName === 'Configuration') {
    return 'config';
  }
  if (decoratorName === 'Route' || decoratorName === 'routes') {
    return 'routes';
  }
}

// Check 2: Class inheritance
const classes = sourceFile.getClasses();
for (const cls of classes) {
  const extendsClause = cls.getExtends();
  if (extendsClause) {
    const parentName = extendsClause.getText();
    const parentLower = parentName.toLowerCase();

    if (parentLower.includes('controller')) {
      return 'controllers';
    }
    if (parentLower.includes('service') || parentLower.includes('base')) {
      return 'services';
    }
    if (parentLower.includes('repository') || parentLower.includes('repo')) {
      return 'repositories';
    }
    if (parentLower.includes('model') || parentLower.includes('entity')) {
      return 'models';
    }
    if (parentLower.includes('middleware')) {
      return 'middleware';
    }
    if (parentLower.includes('config') || parentLower.includes('configuration')) {
      return 'config';
    }
  }

  // Check class name patterns
  const className = cls.getName()?.toLowerCase() || '';
  if (className.includes('controller')) {
    return 'controllers';
  }
  if (className.includes('service')) {
    return 'services';
  }
  if (className.includes('repository') || className.includes('repo')) {
    return 'repositories';
  }
  if (className.includes('model') || className.includes('entity')) {
    return 'models';
  }
  if (className.includes('middleware')) {
    return 'middleware';
  }
  if (className.includes('config') || className.includes('configuration')) {
    return 'config';
  }
}

// Check 3: Export types
const exports = sourceFile.getExportedDeclarations();
for (const [name, declarations] of exports) {
  const nameLower = name.toLowerCase();

  // Check for route exports (e.g., export const routes = [...])
  if (nameLower === 'routes' || nameLower === 'route' || nameLower.includes('route')) {
    return 'routes';
  }
  if (nameLower === 'controllers' || nameLower === 'controller') {
    return 'controllers';
  }
  if (nameLower === 'services' || nameLower === 'service') {
    return 'services';
  }
  if (nameLower === 'repositories' || nameLower === 'repository' || nameLower === 'repo') {
    return 'repositories';
  }
  if (nameLower === 'models' || nameLower === 'model' || nameLower === 'entity') {
    return 'models';
  }
  if (nameLower === 'middleware') {
    return 'middleware';
  }
  if (nameLower === 'config' || nameLower === 'configuration') {
    return 'config';
  }
  if (nameLower === 'utils' || nameLower === 'utility') {
    return 'utils';
  }
  if (nameLower === 'test' || nameLower === 'spec' || nameLower.includes('test')) {
    return 'tests';
  }

  // Check declaration types
  for (const declaration of declarations) {
    const kind = declaration.getKindName();
    if (kind === 'VariableDeclaration') {
      const type = declaration.getType().getText();
      const typeLower = type.toLowerCase();
      if (typeLower.includes('controller')) return 'controllers';
      if (typeLower.includes('service')) return 'services';
      if (typeLower.includes('repository') || typeLower.includes('repo')) return 'repositories';
      if (typeLower.includes('model') || typeLower.includes('entity')) return 'models';
      if (typeLower.includes('middleware')) return 'middleware';
      if (typeLower.includes('config') || typeLower.includes('configuration')) return 'config';
      if (typeLower.includes('route')) return 'routes';
    }
  }
}

// Check 4: File name patterns (if nothing else matched)
const fileName = filePath.split('/').pop()?.toLowerCase() || '';
if (fileName.includes('.route')) return 'routes';
if (fileName.includes('.controller')) return 'controllers';
if (fileName.includes('.service')) return 'services';
if (fileName.includes('.repository') || fileName.includes('.repo')) return 'repositories';
if (fileName.includes('.model') || fileName.includes('.entity')) return 'models';
if (fileName.includes('.middleware')) return 'middleware';
if (fileName.includes('.config') || fileName.includes('.configuration')) return 'config';
if (fileName.includes('.test') || fileName.includes('.spec')) return 'tests';
if (fileName.includes('.util')) return 'utils';

// Check 5: Import patterns
const importDeclarations = sourceFile.getImportDeclarations();
for (const importDecl of importDeclarations) {
  const moduleSpecifier = importDecl.getModuleSpecifierValue().toLowerCase();

  // If importing from a framework's controller module
  if (moduleSpecifier.includes('@nestjs') || moduleSpecifier.includes('@angular') || moduleSpecifier.includes('controller')) {
    // Check what's being imported
    const importElements = importDecl.getNamedImports();
    for (const element of importElements) {
      const name = element.getName().toLowerCase();
      if (name.includes('controller')) return 'controllers';
      if (name.includes('service')) return 'services';
      if (name.includes('repository') || name.includes('repo')) return 'repositories';
      if (name.includes('model') || name.includes('entity')) return 'models';
      if (name.includes('middleware')) return 'middleware';
      if (name.includes('config') || name.includes('configuration')) return 'config';
    }
  }
}

return null; // Unable to classify with AST

    } catch (error) {
  // Any error in AST parsing should be silently handled, fallback to regex
  return null;
}
  }

  /**
   * Get or create a ts-morph project instance
   * Uses cache to improve performance across multiple file analyses
   */
  private static getOrCreateProject(): Project {
  const cacheKey = 'default';

  if (!LayerDetectorService.projectCache.has(cacheKey)) {
    const project = new Project({
      tsConfigFilePath: undefined, // Don't use tsconfig
      useInMemoryFileSystem: true, // Use in-memory FS for performance
      skipFileDependencyResolution: true, // Skip resolution for speed
      compilerOptions: {
        allowJs: true,
        allowImportingTsExtensions: true,
        allowNonTsExtensions: true,
        noLib: true,
        skipLibCheck: true,
      }
    });
    LayerDetectorService.projectCache.set(cacheKey, project);
  }

  return LayerDetectorService.projectCache.get(cacheKey)!;
}

  /**
   * Clear the project cache (useful for testing or memory management)
   */
  static clearCache(): void {
  LayerDetectorService.projectCache.clear();
}
}