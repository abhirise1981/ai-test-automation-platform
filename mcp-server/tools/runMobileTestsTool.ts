/**
 * runMobileTestsTool.ts — MCP Tool: Execute Mobile Tests (Appium/WebdriverIO)
 */
import { execSync } from 'child_process';
import * as path from 'path';

export const runMobileTestsToolDefinition = {
  name: 'run_mobile_tests',
  description:
    'Executes native mobile tests using WebdriverIO + Appium on local emulator/simulator or BrowserStack/AWS cloud devices.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      suite: {
        type: 'string',
        enum: ['android', 'ios', 'all'],
        description: 'Mobile platform suite to run (default: all)',
      },
      target: {
        type: 'string',
        enum: ['local', 'browserstack', 'aws'],
        description: 'Execution target (default: local)',
      },
    },
  },
};

export async function executeRunMobileTests(args: {
  suite?: string;
  target?: string;
}): Promise<{ exitCode: number; output: string }> {
  const projectRoot = path.resolve(__dirname, '../..');
  const suite = args.suite || 'all';
  const target = args.target || 'local';
  const suiteFlag = suite !== 'all' ? `--suite ${suite}` : '';

  const command = `npx wdio run wdio.conf.ts ${suiteFlag}`.trim();

  try {
    const output = execSync(command, {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 600000,
      env: { ...process.env, MOBILE_TARGET: target },
    });
    return { exitCode: 0, output };
  } catch (error: unknown) {
    const execError = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: execError.status || 1,
      output: execError.stdout || execError.stderr || 'Unknown error',
    };
  }
}
