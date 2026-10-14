"""Where on the site a question was asked, as the model reads it.

A button that asks Vex about a role or a project sends a reference to it with the question, `{"kind": "experience",
"id": 7}` or `{"kind": "project", "id": 3}`, never text. The reference is looked up here, among the rows Vex may read
(vex_queryset), and turned into one sentence of the site's own words: nothing the client wrote reaches the prompt.
A reference that names nothing Vex may read (an unknown kind, an id that is not there, a hidden role) is dropped,
and the question is answered without it."""

from collections.abc import Callable, Mapping

from work.models import Experience, Project

# The largest id a row can have (a BigAutoField): a larger one would fail the lookup rather than find nothing.
MAX_ID = 2**63 - 1


def experience_line(pk: int) -> str:
    experience = Experience.vex_queryset().filter(pk=pk).first()
    if experience is None:
        return ""
    role = experience.safe_translation_getter("role", language_code="en", any_language=True) or experience.position
    end = experience.end.year if experience.end is not None else "present"
    return (
        f'The visitor asked this from the role "{role} at {experience.company} ({experience.start.year}–{end})" '
        "on the Experience page (/experience)."
    )


def project_line(pk: int) -> str:
    project = Project.vex_queryset().filter(pk=pk).first()
    if project is None:
        return ""
    return (
        f'The visitor asked this from the project "{project.title}" in the Projects section of the home page '
        "(/#projects)."
    )


KINDS: dict[str, Callable[[int], str]] = {"experience": experience_line, "project": project_line}


def resolve_context(context: object) -> str:
    """The sentence that says where the question was asked, or "" when `context` names nothing Vex may read."""
    if not isinstance(context, Mapping) or set(context) != {"kind", "id"}:
        return ""
    kind, pk = context["kind"], context["id"]
    # A bool is an int to Python, but never an id.
    if not isinstance(kind, str) or kind not in KINDS or isinstance(pk, bool) or not isinstance(pk, int):
        return ""
    if not 0 < pk <= MAX_ID:
        return ""
    return KINDS[kind](pk)
