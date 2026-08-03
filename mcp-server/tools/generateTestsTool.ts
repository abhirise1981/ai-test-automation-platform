/**
 * generateTestsTool.ts — MCP Tool: Generate Test Scripts
 */
import { GeneratorAgent } from '../../agents/generator/GeneratorAgent';

export const generateTestsToolDefinition = {
  name: 'generate_tests',
  description:
    'Reads a BRD markdown file and generates Playwright/Appium test scripts matching the framework coding style.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      brdPath: { type: 'string', description: 'Path to the BRD markdown file' },
      writeFiles: { type: 'boolean', description: 'Whether to write generated files to disk (default: true)' },
    },
    required: ['brdPath'],
  },
};

export async function executeGenerateTests(args: {
  brdPath: string;
  writeFiles?: boolean;
}): Promise<{ files: string[]; summary: string }> {
  const generator = new GeneratorAgent();
  const result = await generator.generateFromBrd(args.brdPath);

  if (args.writeFiles !== false) {
    const writtenPaths = await generator.writeGeneratedFiles(result);
    return { files: writtenPaths, summary: result.summary };
  }

  return { files: result.generatedFiles.map((f) => f.path), summary: result.summary };
}
