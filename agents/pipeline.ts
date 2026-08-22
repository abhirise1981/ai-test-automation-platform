/**
 * pipeline.ts — End-to-End Multi-Agent Pipeline Orchestrator
 *
 * Orchestrates the full flow: Jira → Planner → Generator → Execute → Heal
 *
 * Usage:
 *   npx ts-node agents/pipeline.ts --issue PROJ-123
 *   npx ts-node agents/pipeline.ts --issue PROJ-123 --dry-run
 *   npx ts-node agents/pipeline.ts --issue PROJ-123 --target browserstack
 */
import 'dotenv/config';
import { JiraClient } from './jira/JiraClient';
import { StoryParser } from './jira/StoryParser';
import { PlannerAgent } from './planner/PlannerAgent';
import { executeGenerateBrd } from '../mcp-server/tools/generateBrdTool';
import { GeneratorAgent } from './generator/GeneratorAgent';
import { HealerAgent } from './healer/HealerAgent';

// ─── CLI Argument Parsing ──────────────────────────────────────────────────

interface PipelineArgs {
  issueKey: string;
  target: 'local' | 'browserstack' | 'mobile-web' | 'aws';
  dryRun: boolean;
}

function parseArgs(): PipelineArgs {
  const args = process.argv.slice(2);
  const issueIdx = args.indexOf('--issue');
  const targetIdx = args.indexOf('--target');

  return {
    issueKey: issueIdx !== -1 ? args[issueIdx + 1] : '',
    target: (targetIdx !== -1 ? args[targetIdx + 1] : 'local') as PipelineArgs['target'],
    dryRun: args.includes('--dry-run'),
  };
}

// ─── Pipeline ──────────────────────────────────────────────────────────────

async function runPipeline() {
  const args = parseArgs();

  if (!args.issueKey) {
    console.error('Usage: npx ts-node agents/pipeline.ts --issue PROJ-123 [--target local|browserstack] [--dry-run]');
    process.exit(1);
  }

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🤖 AI Multi-Agent Test Automation Pipeline            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  try {
    // ── Step 1: Jira Agent ─────────────────────────────────────────────
    console.log('━━━ Step 1/5: Jira Agent — Fetching Story ━━━');
    const jiraClient = new JiraClient();
    const parser = new StoryParser();
    const rawIssue = await jiraClient.getStory(args.issueKey);
    const story = parser.parse(rawIssue);
    console.log(`  Key:      ${story.key}`);
    console.log(`  Summary:  ${story.summary}`);
    console.log(`  Platform: ${story.platform}`);
    console.log(`  Priority: ${story.priority}`);
    console.log(`  ACs:      ${story.acceptanceCriteria.length} items`);
    console.log('');

    // ── Step 2: Planner Agent & MCP Tool ───────────────────────────────
    console.log('━━━ Step 2/5: Planner Agent & MCP Tool — Generating BRD ━━━');
    
    // The Brain thinks in memory
    const planner = new PlannerAgent();
    const { markdown, issueKey } = await planner.generateBrd(story);
    
    // The Hands (MCP) write to disk
    const { brdPath } = await executeGenerateBrd({ issueKey, markdown });
    
    console.log(`  BRD:      ${brdPath}`);
    console.log('');

    // ── Step 3: Generator Agent ────────────────────────────────────────
    console.log('━━━ Step 3/5: Generator Agent — Creating Test Scripts ━━━');
    const generator = new GeneratorAgent();
    const generationResult = await generator.generateFromBrd(brdPath);

    if (!args.dryRun) {
      const writtenFiles = await generator.writeGeneratedFiles(generationResult);
      console.log(`  Files:    ${writtenFiles.length} generated`);
      for (const f of writtenFiles) {
        console.log(`            → ${f}`);
      }
    } else {
      console.log(`  [DRY RUN] Would generate ${generationResult.generatedFiles.length} files`);
    }
    console.log('');

    // ── Step 4: Test Execution ─────────────────────────────────────────
    if (!args.dryRun) {
      console.log(`━━━ Step 4/5: Test Execution — Target: ${args.target} ━━━`);
      const { execSync } = await import('child_process');
      const path = await import('path');
      const projectRoot = path.resolve(__dirname, '..');

      try {
        execSync(`npx playwright test`, {
          cwd: projectRoot,
          stdio: 'inherit',
          env: { ...process.env, EXECUTION_TARGET: args.target },
          timeout: 300000,
        });
        console.log('  ✅ All tests passed!');
      } catch {
        console.log('  ❌ Some tests failed — proceeding to Healer Agent');
      }
    } else {
      console.log('━━━ Step 4/5: [DRY RUN] Skipping test execution ━━━');
    }
    console.log('');

    // ── Step 5: Healer Agent ───────────────────────────────────────────
    if (!args.dryRun) {
      console.log('━━━ Step 5/5: Healer Agent — Analyzing Results ━━━');
      try {
        const healer = new HealerAgent();
        const healResult = await healer.healFromResults('test-results/results.json');
        console.log(`  Passed:   ${healResult.passed}/${healResult.totalTests}`);
        console.log(`  Failed:   ${healResult.failed}`);
        console.log(`  Healed:   ${healResult.healed}`);
        console.log(`  Review:   ${healResult.needsHumanReview}`);
        console.log(`  Report:   ${healResult.reportPath}`);
      } catch (error) {
        console.log('  ⚠️ No JSON results file found — skipping healing');
      }
    } else {
      console.log('━━━ Step 5/5: [DRY RUN] Skipping healer ━━━');
    }

    // ── Summary ────────────────────────────────────────────────────────
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  ✅ Pipeline complete in ${elapsed}s                          ║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

    // Update Jira status
    if (!args.dryRun) {
      try {
        await jiraClient.addComment(
          args.issueKey,
          `🤖 AI Pipeline executed. Tests generated and run. See attached report.`,
        );
      } catch {
        console.log('  ⚠️ Could not update Jira (check credentials)');
      }
    }
  } catch (error) {
    console.error('');
    console.error('❌ Pipeline failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runPipeline();
