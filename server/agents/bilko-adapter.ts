/**
 * Bilko-flow adapter.
 *
 * Wraps bilko-flow's MemoryStore, WorkflowExecutor, and EventPublisher
 * to handle the fact that bilko-flow ships as TypeScript source (no dist).
 * We import from the installed package source at runtime.
 */

// Runtime-resolved bilko-flow components
let bilkoStore: any = null;
let bilkoExecutor: any = null;
let bilkoPublisher: any = null;
let initialized = false;

/**
 * Initialize bilko-flow components.
 * Uses dynamic import paths resolved at runtime.
 */
export async function initBilko() {
  if (initialized) return;
  try {
    // Use variable paths so TypeScript doesn't resolve the .ts source modules
    const storePath = "bilko-flow/src/storage/memory-store";
    const executorPath = "bilko-flow/src/engine/executor";
    const publisherPath = "bilko-flow/src/data-plane/publisher";

    const storeMod: any = await import(/* @vite-ignore */ storePath);
    const executorMod: any = await import(/* @vite-ignore */ executorPath);
    const publisherMod: any = await import(/* @vite-ignore */ publisherPath);

    const MemoryStore = storeMod.MemoryStore || storeMod.default;
    const WorkflowExecutor = executorMod.WorkflowExecutor || executorMod.default;
    const EventPublisher = publisherMod.EventPublisher || publisherMod.default;

    bilkoStore = new MemoryStore();
    bilkoPublisher = new EventPublisher();
    bilkoExecutor = new WorkflowExecutor(bilkoStore, bilkoPublisher, {
      generateAttestations: false,
    });

    initialized = true;
    console.log("[bilko-flow] Engine initialized successfully");
  } catch (err) {
    console.warn("[bilko-flow] Could not initialize bilko-flow engine, using local fallbacks:", (err as Error).message);
    // Platform still works — agent engine uses local knowledge base as fallback
    initialized = false;
  }
}

export function getStore() { return bilkoStore; }
export function getExecutor() { return bilkoExecutor; }
export function isInitialized() { return initialized; }

/**
 * Execute a workflow run through bilko-flow.
 * Returns null if bilko-flow is not available (graceful degradation).
 */
export async function executeWorkflow(
  workflowDef: any,
  inputs: Record<string, unknown>,
): Promise<any | null> {
  if (!initialized || !bilkoStore || !bilkoExecutor) return null;

  const scope = {
    accountId: workflowDef.accountId,
    projectId: workflowDef.projectId,
    environmentId: workflowDef.environmentId,
  };

  try {
    await bilkoStore.workflows.create(workflowDef);

    const run = await bilkoExecutor.createRun({
      workflowId: workflowDef.id,
      accountId: scope.accountId,
      projectId: scope.projectId,
      environmentId: scope.environmentId,
      inputs,
    });

    await bilkoExecutor.executeRun(run.id, scope);
    const completedRun = await bilkoStore.runs.getById(run.id, scope);
    return completedRun;
  } catch (err) {
    console.warn("[bilko-flow] Workflow execution failed, using fallback:", (err as Error).message);
    return null;
  }
}
