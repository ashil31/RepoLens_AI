/**
 * Reusable prompt templates for repository analysis.
 */

export const REPOSITORY_OVERVIEW_PROMPT = `
You are an expert software architect. Analyze the provided repository symbols and dependencies to generate a high-level overview.

RESOURCES:
- Repository Symbols: {{symbols}}
- Dependency Graph: {{dependencies}}
- Key File Summaries: {{fileSummaries}}

TASK:
1. Summarize the core purpose of this repository.
2. Identify the primary technology stack used.
3. List the top 3-5 most important modules/files and why they are critical.

Format the output in clean Markdown.
`

export const ARCHITECTURE_ANALYSIS_PROMPT = `
You are an expert software architect. Analyze the provided repository structure to explain its architecture.

RESOURCES:
- Repository Symbols: {{symbols}}
- Dependency Graph: {{dependencies}}

TASK:
1. Explain the overall architectural pattern (e.g., MVC, Layered, Clean Architecture, Microservices).
2. Describe how data flows through the system (e.g., API -> Controller -> Service -> DB).
3. Identify major components and their responsibilities.
4. Note any interesting design patterns or notable library usages.

Format the output in clean Markdown.
`
