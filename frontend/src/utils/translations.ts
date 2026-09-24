import { typesetDeep } from "@/lib/typography";

const copy = {
  en: {
    meta: {
      home: {
        title: "Dawid Hanrahan — Mathematician by training, engineer by trade",
        description:
          "Backend and AI engineer with a PhD in harmonic analysis. Python in production at Nokia, Xperi and CloudFerro.",
      },
      experience: {
        title: "Work experience — Dawid Hanrahan",
        description:
          "Roles, achievements and technologies across Nokia, Xperi, CloudFerro and PeakData.",
      },
      research: {
        title: "Research and teaching — Dawid Hanrahan",
        description:
          "PhD in harmonic analysis, published papers, and what students say about the teaching.",
      },
      notFound: {
        title: "Page not found — Dawid Hanrahan",
        description:
          "Backend and AI engineer with a PhD in harmonic analysis. Python in production at Nokia, Xperi and CloudFerro.",
      },
    },
    common: {
      tagline: "Mathematician by training, engineer by trade",
      language: "Language",
      menu: "Menu",
      openMenu: "Open navigation menu",
      chatWithVex: "Chat with Vex",
      loading: "Loading…",
      demo: "Demo",
      privateProject: "Private, commercial project — the code is not public.",
    },
    chat: {
      prompt: "Ask Vex anything about Dawid.",
      inputPlaceholder: "Ask Vex about Dawid…",
      starters: [
        "What's his experience with Kubernetes?",
        "Tell me about his PhD research",
        "Is he available for contract work?",
      ],
      errorFallback:
        "Vex didn't answer. Email me at dawidhanrahan@gmail.com and I'll reply within a day.",
      typing: "Vex is typing",
      clear: "Clear",
      send: "Send",
    },
    nav: {
      home: "Home",
      about: "About",
      skills: "Skills",
      projects: "Projects",
      contact: "Contact",
      experience: "Experience",
      academic: "Research",
      mainPage: "Main Page",
      pages: "Pages",
      homeSections: "Home Sections",
      otherPages: "Other Pages",
    },
    navDescriptions: {
      home: "Jump to the top of the Home page.",
      about: "Learn more about me on the Home page.",
      skills: "See my technical skills on the Home page.",
      projects: "View featured projects on the Home page.",
      contact: "Get in touch or chat with Vex on the Home page.",
    },
    hero: {
      title: "Mathematician by training. Engineer by trade.",
      subtitle:
        "Almost a decade of Python, in production at Nokia, Xperi and CloudFerro — alongside a PhD in harmonic analysis. I'm drawn to problems where the maths and the infrastructure both have to be right.",
      proof: [
        { value: "2", label: "published papers" },
        { value: "4", label: "production systems" },
        { value: "10k+", label: "weekly users served" },
      ],
      askAI: "Ask Vex about me",
      askPlaceholder: "Ask Vex anything about me…",
      ask: "Ask",
      askHint: "Vex is my assistant. It has read this site.",
      viewProjects: "View projects",
      field: {
        label: "heat kernel",
        replay: "Run the heat spread again",
      },
    },
    about: {
      title: "About Me",
      paragraph1:
        "Mathematics taught me to distrust anything I cannot prove; engineering taught me that a proof nobody can run is worth little. I work in the space between the two: production backends and AI systems built with the care of a research argument, and research questions approached with an engineer's insistence on something that actually works. Teaching sits alongside both — explaining a hard idea simply is the best test of whether you understand it.",
      paragraph2:
        "Day to day that means Python — Django, FastAPI, SQLAlchemy — and the infrastructure around it: API design, data modeling, CI/CD pipelines and cloud deployments. I value clean code, automation and documentation, and I am most at home where backend development, DevOps and data-driven applications meet. Emerging areas such as LLMs, distributed systems and cryptography are where my curiosity currently points.",
      mark: {
        toggle: "Show how the mark reads as 0 and 1",
        zero: "0",
        one: "1",
        reading: "→ dh",
      },
      markHint: "Binary Axis. Hover or tap: the initials first, the maths second.",
      philosophy: "Technical Philosophy",
      philosophyText:
        "Clarity always outlives shortcuts. Before I trust a system I want to be able to argue that it is correct — a property stated plainly, a test that would fail if it were false, and an invariant the code makes hard to break. That instinct comes from mathematics, and it is the most useful thing I brought from it into engineering.",
    },
    skills: {
      title: "Technical Skills",
      subtitle: "One square is a year in production. The filled one is the year still running.",
    },
    projects: {
      title: "Featured Projects",
      subtitle:
        "Backend and AI systems shipped end to end — from the data model to the deployment — for real users.",
      code: "Code",
      imageAlt: "{title} — icon",
      stack: "Stack",
      youAreHere: "you are here",
      askVex: "Ask Vex about {title}",
      askVexQuestion: "Tell me about {title}.",
    },
    contact: {
      title: "Let's Talk",
      subtitle2: "Open to backend and AI work — contract or full-time. I reply within a day.",
      email: "Email",
      quickMessage: "Chat with Vex",
      quickMessageDesc:
        "Vex is my assistant, trained on this site. Ask it about my experience, research or availability.",
    },
    hints: {
      swipeMore: "Swipe to see more",
    },
    experience: {
      title: "Work Experience",
      subtitle:
        "Every role, drawn to scale. Where two lines overlap, the roles ran at the same time.",
      timeline: {
        figure: "Career timeline, to scale",
        caption: "One tick per January. The dot marks the role still running.",
        now: "now",
      },
      keyAchievements: "Key Achievements",
      technologies: "Technologies",
      askVex: "Ask Vex about {company}",
      askVexQuestion: "What did he do at {company}?",
      error: "Failed to load work experience data",
      tryAgain: "Try Again",
      noData: "No work experience data available.",
    },
    academic: {
      title: "Research and Teaching",
      subtitle:
        "Heat kernels, since a bachelor's thesis in 2019: sharp estimates on segments, cones and double cones. Two papers. Lately, the algebra inside transformers; next, quantum computing. Teaching analysis and algebra alongside.",
      interests: {
        title: "Research interests",
        transformers: {
          title: "Mathematical structure in transformers",
          paragraphs: [
            "I study how transformers learn to generalise on tasks with algebraic structure. In a project on grokking, I analyse models trained on modular addition over the cyclic group ℤ₁₁₃. The central question is whether, as generalisation emerges, the model's hidden activations begin to encode cyclic shifts — and whether this structure can be tracked throughout training and across network layers.",
            "In my experiments, I analyse model activations at different stages of training, fit operators that describe shifts, and compare how these operators behave across layers. Preliminary results across three random seeds suggest that, after grokking, selected activation subspaces capture the dynamics of cyclic shifts. This structure emerges near the transition to generalisation, and its transport is particularly coherent between a later layer and the model's output.",
            "The project also develops a mathematical account of this phenomenon. I have derived a result showing that exact intertwiners between group representations preserve the corresponding isotypic components. For cyclic groups, a related bound connects approximate agreement between group actions across layers with the transport of Fourier components. I am now investigating how well this relationship explains the empirical results. In particular, the strict representation law for the model's activations has not yet been fully established, and the experiments do not show that the observed structure causes generalisation.",
          ],
          figure: {
            figure: "The cyclic group of order 113 with one Fourier mode, under a shift",
            caption:
              "ℤ₁₁₃ as 113 points, with the Fourier mode k drawn over them. A shift by a turns the mode rigidly: e^(2πik(x+a)/113) = e^(2πika/113) · e^(2πikx/113), a change of phase and nothing else. An operator that commutes with shifts therefore cannot mix one mode with another, which is the fact the intertwiner result rests on. The phase is printed with ka reduced mod 113.",
            shift: "shift by",
            mode: "Fourier mode",
          },
        },
        quantum: {
          title: "Quantum computing and quantum algorithms",
          paragraphs: [
            "I am building my knowledge of quantum computing, from its basic concepts to the theory and implementation of quantum algorithms. My planned learning path combines three perspectives: an intuitive understanding of qubits and interference, a formal treatment of quantum computation, and practical experience programming and simulating quantum circuits.",
            "I am especially interested in the mathematical structure of the field: quantum states as vectors or operators, unitary evolution, measurement, and the role of linear algebra and operator theory. Potential areas for further specialisation include quantum information theory, quantum error correction, and quantum machine learning. My goal is to build a strong foundation first, then choose a problem that can be studied theoretically or through controlled computational experiments.",
            "At this stage, I consider quantum computing a developing area of interest and a direction for future research, rather than a completed project with original results.",
          ],
          figure: {
            figure: "One qubit on the Bloch sphere, with gates to apply",
            caption:
              "One qubit, simulated exactly: the buttons apply the unitaries H, X, Z, S and T to the amplitudes, and the vector turns along each gate's true rotation of the Bloch sphere. Press H twice and the state returns to |0⟩: interference, in one line of a circuit.",
            gates: "Gates",
            reset: "Reset to |0⟩",
            circuit: "Circuit",
            state: "State",
          },
        },
      },
      figure: {
        figure: "The Neumann heat kernel on a segment, at four times",
        caption:
          "The Neumann heat kernel on a segment, K_t(x, y) for fixed y, at four times: heat placed at one point spreads and flattens towards the mean, 1/π. A sharp estimate bounds a kernel like this one from above and below by the same expression, up to constants. The series is cut at n = 60.",
      },
      inProgress: "in progress",
      quotes: { open: "“", close: "”" },
      researchFocus: "Research Focus",
      advisor: "Advisor",
      researchAreas: "Research Areas",
      publications: "Publications",
      studentTestimonials: "Student Testimonials",
      error: "Failed to load academic data",
      tryAgain: "Try Again",
      noData: "No academic data available.",
      view: "View",
      noPublications: "No publications available.",
      noTestimonials: "No testimonials available.",
    },
    notFound: {
      title: "Page not found",
      body: "The address you followed does not exist or has moved.",
      home: "Back to the home page",
    },
  },
  pl: {
    meta: {
      home: {
        title: "Dawid Hanrahan — Matematyk z wykształcenia, inżynier z zawodu",
        description:
          "Inżynier backendu i AI z doktoratem z analizy harmonicznej. Python na produkcji w Nokii, Xperi i CloudFerro.",
      },
      experience: {
        title: "Doświadczenie zawodowe — Dawid Hanrahan",
        description: "Stanowiska, osiągnięcia i technologie w Nokii, Xperi, CloudFerro i PeakData.",
      },
      research: {
        title: "Badania i dydaktyka — Dawid Hanrahan",
        description:
          "Doktorat z analizy harmonicznej, publikacje i opinie studentów o prowadzonych zajęciach.",
      },
      notFound: {
        title: "Nie znaleziono strony — Dawid Hanrahan",
        description:
          "Inżynier backendu i AI z doktoratem z analizy harmonicznej. Python na produkcji w Nokii, Xperi i CloudFerro.",
      },
    },
    common: {
      tagline: "Matematyk z wykształcenia, inżynier z zawodu",
      language: "Język",
      menu: "Menu",
      openMenu: "Otwórz menu nawigacji",
      chatWithVex: "Porozmawiaj z Vex",
      loading: "Wczytywanie…",
      demo: "Demo",
      privateProject: "Projekt prywatny, komercyjny — kod nie jest publiczny.",
    },
    chat: {
      prompt: "Zapytaj Vex o cokolwiek o Dawidzie.",
      inputPlaceholder: "Zapytaj Vex o Dawida…",
      starters: [
        "Jakie ma doświadczenie z Kubernetesem?",
        "Opowiedz o jego badaniach doktorskich",
        "Czy jest dostępny do pracy kontraktowej?",
      ],
      errorFallback:
        "Vex nie odpowiedział. Napisz na dawidhanrahan@gmail.com — odpowiem w ciągu dnia.",
      typing: "Vex pisze",
      clear: "Wyczyść",
      send: "Wyślij",
    },
    nav: {
      home: "Strona główna",
      about: "O mnie",
      skills: "Umiejętności",
      projects: "Projekty",
      contact: "Kontakt",
      experience: "Doświadczenie",
      academic: "Badania",
      mainPage: "Strona główna",
      pages: "Strony",
      homeSections: "Sekcje strony głównej",
      otherPages: "Pozostałe strony",
    },
    navDescriptions: {
      home: "Przejdź na początek strony głównej.",
      about: "Dowiedz się więcej o mnie na stronie głównej.",
      skills: "Zobacz moje umiejętności na stronie głównej.",
      projects: "Zobacz wybrane projekty na stronie głównej.",
      contact: "Skontaktuj się lub porozmawiaj z Vex na stronie głównej.",
    },
    hero: {
      title: "Matematyk z wykształcenia. Inżynier z zawodu.",
      subtitle:
        "Prawie dekada Pythona, na produkcji w Nokii, Xperi i CloudFerro — równolegle z doktoratem z analizy harmonicznej. Ciągną mnie problemy, w których i matematyka, i infrastruktura muszą być poprawne.",
      proof: [
        { value: "2", label: "opublikowane artykuły" },
        { value: "4", label: "systemy produkcyjne" },
        { value: "10k+", label: "użytkowników tygodniowo" },
      ],
      askAI: "Zapytaj Vex o mnie",
      askPlaceholder: "Zapytaj Vex o cokolwiek…",
      ask: "Zapytaj",
      askHint: "Vex to mój asystent. Przeczytał tę stronę.",
      viewProjects: "Zobacz projekty",
      field: {
        label: "jądro ciepła",
        replay: "Uruchom rozchodzenie ciepła ponownie",
      },
    },
    about: {
      title: "O mnie",
      paragraph1:
        "Matematyka nauczyła mnie nie ufać niczemu, czego nie potrafię udowodnić; inżynieria — że dowód, którego nikt nie może uruchomić, jest niewiele wart. Pracuję pomiędzy tymi dwoma światami: buduję produkcyjne backendy i systemy AI ze starannością badawczego wywodu, a do pytań naukowych podchodzę z inżynierskim uporem, żeby coś naprawdę działało. Obok tego jest nauczanie — proste wyjaśnienie trudnej idei to najlepszy sprawdzian, czy się ją rozumie.",
      paragraph2:
        "Na co dzień oznacza to Pythona — Django, FastAPI, SQLAlchemy — i infrastrukturę wokół niego: projektowanie API, modelowanie danych, pipeline'y CI/CD i wdrożenia w chmurze. Cenię czysty kod, automatyzację i dokumentację, a najlepiej czuję się tam, gdzie spotykają się backend, DevOps i aplikacje oparte na danych. Moja ciekawość kieruje się dziś ku rozwijającym się obszarom: LLM-om, systemom rozproszonym i kryptografii.",
      mark: {
        toggle: "Pokaż, jak znak czyta się jako 0 i 1",
        zero: "0",
        one: "1",
        reading: "→ dh",
      },
      markHint: "Oś binarna. Najedź lub dotknij: najpierw inicjały, potem matematyka.",
      philosophy: "Podejście techniczne",
      philosophyText:
        "Przejrzystość zawsze przeżywa skróty. Zanim zaufam systemowi, chcę umieć uzasadnić, że jest poprawny — własność zapisana wprost, test, który by nie przeszedł, gdyby była fałszywa, i niezmiennik, którego kod nie pozwala łatwo złamać. Ten odruch pochodzi z matematyki i jest najbardziej użyteczną rzeczą, jaką z niej przeniosłem do inżynierii.",
    },
    skills: {
      title: "Umiejętności",
      subtitle: "Jeden kwadrat to rok na produkcji. Wypełniony to rok, który wciąż trwa.",
    },
    projects: {
      title: "Wybrane projekty",
      subtitle:
        "Systemy backendowe i AI dostarczone od początku do końca — od modelu danych po wdrożenie — dla prawdziwych użytkowników.",
      code: "Kod",
      imageAlt: "{title} — ikona",
      stack: "Technologie",
      youAreHere: "jesteś tutaj",
      askVex: "Zapytaj Vex o {title}",
      askVexQuestion: "Opowiedz o {title}.",
    },
    contact: {
      title: "Porozmawiajmy",
      subtitle2: "Otwarty na pracę backendową i AI — kontrakt lub etat. Odpowiadam w ciągu dnia.",
      email: "Email",
      quickMessage: "Porozmawiaj z Vex",
      quickMessageDesc:
        "Vex to mój asystent, wytrenowany na tej stronie. Zapytaj o moje doświadczenie, badania lub dostępność.",
    },
    hints: {
      swipeMore: "Przeciągnij w bok, aby zobaczyć więcej",
    },
    experience: {
      title: "Doświadczenie zawodowe",
      subtitle:
        "Każda rola, narysowana w skali. Tam, gdzie dwie linie się nakładają, role trwały równocześnie.",
      timeline: {
        figure: "Oś czasu kariery, w skali",
        caption: "Jedna kreska na każdy styczeń. Kropka oznacza rolę, która wciąż trwa.",
        now: "teraz",
      },
      keyAchievements: "Kluczowe osiągnięcia",
      technologies: "Technologie",
      askVex: "Zapytaj Vex o {company}",
      askVexQuestion: "Co robił w firmie {company}?",
      error: "Nie udało się załadować danych o doświadczeniu zawodowym",
      tryAgain: "Spróbuj ponownie",
      noData: "Brak dostępnych danych o doświadczeniu zawodowym.",
    },
    academic: {
      title: "Badania i dydaktyka",
      subtitle:
        "Jądra ciepła od pracy licencjackiej w 2019 roku: ostre oszacowania na odcinku, stożku i podwójnym stożku. Dwa artykuły. Ostatnio algebra wewnątrz transformerów, dalej obliczenia kwantowe. Obok tego zajęcia z analizy i algebry.",
      interests: {
        title: "Zainteresowania badawcze",
        transformers: {
          title: "Struktura matematyczna w transformerach",
          paragraphs: [
            "Badam, jak transformery uczą się generalizować na zadaniach o strukturze algebraicznej. W projekcie dotyczącym grokkingu analizuję modele trenowane na dodawaniu modularnym w grupie cyklicznej ℤ₁₁₃. Główne pytanie brzmi: czy wraz z pojawieniem się generalizacji ukryte aktywacje modelu zaczynają kodować przesunięcia cykliczne — i czy tę strukturę da się śledzić w trakcie treningu i pomiędzy warstwami sieci.",
            "W eksperymentach analizuję aktywacje modelu na różnych etapach treningu, dopasowuję operatory opisujące przesunięcia i porównuję, jak zachowują się one pomiędzy warstwami. Wstępne wyniki dla trzech ziaren losowych sugerują, że po grokkingu wybrane podprzestrzenie aktywacji oddają dynamikę przesunięć cyklicznych. Struktura ta pojawia się w pobliżu przejścia do generalizacji, a jej transport jest szczególnie spójny między jedną z późniejszych warstw a wyjściem modelu.",
            "Projekt rozwija także matematyczny opis tego zjawiska. Wyprowadziłem wynik pokazujący, że dokładne operatory splatające między reprezentacjami grupy zachowują odpowiadające im składowe izotypowe. Dla grup cyklicznych pokrewne oszacowanie wiąże przybliżoną zgodność działań grupy pomiędzy warstwami z transportem składowych Fouriera. Obecnie badam, na ile ta zależność wyjaśnia wyniki empiryczne. W szczególności ścisłe prawo reprezentacji dla aktywacji modelu nie zostało jeszcze w pełni ustalone, a eksperymenty nie pokazują, że zaobserwowana struktura jest przyczyną generalizacji.",
          ],
          figure: {
            figure:
              "Grupa cykliczna rzędu 113 z jedną składową Fouriera, pod działaniem przesunięcia",
            caption:
              "ℤ₁₁₃ jako 113 punktów, a nad nimi składowa Fouriera k. Przesunięcie o a obraca ją sztywno: e^(2πik(x+a)/113) = e^(2πika/113) · e^(2πikx/113), czyli zmienia tylko fazę. Operator przemienny z przesunięciami nie może więc mieszać jednej składowej z drugą i na tym opiera się wynik o operatorach splatających. Faza jest wypisana z ka zredukowanym mod 113.",
            shift: "przesuń o",
            mode: "Składowa Fouriera",
          },
        },
        quantum: {
          title: "Obliczenia kwantowe i algorytmy kwantowe",
          paragraphs: [
            "Buduję swoją wiedzę o obliczeniach kwantowych: od podstawowych pojęć po teorię i implementację algorytmów kwantowych. Zaplanowana ścieżka nauki łączy trzy perspektywy: intuicyjne rozumienie kubitów i interferencji, formalne ujęcie obliczeń kwantowych oraz praktykę w programowaniu i symulowaniu obwodów kwantowych.",
            "Szczególnie interesuje mnie matematyczna struktura tej dziedziny: stany kwantowe jako wektory lub operatory, ewolucja unitarna, pomiar oraz rola algebry liniowej i teorii operatorów. Możliwe kierunki dalszej specjalizacji to kwantowa teoria informacji, kwantowa korekcja błędów i kwantowe uczenie maszynowe. Moim celem jest najpierw zbudować solidne podstawy, a potem wybrać problem, który da się badać teoretycznie lub w kontrolowanych eksperymentach obliczeniowych.",
            "Na tym etapie traktuję obliczenia kwantowe jako rozwijający się obszar zainteresowań i kierunek przyszłych badań, a nie zamknięty projekt z własnymi wynikami.",
          ],
          figure: {
            figure: "Jeden kubit na sferze Blocha, z bramkami do zastosowania",
            caption:
              "Jeden kubit, symulowany dokładnie: przyciski stosują bramki unitarne H, X, Z, S i T do amplitud, a wektor obraca się wzdłuż rzeczywistego obrotu sfery Blocha dla danej bramki. Naciśnij H dwa razy, a stan wróci do |0⟩: interferencja w jednej linii obwodu.",
            gates: "Bramki",
            reset: "Wróć do |0⟩",
            circuit: "Obwód",
            state: "Stan",
          },
        },
      },
      figure: {
        figure: "Jądro ciepła Neumanna na odcinku, w czterech chwilach",
        caption:
          "Jądro ciepła Neumanna na odcinku, K_t(x, y) dla ustalonego y, w czterech chwilach: ciepło z jednego punktu rozchodzi się i wyrównuje do średniej, 1/π. Ostre oszacowanie ogranicza takie jądro z góry i z dołu tym samym wyrażeniem, z dokładnością do stałych. Szereg ucięto na n = 60.",
      },
      inProgress: "w toku",
      quotes: { open: "„", close: "”" },
      researchFocus: "Obszar badań",
      advisor: "Promotor",
      researchAreas: "Obszary badawcze",
      publications: "Publikacje",
      studentTestimonials: "Opinie studentów",
      error: "Nie udało się załadować danych akademickich",
      tryAgain: "Spróbuj ponownie",
      noData: "Brak dostępnych danych akademickich.",
      view: "Zobacz",
      noPublications: "Brak dostępnych publikacji.",
      noTestimonials: "Brak dostępnych opinii.",
    },
    notFound: {
      title: "Nie znaleziono strony",
      body: "Adres, który otworzyłeś, nie istnieje lub został przeniesiony.",
      home: "Wróć na stronę główną",
    },
  },
};

/**
 * Site copy in both languages. The Polish half passes through the typographic
 * rules once here, so no component has to remember that a one-letter word may
 * not end a line.
 */
export const translations = {
  en: copy.en,
  pl: typesetDeep(copy.pl, "pl"),
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
