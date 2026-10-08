/**
 * Which technologies prove a skill, keyed by the skill's backend id. A skill
 * is shown as used in a role, or in a project, when that role's technologies
 * or programming tools, or that project's tags, name one of these, so every
 * link is backed by data. A skill named exactly as a technology or tool is
 * proven by that name; a broader one is mapped by hand to the technologies
 * that show it. A skill nothing supports has no entry, and is shown without
 * a link rather than with an invented one.
 */
export const skillEvidence: Readonly<Record<number, readonly string[]>> = {
  1: ["Python", "FastAPI", "Django"],
  2: ["PostgreSQL"],
  3: ["Docker"],
  // System engineering: services that talk over gRPC or a message queue.
  4: ["gRPC", "RabbitMQ", "Celery", "Golang"],
  // Generative AI: the roles and projects that name GenAI.
  5: ["GenAI"],
  6: ["Kubernetes"],
  7: ["CI", "CI/CD"],
  // Cloud engineering: the clouds the roles ran on.
  8: ["AWS", "OpenStack", "Google Cloud"],
  9: ["React"],
  // A tool rather than a technology: roles list it under programming tools.
  10: ["Claude Code"],
  // Likewise an editor, listed under a role's programming tools.
  11: ["Cursor"],
  12: ["Redis"],
};
