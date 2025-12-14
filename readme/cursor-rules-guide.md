# Understanding and Using Cursor Rules

Welcome to the Cursor Rules guide! This document is your roadmap to understanding and effectively using the `.cursor/rules/` system in our codebase. These rules help maintain consistency, share best practices, and guide both human developers and AI assistants.

## What Are Cursor Rules?
Cursor Rules are markdown files (`.mdc`) located in the `.cursor/rules/` directory. They define:
- Coding standards and architectural principles.
- Framework-specific conventions and best practices.
- UI/UX guidelines.
- Steps for one-time operations (e.g., refactoring, documentation).
- Infrastructure and deployment configurations.

By following and contributing to these rules, we ensure a more maintainable, scalable, and understandable codebase for everyone.

---

## Navigating the Rules: A Quick Guide

Below is a summary of each rule category and the individual rules within them. Use this to quickly find the guidance you need.

### **`01. Core Rules`** (Foundation - Apply to Everything)

| Rule Filename                      | Purpose/When to Consult                                                                                                |
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **`01.core-rules.mdc`**            | Fundamental programming principles (SRP, separation of concerns, module size). *Consult for any language/framework.* |
| **`01.error-handling-rule.mdc`**   | How to handle and log errors consistently (e.g., Application Insights). *Essential for all error handling.*          |
| **`01.database-rule.mdc`**         | Standards for database interactions (e.g., Prisma usage, migrations). *Relevant for database layer work.*             |
| **`01.security-rule.mdc`**         | Best practices for security (e.g., NextAuth.js, env vars for secrets). *Crucial for auth & sensitive data.*        |
| **`01.ai-prompting-rule.mdc`**     | Guidelines for AI services and prompt management. *Use when integrating/updating AI features.*                       |

### **`02. Framework-Specific Rules`** (For Our Tech Stack)

| Rule Filename                         | Purpose/When to Consult                                                                                                    |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **`02.js-ts-rule.mdc`**               | General JavaScript/TypeScript best practices (variables, hooks, components). *Apply to all JS/TS code.*                   |
| **`02.next-js-rule.mdc`**             | Conventions specific to Next.js (server actions, route params, shadcn-ui). *Your go-to for Next.js development.*           |
| **`02.state-management-rule.mdc`**    | Philosophy for state management (local state vs. Zustand). *Guides design for state logic in components/stores.*         |

### **`03. UI/UX Rules`** (User Interface and Experience)

| Rule Filename                      | Purpose/When to Consult                                                                                             |
| :--------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| **`03.style-guide.mdc`**           | Styling conventions (color schemes, TailwindCSS). *For all UI development and styling tasks.*                       |
| **`03.multi-lingual-rule.mdc`**    | How to implement and organize multi-lingual translations (`next-intl`). *Key for internationalization efforts.*     |

### **`98. One-Time Operations & Guides`** (Specific Tasks and Knowledge)

| Rule Filename                             | Purpose/When to Consult                                                                                                |
| :---------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **`98.rules-authoring-guide.mdc`**        | How to create, structure, and update Cursor Rules. *Consult before adding or modifying any rule.*                   |
| **`98.func-create-readme.mdc`**           | Template and guidelines for documenting functions with a README. *Use after creating/refactoring a function.*        |
| **`98.func-split-large-files.mdc`**       | Process for breaking down large, monolithic files. *For one-time refactoring of "god files."*                        |
| **`98.func-troubleshoot.mdc`**            | Collection of common issues and solutions (e.g., Next.js 15 async route params). *Check here first for errors.*      |

### **`99. Program Execution & Infrastructure`** (Scripts, Commands, Deployment)

| Rule Filename                               | Purpose/When to Consult                                                                                                 |
| :------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------- |
| **`99.library-and-command-choices.mdc`**    | General preferences for libraries, commands, and OS (e.g., prefer PowerShell). *For scripting & infra decisions.*     |
| **`99.docker-rule.mdc`**                    | Best practices for Docker (Dockerfiles, image building/tagging, CI/CD). *Essential for all Docker-related work.*        |
| **`99.azure-rule.mdc`**                     | Azure-specific deployment preferences (e.g., use Linux for Azure Web Apps). *Guides Azure deployment configurations.* |

---

## When to Reference Each Rule: Scenario Guide

| Scenario/Task                      | Relevant Rule(s)                                      |
| :--------------------------------- | :---------------------------------------------------- |
| General Coding & Architecture      | `01.core-rules.mdc`, `01.error-handling-rule.mdc`     |
| JavaScript/TypeScript Development  | `02.js-ts-rule.mdc`                                   |
| Next.js Specifics                  | `02.next-js-rule.mdc` (see also `02.js-ts-rule.mdc`)  |
| UI & Styling                       | `03.style-guide.mdc`, `03.multi-lingual-rule.mdc`     |
| Database Work                      | `01.database-rule.mdc`                                |
| Security Implementation            | `01.security-rule.mdc`                                |
| AI Feature Integration             | `01.ai-prompting-rule.mdc`                            |
| State Management Design            | `02.state-management-rule.mdc`                        |
| Creating/Updating Rules            | `98.rules-authoring-guide.mdc`                        |
| Documenting a New Function         | `98.func-create-readme.mdc`                           |
| Refactoring a Large File           | `98.func-split-large-files.mdc`                       |
| Troubleshooting Common Issues      | `98.func-troubleshoot.mdc`                            |
| Docker & CI/CD                     | `99.docker-rule.mdc`                                  |
| Azure Deployments                  | `99.azure-rule.mdc`                                   |
| Scripting & General Commands       | `99.library-and-command-choices.mdc`                  |

---

## Contributing & Maintaining Rules

-   **Referencing:** Use `[filename.mdc](mdc:filename.mdc)` to link to rules in other documents or code comments.
-   **Consistency:** Review existing rules for style before creating a new one.
-   **Evolution:** Update rules when processes, technologies, or best practices change. Add to the troubleshooting guide when you solve recurring problems.
-   **Onboarding:** Encourage all contributors to familiarize themselves with these rules and use them during code reviews.

This guide is a living document. Your contributions to keeping it clear and up-to-date are valuable!

## Additional Resources
- [98.func-create-readme.mdc](mdc:98.func-create-readme.mdc) — Function README documentation rule
- [98.troubleshooting-guide.mdc](mdc:98.troubleshooting-guide.mdc) — Troubleshooting common issues 