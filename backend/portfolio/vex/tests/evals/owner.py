"""Jan Testowy, the invented owner of the site the evals ask Vex about: a mathematician turned simulation engineer.

Everything here is made up, and plainly so: the people, companies, university, town (Testowo), journals and
addresses (example.com, example.org) do not exist, and none of it is true of Dawid. The evals run Vex's real rules
with this owner's name and address in place of Dawid's (conftest.py), so the golden set (golden.py) asks about him.

He has what the site's database holds for its owner, in both languages, through the real models: four roles (one
current, one hidden, which Vex must not see), skills, projects, two publications (one a preprint), two degrees and
his students' testimonials. Besides them, personal notes as an uploaded document would hold them, and the site's own
writing (two workshop pieces and a project's write-up) as the frontend's build would publish it for Vex."""

from datetime import date
from typing import Any

from parler.models import TranslatableModel

from university.choices import Degrees, Seasons
from university.models import Publication, School, Testimonial
from vex.models import Document
from work.choices import Icons
from work.models import Experience, Project, Skill

NAME = "Jan Testowy"
FIRST_NAME = "Jan"
EMAIL = "jan.testowy@example.com"

# Each language has the same facts, with two favourite dishes so a case can check that a recipe is given for the
# first.
PERSONAL_NOTES: dict[str, tuple[str, str]] = {
    "en": (
        "Personal notes",
        "Favourite dishes: first shakshuka, then pad thai.\n"
        "Sport: underwater hockey, twice a week.\n"
        "Favourite film: Paddington 2.\n"
        "Best trip so far: Svalbard, to see the polar night.",
    ),
    "pl": (
        "Notatki osobiste",
        "Ulubione dania: na pierwszym miejscu szakszuka, potem pad thai.\n"
        "Sport: hokej podwodny, dwa razy w tygodniu.\n"
        "Ulubiony film: Paddington 2.\n"
        "Najlepsza podróż do tej pory: Svalbard, żeby zobaczyć noc polarną.",
    ),
}

# The site's own writing, per language, as the frontend's bundle (/vex-kb/<locale>.json) holds it: each piece with its
# page, its title and its Markdown, header included.
SITE_BUNDLE: dict[str, list[dict[str, str]]] = {
    "en": [
        {
            "path": "/#projects",
            "title": "Thermoscope",
            "text": "---\ntitle: Thermoscope\n---\n"
            "Thermoscope started as a winter-break toy: draw any shape with your finger and watch heat spread through "
            "it. It solves the heat equation on the GPU with WebGL, so it keeps 60 frames a second even on a phone. "
            "Teachers at two secondary schools in Testowo use it to show why a spoon in hot tea warms from the bottom "
            "up.",
        },
        {
            "path": "/workshop/a-kettle-and-the-heat-equation",
            "title": "A kettle and the heat equation",
            "text": "---\ntitle: A kettle and the heat equation\n---\n"
            "Why does the water at the bottom of a kettle boil first? A walk through the heat equation with nothing "
            "but a kettle, an ice cube and a little calculus, and why the same equation decides how long a battery "
            "takes to cool.",
        },
        {
            "path": "/workshop/why-batteries-get-hot",
            "title": "Why a battery gets hot when it charges fast",
            "text": "---\ntitle: Why a battery gets hot when it charges fast\n---\n"
            "Fast charging pushes a large current through a cell's internal resistance, and that resistance turns "
            "part of the energy into heat. The piece shows, with a simple model, why doubling the current quadruples "
            "the heat, and how a pack's cooling plates keep the hottest cell under 45 °C.",
        },
    ],
    "pl": [
        {
            "path": "/#projects",
            "title": "Thermoscope",
            "text": "---\ntitle: Thermoscope\n---\n"
            "Thermoscope zaczął się jako zabawka na ferie: narysuj palcem dowolny kształt i patrz, jak rozchodzi się "
            "w nim ciepło. Rozwiązuje równanie ciepła na GPU w WebGL, więc nawet na telefonie trzyma 60 klatek na "
            "sekundę. Nauczyciele z dwóch liceów w Testowie pokazują nim, dlaczego łyżeczka w gorącej herbacie "
            "nagrzewa się od dołu.",
        },
        {
            "path": "/workshop/a-kettle-and-the-heat-equation",
            "title": "Czajnik i równanie ciepła",
            "text": "---\ntitle: Czajnik i równanie ciepła\n---\n"
            "Dlaczego woda na dnie czajnika wrze pierwsza? Spacer po równaniu ciepła z czajnikiem, kostką lodu i "
            "odrobiną analizy, i dlaczego to samo równanie decyduje, jak długo stygnie bateria.",
        },
        {
            "path": "/workshop/why-batteries-get-hot",
            "title": "Dlaczego bateria grzeje się przy szybkim ładowaniu",
            "text": "---\ntitle: Dlaczego bateria grzeje się przy szybkim ładowaniu\n---\n"
            "Szybkie ładowanie przepycha duży prąd przez opór wewnętrzny ogniwa, a ten zamienia część energii w "
            "ciepło. Artykuł pokazuje na prostym modelu, dlaczego dwa razy większy prąd daje cztery razy więcej ciepła "
            "i jak płyty chłodzące pakietu trzymają najgorętsze ogniwo poniżej 45 °C.",
        },
    ],
}


def create(model: type[TranslatableModel], en: dict[str, Any], pl: dict[str, Any], **fields: Any) -> None:
    """Saves a row with its translated fields in both languages."""
    row = model(**fields)
    for language, values in (("en", en), ("pl", pl)):
        row.set_current_language(language)
        for name, value in values.items():
            setattr(row, name, value)
    row.save()


def create_rows() -> None:
    """Fills the (empty) database with his site's rows and his personal notes."""
    roles()
    skills()
    projects()
    education()
    research()
    teaching()
    for language, (title, content) in PERSONAL_NOTES.items():
        Document.objects.create(title=title, content=content, language=language)


def roles() -> None:
    create(
        Experience,
        position="Thermal Simulation Engineer",
        company="Kelvinbrook",
        start=date(2023, 3, 1),
        technologies=["Python", "Rust", "JAX", "PostgreSQL"],
        tools=["Claude Code"],
        en={
            "role": "Thermal Simulation Engineer",
            "location": "Testowo (hybrid)",
            "product": "Thermarrow, a simulation service that predicts how hot each cell of an electric bus's battery "
            "pack gets during fast charging, so pack designers can place cooling plates before building a prototype.",
            "responsibilities": "Jan owns Thermarrow's finite-element solver: its numerics, its performance and its "
            "validation against lab measurements.",
            "contributions": [
                "Wrote an adaptive time-stepping scheme for the solver.",
                "Built a validation suite that compares every release with 40 lab measurements.",
            ],
            "results": [
                "An overnight simulation run went from 9 hours to 4.",
                "Predicted cell temperatures are within 1.5 °C of the lab's.",
            ],
            "vex_question": "What does Jan work on at Kelvinbrook?",
        },
        pl={
            "role": "Inżynier symulacji termicznych",
            "location": "Testowo (hybrydowo)",
            "product": "Thermarrow, usługa symulacyjna, która przewiduje, jak bardzo nagrzewa się każde ogniwo "
            "baterii autobusu elektrycznego przy szybkim ładowaniu, żeby projektanci mogli rozmieścić płyty "
            "chłodzące przed zbudowaniem prototypu.",
            "responsibilities": "Jan odpowiada za solver metody elementów skończonych w Thermarrow: jego numerykę, "
            "wydajność i walidację z pomiarami z laboratorium.",
            "contributions": [
                "Napisał adaptacyjny schemat kroku czasowego dla solvera.",
                "Zbudował zestaw walidacyjny, który porównuje każde wydanie z 40 pomiarami z laboratorium.",
            ],
            "results": [
                "Nocny przebieg symulacji skrócił się z 9 godzin do 4.",
                "Przewidywane temperatury ogniw różnią się od laboratoryjnych o mniej niż 1,5 °C.",
            ],
            "vex_question": "Nad czym Jan pracuje w Kelvinbrook?",
        },
    )
    create(
        Experience,
        position="Data Engineer",
        company="Gridwhistle",
        start=date(2020, 9, 1),
        end=date(2023, 2, 28),
        technologies=["Python", "Apache Airflow", "Kafka", "PostgreSQL"],
        en={
            "role": "Data Engineer",
            "location": "Remote",
            "product": "Voltwren, a platform that forecasts electricity demand for regional grid operators.",
            "responsibilities": "Jan built and ran the pipelines that bring smart-meter data into Voltwren.",
            "contributions": [
                "Built the ingestion pipeline for 1,200 smart-meter feeds in Apache Airflow.",
                "Introduced data-quality checks that stop a broken feed before it reaches the forecasts.",
            ],
            "results": [
                "The forecasts' error fell from 8% to 5%.",
                "Pipeline failures went from weekly to about once a quarter.",
            ],
        },
        pl={
            "role": "Inżynier danych",
            "location": "Zdalnie",
            "product": "Voltwren, system prognozujący zapotrzebowanie na prąd dla regionalnych operatorów sieci.",
            "responsibilities": "Jan budował i utrzymywał potoki, które wprowadzają dane z inteligentnych liczników "
            "do Voltwren.",
            "contributions": [
                "Zbudował w Apache Airflow potok pobierający dane z 1200 inteligentnych liczników.",
                "Wprowadził kontrole jakości danych, które zatrzymują zepsute źródło, zanim trafi do prognoz.",
            ],
            "results": [
                "Błąd prognoz spadł z 8% do 5%.",
                "Awarie potoków zdarzały się już nie co tydzień, a mniej więcej raz na kwartał.",
            ],
        },
    )
    create(
        Experience,
        position="Teaching Assistant",
        company="University of Testowo",
        start=date(2018, 10, 1),
        end=date(2020, 6, 30),
        topics=["Numerical analysis", "Linear algebra"],
        en={
            "role": "Teaching Assistant",
            "location": "Testowo",
            "responsibilities": "Jan ran the exercise classes in numerical analysis and linear algebra for "
            "second-year students.",
        },
        pl={
            "role": "Asystent dydaktyczny",
            "location": "Testowo",
            "responsibilities": "Jan prowadził ćwiczenia z analizy numerycznej i algebry liniowej dla studentów "
            "drugiego roku.",
        },
    )
    # Hidden: kept in the database, but neither the site nor Vex shows it.
    create(
        Experience,
        position="Game Tester",
        company="Moonquay Games",
        start=date(2016, 7, 1),
        end=date(2017, 6, 30),
        visible=False,
        en={"role": "Game Tester", "location": "Testowo", "responsibilities": "Tested puzzle games for phones."},
        pl={"role": "Tester gier", "location": "Testowo", "responsibilities": "Testował gry logiczne na telefony."},
    )


def skills() -> None:
    # (icon, used since, English name and description, Polish name and description)
    for icon, since, en, pl in (
        (Icons.CODE, 2014, ("Python", "His main language"), ("Python", "Jego główny język")),
        (Icons.CODE, None, ("Rust", "For the solver's hot loops"), ("Rust", "Do najgorętszych pętli solvera")),
        (Icons.BRAIN, None, ("JAX", "Simulation on the GPU"), ("JAX", "Symulacje na GPU")),
        (
            Icons.SPARKLES,
            2016,
            ("Finite element method", "Since his studies"),
            ("Metoda elementów skończonych", "Od studiów"),
        ),
        (Icons.BOXES, None, ("Apache Airflow", "Data pipelines"), ("Apache Airflow", "Potoki danych")),
        (Icons.DATABASE, None, ("PostgreSQL", "Measurements and results"), ("PostgreSQL", "Pomiary i wyniki")),
        (Icons.CONTAINER, None, ("Docker", "The solver on the cluster"), ("Docker", "Solver na klastrze")),
        (Icons.CLOUD, None, ("WebGL", "Simulations in the browser"), ("WebGL", "Symulacje w przeglądarce")),
    ):
        create(
            Skill,
            icon=icon,
            since=since,
            en={"name": en[0], "description": en[1]},
            pl={"name": pl[0], "description": pl[1]},
        )


def projects() -> None:
    create(
        Project,
        title="Thermoscope",
        tags=["TypeScript", "WebGL", "Numerical methods"],
        demo="https://thermoscope.example.com",
        repository="https://example.org/jan-testowy/thermoscope",
        en={
            "description": "A browser toy that animates the heat equation on any shape you draw.",
            "vex_question": "How does Thermoscope work?",
        },
        pl={
            "description": "Zabawka w przeglądarce, która animuje równanie ciepła na dowolnym narysowanym kształcie.",
            "vex_question": "Jak działa Thermoscope?",
        },
    )
    create(
        Project,
        title="Ledgerlark",
        tags=["React Native", "TypeScript", "SQLite"],
        demo="https://ledgerlark.example.com",
        mobile=True,
        en={"description": "A phone app that reads bank statements as CSV and splits shared costs between flatmates."},
        pl={
            "description": "Aplikacja na telefon, która czyta wyciągi bankowe w CSV i dzieli wspólne koszty między "
            "współlokatorów."
        },
    )
    create(
        Project,
        title="Tidebell",
        tags=["Python", "Telegram"],
        repository="https://example.org/jan-testowy/tidebell",
        en={
            "description": "A Telegram bot that tells sea swimmers when the tide and the water temperature suit a swim."
        },
        pl={
            "description": "Bot na Telegramie, który podpowiada morsom i pływakom, kiedy pływ i temperatura wody "
            "sprzyjają kąpieli."
        },
    )
    create(
        Project,
        title="Cluequill",
        tags=["Python", "Django"],
        demo="https://cluequill.example.com",
        repository="https://example.org/jan-testowy/cluequill",
        en={"description": "A crossword generator for teachers: type in the words of a lesson, print the puzzle."},
        pl={"description": "Generator krzyżówek dla nauczycieli: wpisz słowa z lekcji i wydrukuj krzyżówkę."},
    )


def education() -> None:
    create(
        School,
        degree=Degrees.MASTER,
        start=date(2017, 10, 1),
        end=date(2019, 7, 15),
        en={
            "study": "Applied Mathematics",
            "university": "University of Testowo",
            "research": "Thesis: fast solvers for the heat equation in composite materials. It won the faculty's "
            "Golden Mesh prize for the best master's thesis of 2019.",
            "advisor": "Prof. Ewa Przykładowa",
            "areas": ["Numerical analysis", "Partial differential equations"],
        },
        pl={
            "study": "Matematyka stosowana",
            "university": "Uniwersytet w Testowie",
            "research": "Praca magisterska: szybkie solvery równania ciepła w materiałach kompozytowych. Zdobyła "
            "wydziałową nagrodę Złotej Siatki (Golden Mesh) za najlepszą pracę magisterską 2019 roku.",
            "advisor": "prof. Ewa Przykładowa",
            "areas": ["Analiza numeryczna", "Równania różniczkowe cząstkowe"],
        },
    )
    create(
        School,
        degree=Degrees.BACHELOR,
        start=date(2014, 10, 1),
        end=date(2017, 7, 15),
        en={
            "study": "Mathematics",
            "university": "University of Testowo",
            "research": "Thesis: the finite element method for a vibrating string.",
            "areas": ["Analysis", "Numerical methods"],
        },
        pl={
            "study": "Matematyka",
            "university": "Uniwersytet w Testowie",
            "research": "Praca licencjacka: metoda elementów skończonych dla drgającej struny.",
            "areas": ["Analiza", "Metody numeryczne"],
        },
    )


def research() -> None:
    create(
        Publication,
        journal="Journal of Synthetic Numerical Analysis",
        year=2022,
        link="https://example.org/papers/adaptive-time-stepping",
        en={
            "title": "Adaptive time stepping for stiff thermal models of battery packs",
            "summary": "A time-stepping scheme that takes long steps while a pack's temperature is steady and short "
            "ones when it changes fast, with an error bound for each step.",
        },
        pl={
            "title": "Adaptacyjny krok czasowy dla sztywnych modeli termicznych pakietów baterii",
            "summary": "Schemat, który robi długie kroki, gdy temperatura pakietu jest stała, a krótkie, gdy szybko "
            "się zmienia, z oszacowaniem błędu każdego kroku.",
        },
    )
    create(
        Publication,
        journal="Preprint (not yet peer-reviewed)",
        year=2025,
        link="https://example.org/preprints/curved-meshes",
        en={
            "title": "Error bounds for finite-volume schemes on curved meshes",
            "summary": "How far a finite-volume solution can stray from the true one when the mesh follows a curved "
            "boundary.",
        },
        pl={
            "title": "Oszacowania błędu schematów objętości skończonych na siatkach krzywoliniowych",
            "summary": "Jak daleko rozwiązanie metodą objętości skończonych może odejść od prawdziwego, gdy siatka "
            "dopasowuje się do zakrzywionego brzegu.",
        },
    )


def teaching() -> None:
    for season, semester, en, pl in (
        (
            Seasons.WINTER,
            "2018/2019",
            ("Numerical analysis", "Jan explained stiffness with a kettle and an ice cube, and I finally got it."),
            ("Analiza numeryczna", "Jan wytłumaczył sztywność równań czajnikiem i kostką lodu i wreszcie zrozumiałam."),
        ),
        (
            Seasons.SUMMER,
            "2018/2019",
            ("Linear algebra", "Patient with every question, and his notes were better than the textbook."),
            ("Algebra liniowa", "Cierpliwy przy każdym pytaniu, a jego notatki były lepsze niż podręcznik."),
        ),
        (
            Seasons.WINTER,
            "2019/2020",
            ("Numerical analysis", "The only exercise class where I looked forward to the error analysis."),
            ("Analiza numeryczna", "Jedyne ćwiczenia, na których czekałem na analizę błędów."),
        ),
    ):
        create(
            Testimonial,
            season=season,
            semester=semester,
            en={"course": en[0], "content": en[1]},
            pl={"course": pl[0], "content": pl[1]},
        )
