# Software Project Principles

## Purpose
This document outlines the core principles and standards that guide decision-making and development across software projects using this context network template.

## Classification
- **Domain:** Core Concept
- **Stability:** Static
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### Core Values

These fundamental values drive the Software Project Context Network approach:

1. **Knowledge Preservation**
   Software development knowledge is a valuable asset that must be deliberately preserved. The context behind decisions is often more valuable than the decisions themselves.

2. **Separation of Concerns**
   Planning artifacts (why and how) should be clearly separated from implementation artifacts (what). This separation enables each domain to evolve at its appropriate pace.

3. **Cognitive Load Management**
   Information should be structured to minimize cognitive load for both human developers and AI agents, enabling faster comprehension and more effective collaboration.

4. **Temporal Awareness**
   Software knowledge has temporal dimensions that must be explicitly managed, documenting not just current state but evolution history.

5. **Multi-Perspective Documentation**
   Software systems must be understood from multiple viewpoints (user, developer, operator, architect) with explicit mappings between different mental models.

### Design Principles

These key principles guide design decisions in software projects:

1. **Clear Domain Boundaries**
   Maintain strict separation between the context network (planning, architecture, decisions) and the codebase (implementation).
   
   *Example:* Architecture diagrams, decision records, and design discussions belong in the context network, while source code, configuration files, and build scripts belong in the project structure.

2. **Progressive Disclosure**
   Structure information to allow incremental exploration from high-level concepts to detailed implementations.
   
   *Example:* Start with system overview, then component maps, then specific component documentation, and finally implementation details.

3. **Bidirectional Traceability**
   Maintain clear connections between requirements, decisions, designs, and implementations.
   
   *Example:* Link architecture decisions to the components they affect, and link components back to the decisions that shaped them.

4. **Living Documentation**
   Documentation must evolve with the code or become actively harmful.
   
   *Example:* Establish clear triggers for documentation updates linked to code changes, and implement "documentation debt" tracking.

5. **Explicit Relationships**
   Make relationships between information nodes explicit and navigable.
   
   *Example:* Use standardized relationship types (depends-on, implements, extends) to connect related information.

### Standards and Guidelines

These standards and guidelines apply to software projects using this context network:

#### Quality Standards

- All architecture decisions must be documented with context, consequences, and alternatives
- Component documentation must include purpose, responsibilities, interfaces, and dependencies
- Process documentation must include triggers, steps, outcomes, and common issues
- Technical debt must be explicitly documented with impact assessment and remediation plans

#### Structural Standards

- Context network structure must follow the established hierarchy with appropriate index files
- Information nodes must include classification, relationships, and metadata
- Navigation paths must be maintained for different roles and tasks
- File sizes should be limited to fit within reasonable reading sessions and LLM context windows

#### Safety and Security Standards

- Security architecture must be explicitly documented
- Security decisions must include threat models and risk assessments
- Security-sensitive information must be appropriately protected
- Security considerations must be traceable through the context network

#### Performance and Efficiency Standards

- Performance requirements must be explicitly documented
- Performance-critical components must be identified
- Performance trade-offs must be documented with rationale
- Performance testing approaches must be described

### Process Principles

These principles guide development and operational processes:

1. **Code-Documentation Synchronization**
   Establish mechanisms to keep documentation in sync with code changes, including automated checks and manual reviews.

2. **Knowledge Gardening**
   Regularly maintain and refactor the context network to keep it relevant and useful, with scheduled sessions for updates.

3. **Feedback Loops**
   Create explicit feedback loops between implementation experiences and planning artifacts to capture learning.

4. **Incremental Improvement**
   Start with essential documentation and improve incrementally rather than aiming for perfect documentation.

5. **Collaborative Maintenance**
   Make context network maintenance a team responsibility, not assigned to a single individual.

### Decision-Making Framework

The framework for making decisions in software projects:

#### Decision Criteria

- Alignment with project goals and constraints
- Technical feasibility and sustainability
- Impact on system quality attributes (performance, security, maintainability)
- Team capabilities and familiarity
- Long-term maintenance considerations
- Integration with existing systems

#### Trade-off Considerations

- Speed vs. Quality
- Simplicity vs. Flexibility
- Immediate needs vs. Future extensibility
- Development effort vs. Operational complexity
- Standardization vs. Optimization

### Principle Application

How these principles should be applied in practice:

#### When Principles Conflict

When principles conflict, prioritize based on:
1. Knowledge preservation (avoid irreversible loss of critical information)
2. User/customer impact (prioritize principles that most directly affect end users)
3. Team effectiveness (consider what enables the team to work most effectively)
4. Project constraints (acknowledge practical limitations of time, budget, and resources)

#### Exceptions to Principles

Exceptions may be considered under these circumstances:
- Emergency situations requiring immediate action
- Exploratory prototyping phases (with the understanding that proper documentation will follow)
- Legacy system integration with incompatible documentation approaches
- When the cost of full documentation clearly exceeds the benefit for trivial components

## Relationships
- **Parent Nodes:** [foundation/project_definition.md]
- **Child Nodes:** None
- **Related Nodes:** 
  - [foundation/structure.md] - implements - Project structure implements these principles
  - [processes/creation.md] - guided-by - Creation processes follow these principles
  - [decisions/*] - evaluated-against - Decisions are evaluated against these principles

## Navigation Guidance
- **Access Context:** Use this document when making significant decisions or evaluating options
- **Common Next Steps:** After reviewing principles, typically explore structure.md or specific decision records
- **Related Tasks:** Decision-making, design reviews, code reviews, process definition
- **Update Patterns:** This document should be updated rarely, only when fundamental principles change

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Role/Agent]

## Change History
- [Date]: Initial creation of principles template
