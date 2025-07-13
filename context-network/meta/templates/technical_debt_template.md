# Technical Debt: [IDENTIFIER]: [SHORT TITLE]

## Purpose
This document records a known technical debt item, its impact, and remediation plan.

## Classification
- **Domain:** Evolution
- **Stability:** Dynamic
- **Abstraction:** [Conceptual/Structural/Detailed]
- **Confidence:** Established
- **Lifecycle Stage:** Active

## Content

### Summary
[Brief description of the technical debt item]

### Debt Type
[Type of technical debt: Code, Architecture, Documentation, Testing, Infrastructure, etc.]

### Location
[Where in the system this debt exists - components, modules, files, etc.]

### Origin
[How and why this debt was incurred]

#### Decision Context
[The circumstances under which this debt was taken on]

#### Justification
[Why taking on this debt was necessary or reasonable at the time]

#### Related Decisions
[Links to any ADRs or other decision documents that relate to this debt]

### Impact Assessment

#### Current Impact
[How this debt is currently affecting the system and team]

| Aspect | Severity | Description |
|--------|----------|-------------|
| Performance | [Low/Medium/High] | [Description] |
| Maintainability | [Low/Medium/High] | [Description] |
| Reliability | [Low/Medium/High] | [Description] |
| Security | [Low/Medium/High] | [Description] |
| Scalability | [Low/Medium/High] | [Description] |
| Developer Experience | [Low/Medium/High] | [Description] |

#### Growth Projection
[How the impact of this debt is expected to change over time]

#### Risk Assessment
[Risks associated with not addressing this debt]

### Remediation Plan

#### Proposed Solution
[Description of how this debt should be addressed]

#### Implementation Complexity
[Low/Medium/High] - [Explanation]

#### Required Resources
[Estimate of time, effort, and other resources needed]

#### Dependencies
[Any dependencies that must be resolved before remediation]

#### Verification Approach
[How to verify that the debt has been properly addressed]

### Prioritization

#### Business Value of Remediation
[Low/Medium/High] - [Explanation]

#### Technical Value of Remediation
[Low/Medium/High] - [Explanation]

#### Suggested Timeframe
[When this debt should be addressed: Immediate, Short-term, Medium-term, Long-term]

#### Interim Mitigations
[Any temporary measures to reduce the impact until full remediation]

## Relationships
- **Parent Nodes:** [evolution/technical_debt_registry.md]
- **Child Nodes:** None
- **Related Nodes:** 
  - [Related component] - [affected-by] - [How this debt affects the component]
  - [Related decision] - [resulted-from] - [How this decision led to this debt]
  - [Related debt item] - [depends-on] - [Dependency relationship]

## Navigation Guidance
- **Access Context:** Use this document when planning refactoring work, evaluating system health, or understanding limitations in [affected area]
- **Common Next Steps:** After reviewing this debt item, typically explore the affected components or related decisions
- **Related Tasks:** Refactoring planning, system improvement initiatives, risk assessment
- **Update Patterns:** This document should be updated when the debt's impact changes, remediation progress is made, or new information becomes available

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Role/Agent]
- **Identified By:** [Who identified this debt]
- **Owners:** [Who is responsible for tracking/addressing this debt]

## Change History
- [Date]: [Change description]
