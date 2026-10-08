# MMW-COMPANY/2 — FACTORY CONTROL

Status: ACTIVE WORKSPACE
Effective: 2026-10-06

## Binding

This directory is governed by MMW FACTORY governance v1.2. The Factory rules are mandatory for every change made inside MMW-COMPANY/2 — WORKING.

Factory source: /MMW-FACTORY on this branch.
Frozen source baseline: Etalon 5, commit 989b8fbf429bbe3eaf04f59b20756519912590fa.

## Workspace law

1. Work only in MMW-COMPANY/2 — WORKING for active company build tasks.
2. MMW-COMPANY/1 — FROZEN is read-only and must not be modified by workspace work.
3. Production is not a testing environment; no deployment is performed from this workspace without explicit release approval.
4. Every task starts with PROTECT and a recorded checkpoint.
5. Every material change has declared scope, exclusions, acceptance criteria and rollback point.
6. Shared-system changes require cross-project impact review and regression.
7. Media is controlled by asset → project → placement → semantic purpose.
8. Web media is imported into the project/repository as a local asset before publication; runtime external image dependencies are prohibited.
9. Interactive behavior must be tested at runtime when it is part of the requirement.
10. Economics must be input-driven, traceable and explicitly conditional.
11. Public copy must remain commercially clean and free of internal Factory/development terminology.
12. Missing evidence is not a pass.
13. A blocking failed gate means NO RELEASE.

## Mandatory lifecycle

PROTECT → DIAGNOSE → SPECIFY → BUILD → STATIC QA → INTEGRITY QA → RUNTIME QA → COMMERCIAL QA → RELEASE → PRODUCTION VERIFY → LEARN

## Mandatory gates

G0 Scope → G1 Structure → G2 Content → G3 Media → G4 Interaction → G5 Economics → G6 Technical → G7 Commercial → G8 Production

## Change record minimum

Before build: outcome, scope, exclusions, affected systems/projects, applicable rules, acceptance criteria, rollback checkpoint.

After build: changed files, test evidence, regression evidence, residual risks, release decision.

## Current operating state

This workspace is prepared for construction. The controlled local-media import protocol is now binding for company and project media. Absence of application implementation is not treated as a QA pass; application-specific gates become applicable as the corresponding layer is built.
