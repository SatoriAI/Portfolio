/**
 * Which technologies prove a skill, keyed by the skill's backend id. A skill
 * is shown as used in a role, or in a project, when that role's technologies
 * or that project's tags name one of these, so every link is backed by data. Four skills are
 * named exactly as a technology; the broader four are mapped by hand to the
 * technologies that show them. A skill no role's technologies support has no
 * entry, and is shown without a link rather than with an invented one.
 */
export const skillEvidence: Readonly<Record<number, readonly string[]>> = {
  1: ["Python", "FastAPI", "Django"],
  2: ["PostgreSQL"],
  3: ["Docker"],
  // System engineering: services that talk over gRPC or a message queue.
  4: ["gRPC", "RabbitMQ", "Celery", "Golang"],
  // Generative AI: no role lists it; the projects tagged GenAI do.
  5: ["GenAI"],
  // 7, CI/CD: nothing names it yet.
  6: ["Kubernetes"],
  // Cloud engineering: the clouds the roles ran on.
  8: ["AWS", "OpenStack", "Google Cloud"],
  9: ["React"],
};
