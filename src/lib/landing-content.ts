export type Pillar = {
  id: "autonomy" | "interaction" | "governance"
  title: string
  summary: string
  description: string
}

export type Primitive = {
  name:
    | "boa"
    | "Operator"
    | "Agent"
    | "Skill"
    | "Protocol"
    | "Governance Boundary"
    | "Audit Trail"
  description: string
}

export type LifecycleStep = {
  step: string
  detail: string
}

export const heroContent = {
  badge: "Early Design-First Stage",
  headline: "Business as Agent",
  title: "A deployable business of agents.",
  description:
    "openboa is an open-source runtime where the business is the durable unit and agents are the evolvable workforce. Build continuity, shared memory, and governance from day one.",
  subline: "Anyone can own a business. Anyone can run one.",
}

export const pillars: Pillar[] = [
  {
    id: "autonomy",
    title: "Autonomy unlocks time",
    summary: "Direction over chores",
    description:
      "The business keeps moving without constant prompting. Routine work can be delegated so operators focus on priorities, not manual coordination loops.",
  },
  {
    id: "interaction",
    title: "Interaction unlocks leverage",
    summary: "Specialized collaboration",
    description:
      "A business of agents can specialize and coordinate in parallel. Work scales through structured interaction instead of overloading one person or one agent.",
  },
  {
    id: "governance",
    title: "Governance unlocks confidence",
    summary: "Delegate with control",
    description:
      "Policy, approvals, isolation, and auditability keep autonomy accountable. Trust is engineered through enforceable boundaries and visible execution history.",
  },
]

export const primitives: Primitive[] = [
  {
    name: "boa",
    description:
      "Durable business runtime identity with long-lived context and continuity.",
  },
  {
    name: "Operator",
    description:
      "Human governor setting goals, policies, and approval boundaries.",
  },
  {
    name: "Agent",
    description:
      "Evolvable worker entity for scoped responsibilities and execution.",
  },
  {
    name: "Skill",
    description:
      "Reusable operational playbook that standardizes how work gets done.",
  },
  {
    name: "Protocol",
    description:
      "Structured coordination contract for assign, report, approve, and escalate.",
  },
  {
    name: "Governance Boundary",
    description:
      "Enforceable limits for safety, permissions, and risk-aware autonomy.",
  },
  {
    name: "Audit Trail",
    description: "Verifiable records of actions and decisions for accountability.",
  },
]

export const operatingLoop: LifecycleStep[] = [
  {
    step: "Observe",
    detail: "Track business state and identify emerging needs.",
  },
  {
    step: "Plan",
    detail: "Translate context into prioritized goals and actions.",
  },
  {
    step: "Assign",
    detail: "Delegate work to the right agents and skill contracts.",
  },
  {
    step: "Execute",
    detail: "Run scoped tasks with policy and isolation controls.",
  },
  {
    step: "Report",
    detail: "Return outcomes, evidence, and status transparently.",
  },
  {
    step: "Review",
    detail: "Evaluate results, adjust strategy, evolve the workforce.",
  },
]

export const currentStage = {
  title: "Current stage",
  description:
    "openboa is currently early stage and design-first. The focus is to define core primitives, governance boundaries, and observable execution contracts before scaling runtime complexity.",
  nonGoals: [
    "Not a fully autonomous, no-operator system.",
    "Not a generic chatbot framework.",
    "Not production-scale orchestration yet.",
  ],
}
