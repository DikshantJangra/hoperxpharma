/**
 * Dependency Resolver
 * Topological sort for scenario execution order
 */

import { Scenario, ScenarioTag, ExecutionMode } from '../types';

export class DependencyResolver {
    /**
     * Resolve execution order based on dependencies
     * Uses Kahn's algorithm for topological sort
     */
    static resolve(
        scenarios: Scenario[],
        filter?: {
            tags?: ScenarioTag[];
            features?: string[];
            scenarioIds?: string[];
            mode?: ExecutionMode;
        }
    ): Scenario[] {
        // 1. Filter scenarios first
        let filtered = scenarios;

        if (filter?.tags && filter.tags.length > 0) {
            filtered = filtered.filter(s =>
                s.tags.some(t => filter.tags!.includes(t))
            );
        }

        if (filter?.features && filter.features.length > 0) {
            filtered = filtered.filter(s =>
                s.validatesFeatures.some(f => filter.features!.includes(f))
            );
        }

        if (filter?.scenarioIds && filter.scenarioIds.length > 0) {
            filtered = filtered.filter(s => filter.scenarioIds!.includes(s.id));
        }

        if (filter?.mode) {
            filtered = filtered.filter(s => s.modes.includes(filter.mode!));
        }

        // 2. Build dependency graph
        const scenarioMap = new Map<string, Scenario>();
        filtered.forEach(s => scenarioMap.set(s.id, s));

        // Include dependencies that aren't in filtered set
        const allNeeded = new Set<string>();
        const addWithDeps = (id: string) => {
            if (allNeeded.has(id)) return;
            const scenario = scenarios.find(s => s.id === id);
            if (!scenario) return;
            allNeeded.add(id);
            scenario.dependsOn.forEach(depId => addWithDeps(depId));
        };

        filtered.forEach(s => addWithDeps(s.id));

        // Get all scenarios we need (including deps)
        const toExecute = scenarios.filter(s => allNeeded.has(s.id));

        // 3. Topological sort using Kahn's algorithm
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, string[]>();

        toExecute.forEach(s => {
            inDegree.set(s.id, 0);
            adjList.set(s.id, []);
        });

        toExecute.forEach(s => {
            s.dependsOn.forEach(depId => {
                if (adjList.has(depId)) {
                    adjList.get(depId)!.push(s.id);
                    inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
                }
            });
        });

        // Start with scenarios that have no dependencies
        const queue: string[] = [];
        inDegree.forEach((degree, id) => {
            if (degree === 0) queue.push(id);
        });

        const result: Scenario[] = [];

        while (queue.length > 0) {
            const id = queue.shift()!;
            const scenario = toExecute.find(s => s.id === id);
            if (scenario) result.push(scenario);

            adjList.get(id)?.forEach(neighborId => {
                inDegree.set(neighborId, (inDegree.get(neighborId) || 0) - 1);
                if (inDegree.get(neighborId) === 0) {
                    queue.push(neighborId);
                }
            });
        }

        // Check for cycles
        if (result.length !== toExecute.length) {
            const remaining = toExecute.filter(s => !result.includes(s)).map(s => s.id);
            throw new Error(`Circular dependency detected in scenarios: ${remaining.join(', ')}`);
        }

        return result;
    }

    /**
     * Get downstream scenarios (ones that depend on given scenario)
     */
    static getDownstream(scenarioId: string, scenarios: Scenario[]): string[] {
        const downstream: Set<string> = new Set();

        const findDownstream = (id: string) => {
            scenarios.forEach(s => {
                if (s.dependsOn.includes(id) && !downstream.has(s.id)) {
                    downstream.add(s.id);
                    findDownstream(s.id);
                }
            });
        };

        findDownstream(scenarioId);
        return Array.from(downstream);
    }
}
