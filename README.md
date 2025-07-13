# Node-TypeScript Context Network Template
This project is a starter template specifically designed for Node.js TypeScript projects with built-in LLM management and navigation capabilities (more info at https://jwynia.github.io/context-networks/). It provides a structured approach to managing the complex web of decisions, designs, and domain knowledge that underlies Node-TypeScript development.

Unlike generic context networks, this template is tailored to address the unique knowledge management challenges of Node-TypeScript development: rapid ecosystem evolution, framework selection decisions, TypeScript configuration complexity, build tool choices, and the gap between "how we architected it" and "what we built" creates dangerous knowledge silos in the fast-moving Node.js ecosystem.

## Project Structure

This template uses a clear separation between planning and implementation:

```
project-root/
├── .context-network.md          # Discovery file
├── README.md                    # This file
├── .gitignore                   # Root-level git ignores
├── .devcontainer/               # Development container config
├── context-network/             # All planning & architecture docs
└── app/                         # Your Node-TypeScript project goes here
```

The `app/` directory is where your actual Node.js TypeScript project will live - everything that would normally be in a Node project root. This keeps the context network and development tooling separate from your application code.

## Getting Started

To use this Node-TypeScript context network template:

1. **Clone this template** for your new Node-TypeScript project
2. **Connect with an LLM agent** that has file access to all files in the project folder (via IDE coding tools like Cursor or VSCode with Cline)
3. **Set up the prompts** (see below) to ensure the agent understands context networks
4. **Initialize your Node project** in the `app/` directory using your preferred method:
   - `cd app && npm init` for a basic Node project
   - `cd app && npx create-next-app@latest .` for Next.js
   - `cd app && npx create-vite@latest . --template vanilla-ts` for Vite
   - Or any other Node-TypeScript framework initialization
5. **Start a planning conversation** describing your Node-TypeScript project goals, architecture, and constraints
6. **Let the agent enhance the context network** with your project-specific information
7. **Begin development tasks** with clear separation between planning (context network) and implementation (app/)

This template maintains a clear boundary between knowledge artifacts (context network) and implementation artifacts (app/), allowing your team to document "why" and "how" separately from the Node-TypeScript code that represents "what is."

## Cost
Because context networks are a relatively cutting-edge approach to collaboration with LLM AI agents, these tools do cost money and some of the best of them can cost more money than you may be expecting. The costs on such things are dropping and much of what we're doing with context networks is figuring out the ways to work that will be more widespread next year and beyond, when these costs drop. If these tools are too expensive for your budget, that probably means you need to wait a bit.

## Tools
Cursor (https://www.cursor.com/) is an all-in-one that comes with LLM chat and an agent that can act on the files.

Cursor is built on VSCode (https://code.visualstudio.com/), which is a more generic code/text editor that can have plugins added. One we use a lot with context networks is Cline (https://cline.bot/). Cline's agent can be pointed at a wide range of LLM APIs that you use your own keys/billing for or their own management of that. A popular solution is to use OpenRouter (https://openrouter.ai/) which lets you use most of the LLM models available today.

## Patterns
### Prompts
For whatever agent you use, you need to include instructions in the system prompt or custom instructions that tell it about context networks and how to navigate them. The prompt in /inbox/custom-instructions-prompt.md is the one a lot of people are using for Cline with Claude Sonnet as the model.

Add it in either your agent's configuration screen or via its file-based prompt management system.

### Node-TypeScript Specific Documentation Patterns
This template includes specialized patterns for Node-TypeScript documentation:

1. **Framework Selection Decision Records** - Document Node.js framework choices (Express vs Fastify vs Next.js)
2. **TypeScript Configuration Decisions** - Document compiler settings, strict mode choices, and type strategy
3. **API Design Guidelines** - Node.js specific REST/GraphQL API patterns with TypeScript interfaces
4. **Package Management Strategy** - Document npm/yarn/pnpm choices and dependency management
5. **Build Tool Configuration** - Document bundling, compilation, and deployment strategies
6. **Testing Strategy** - Jest/Vitest configuration and Node.js testing patterns
7. **Technical Debt Registry** - Track Node.js ecosystem updates and TypeScript migration needs

### Plan/Act and Specific Scope
Cline and many other agents have multiple modes, usually offering one that lets you have a conversation with it separate from it taking action on files. In Cline, that's "Plan". In that mode, it won't make any changes to your files.

Use that mode aggressively to get to a specific plan for what will happen when you toggle to act. That plan should have a clear definition of what "done" will look like, should be as close to a single action as possible.

That often means that the action is to detail out a list of tasks that you'll actually have the agent do separately, one at a time. The "do one thing" can mean break the existing scope down another level to get to a more detailed plan. 

Basically, the more specific the action that Act mode or its equivalent is given, the better job it will do at managing token budget, at not volunteering to do a bunch of extra things,  and the more likely it does something you've already had a chance to approve.

### Monitor and Interrupt
The more you actually read and monitor what your agent is doing for anything that you disagree with or sounds incorrect and step in to interrupt, the better your context network will mature. Like hiring a new assistant, where for the first few weeks, you have to tell them your preferences and ways you want things done, it pays off over the long haul.

Interrupt, flip to Plan mode, and ask things like:

* How can we document into the context network a way of working so we don't repeat (the problem/misunderstanding above)?
* I'd really prefer we always write out a plan with tasks before doing things ad hoc. How can we clarify what's in the context network to make that our process going forward?


### Retrospective
At the end of tasks and periodically AS a new task, ask how things could be improved. For task end, "What from this conversation and task should be documented in the context network?" For periodic retrospectives, "What have we learned in this project that could be used to improve the context network for our efforts going forward?"

## Node-TypeScript Project Success Metrics

This context network template helps measure success through:

- **Time to first meaningful contribution** for new Node.js developers
- **Framework selection decision speed** and confidence
- **TypeScript configuration consistency** across team members
- **Frequency of "archaeology" requests** (digging for lost Node.js knowledge)
- **Documentation coverage** of APIs, components, and TypeScript interfaces
- **Decision traceability** for framework and tooling choices
- **Documentation update frequency** relative to package.json and code changes
- **Developer confidence** in making Node.js ecosystem updates
- **Stakeholder understanding** of system architecture and technology choices
- **Reduction in repeated Node.js/TypeScript configuration mistakes**
- **Package dependency management** clarity and security
- **Build and deployment process** understanding and reliability

By maintaining a well-structured context network alongside your Node-TypeScript codebase, your team builds a shared brain that enables faster onboarding, better technology decisions, and more confident evolution of complex Node.js applications in the rapidly changing ecosystem.
