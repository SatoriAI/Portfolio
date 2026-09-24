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
        "A decade of Python, in production at Nokia, Xperi and CloudFerro — alongside a PhD in harmonic analysis. I'm drawn to problems where the maths and the infrastructure both have to be right.",
      proof: [
        { value: "2", label: "papers on heat kernels" },
        { value: "4", label: "production systems" },
        { value: "GB → MB", label: "memory cut in a Nokia service" },
      ],
      askAI: "Ask Vex about me",
      askPlaceholder: "Ask Vex anything about me…",
      ask: "Ask",
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
        "Day to day that means Python — Django, FastAPI, SQLAlchemy — and the infrastructure around it: API design, data modelling, CI/CD and cloud deployments. LLMs, distributed systems and cryptography are where my curiosity currently points.",
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
      /** One line under each title in the index, keyed by the backend's title. */
      subtitles: {
        tURL: "Temporary short links, with a lifetime you can extend",
        OpenGrant: "Generative AI that drafts and manages R&D grant proposals",
        AdLume: "AI that runs and tunes ad campaigns",
        Portfolio: "This site, with an assistant that has read it",
        Picko: "A Secret Santa draw with no accounts",
      } as Record<string, string>,
    },
    contact: {
      title: "Let's Talk",
      subtitle2: "Open to backend and AI work — contract or full-time. I reply within a day.",
      email: "Email",
      quickMessage: "Chat with Vex",
      quickMessageDesc:
        "Vex is my assistant. It answers from this site's content: ask it about my experience, research or availability.",
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
            "I study how transformers learn to generalise on tasks with algebraic structure: models trained on modular addition over $ℤ_{113}$, watched through grokking. The question is whether, as generalisation appears, the hidden activations begin to encode cyclic shifts, and whether that structure can be tracked through training and across layers. Across three seeds, after grokking, selected activation subspaces do carry the dynamics of cyclic shifts, most coherently between a late layer and the output.",
            "The mathematics runs alongside. Exact intertwiners between group representations preserve the isotypic components, and for cyclic groups a bound connects approximate agreement between layers with the transport of Fourier components. How far that explains the experiments is the open question: the strict representation law is not yet established, and nothing shows that the structure causes generalisation.",
          ],
          figure: {
            figure: "The cyclic group of order 113 with one Fourier mode, under a shift",
            caption:
              "$ℤ_{113}$ as 113 points, with the Fourier mode $k$ drawn over them. A shift by $a$ turns the mode rigidly: $e^{2πik(x+a)/113} = e^{2πika/113} · e^{2πikx/113}$, a change of phase and nothing else. An operator that commutes with shifts therefore cannot mix one mode with another, which is the fact the intertwiner result rests on. The phase is printed with $ka$ reduced $\\text{mod }113$.",
            shift: "shift by",
            mode: "Fourier mode",
            notice:
              "What to notice: press shift and the wave keeps its shape. Only its position moves, and the readout says by exactly how much.",
          },
        },
        quantum: {
          title: "Quantum computing and quantum algorithms",
          paragraphs: [
            "I am building my knowledge of quantum computing from the basic concepts to the theory and implementation of quantum algorithms, along three lines at once: an intuition for qubits and interference, a formal treatment of quantum computation, and practice programming and simulating circuits.",
            "What draws me is the mathematical structure: states as vectors or operators, unitary evolution, measurement, and the operator theory underneath. Quantum information, error correction and quantum machine learning are the likely directions. For now this is a direction for future research, not a project with results.",
          ],
          figure: {
            figure: "One qubit on the Bloch sphere, with gates to apply",
            caption:
              "One qubit, simulated exactly: the buttons apply the unitaries $H$, $X$, $Z$, $S$ and $T$ to the amplitudes, and the vector turns along each gate's true rotation of the Bloch sphere. Press $H$ twice and the state returns to $|0⟩$: interference, in one line of a circuit.",
            gates: "Gates",
            reset: "Reset to |0⟩",
            notice:
              "What to notice: one H makes both outcomes equally likely; a second H makes the first certain again.",
            circuit: "Circuit",
            state: "State",
          },
        },
      },
      figure: {
        figure: "The Neumann heat kernel on a segment, over time",
        caption:
          "The Neumann heat kernel on a segment, $K_t(x, y)$ for fixed $y$. Drag $t$: heat placed at one point spreads and flattens towards the mean, $1/π$, and the field behind this page spreads with it. A sharp estimate bounds a kernel like this one from above and below by the same expression, up to constants. The series is cut at $n = 60$.",
        play: "Run the diffusion",
        time: "time t",
      },
      education: "Education",
      stack: "Publications, as a stack of files",
      venue: "Venue",
      year: "Year",
      publicationsLead:
        "Two papers on sharp estimates for Jacobi heat kernels: on the cone, then on the double cone. Open one.",
      figureNotice:
        "What to notice: the peak drops fast at first and slowly later, and the whole curve settles onto the dashed mean.",
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
        "Dekada Pythona, na produkcji w Nokii, Xperi i CloudFerro — równolegle z doktoratem z analizy harmonicznej. Ciągną mnie problemy, w których i matematyka, i infrastruktura muszą być poprawne.",
      proof: [
        { value: "2", label: "artykuły o jądrach ciepła" },
        { value: "4", label: "systemy produkcyjne" },
        { value: "GB → MB", label: "mniej pamięci w usłudze Nokii" },
      ],
      askAI: "Zapytaj Vex o mnie",
      askPlaceholder: "Zapytaj Vex o cokolwiek…",
      ask: "Zapytaj",
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
        "Na co dzień oznacza to Pythona — Django, FastAPI, SQLAlchemy — i infrastrukturę wokół niego: projektowanie API, modelowanie danych, CI/CD i wdrożenia w chmurze. Moja ciekawość kieruje się dziś ku LLM-om, systemom rozproszonym i kryptografii.",
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
      subtitles: {
        tURL: "Tymczasowe krótkie linki, z ważnością do przedłużenia",
        OpenGrant: "Generatywna SI, która pisze i prowadzi wnioski grantowe B+R",
        AdLume: "SI, która prowadzi i stroi kampanie reklamowe",
        Portfolio: "Ta strona, z asystentem, który ją przeczytał",
        Picko: "Losowanie prezentów bez zakładania kont",
      } as Record<string, string>,
    },
    contact: {
      title: "Porozmawiajmy",
      subtitle2: "Otwarty na pracę backendową i AI — kontrakt lub etat. Odpowiadam w ciągu dnia.",
      email: "Email",
      quickMessage: "Porozmawiaj z Vex",
      quickMessageDesc:
        "Vex to mój asystent. Odpowiada na podstawie treści tej strony: zapytaj o moje doświadczenie, badania lub dostępność.",
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
            "Badam, jak transformery uczą się generalizować na zadaniach o strukturze algebraicznej: modele trenowane na dodawaniu modularnym w $ℤ_{113}$, obserwowane przez grokking. Pytanie brzmi, czy wraz z pojawieniem się generalizacji ukryte aktywacje zaczynają kodować przesunięcia cykliczne i czy tę strukturę da się śledzić w trakcie treningu i pomiędzy warstwami. Dla trzech ziaren losowych, po grokkingu, wybrane podprzestrzenie aktywacji rzeczywiście niosą dynamikę przesunięć cyklicznych, najspójniej między jedną z późnych warstw a wyjściem modelu.",
            "Równolegle idzie matematyka. Dokładne operatory splatające między reprezentacjami grupy zachowują składowe izotypowe, a dla grup cyklicznych oszacowanie wiąże przybliżoną zgodność między warstwami z transportem składowych Fouriera. Na ile to wyjaśnia eksperymenty, pozostaje pytaniem otwartym: ścisłe prawo reprezentacji nie jest jeszcze ustalone, a nic nie pokazuje, że ta struktura jest przyczyną generalizacji.",
          ],
          figure: {
            figure:
              "Grupa cykliczna rzędu 113 z jedną składową Fouriera, pod działaniem przesunięcia",
            caption:
              "$ℤ_{113}$ jako 113 punktów, a nad nimi składowa Fouriera $k$. Przesunięcie o $a$ obraca ją sztywno: $e^{2πik(x+a)/113} = e^{2πika/113} · e^{2πikx/113}$, czyli zmienia tylko fazę. Operator przemienny z przesunięciami nie może więc mieszać jednej składowej z drugą i na tym opiera się wynik o operatorach splatających. Faza jest wypisana z $ka$ zredukowanym $\\text{mod }113$.",
            shift: "przesuń o",
            mode: "Składowa Fouriera",
            notice:
              "Na co patrzeć: naciśnij „przesuń”, a fala zachowa kształt. Zmienia się tylko jej położenie, a odczyt mówi dokładnie o ile.",
          },
        },
        quantum: {
          title: "Obliczenia kwantowe i algorytmy kwantowe",
          paragraphs: [
            "Buduję swoją wiedzę o obliczeniach kwantowych od podstawowych pojęć po teorię i implementację algorytmów kwantowych, trzema torami naraz: intuicja kubitów i interferencji, formalne ujęcie obliczeń kwantowych oraz praktyka w programowaniu i symulowaniu obwodów.",
            "Przyciąga mnie struktura matematyczna: stany jako wektory lub operatory, ewolucja unitarna, pomiar i stojąca za tym teoria operatorów. Prawdopodobne kierunki to kwantowa teoria informacji, korekcja błędów i kwantowe uczenie maszynowe. Na razie to kierunek przyszłych badań, nie projekt z wynikami.",
          ],
          figure: {
            figure: "Jeden kubit na sferze Blocha, z bramkami do zastosowania",
            caption:
              "Jeden kubit, symulowany dokładnie: przyciski stosują bramki unitarne $H$, $X$, $Z$, $S$ i $T$ do amplitud, a wektor obraca się wzdłuż rzeczywistego obrotu sfery Blocha dla danej bramki. Naciśnij $H$ dwa razy, a stan wróci do $|0⟩$: interferencja w jednej linii obwodu.",
            gates: "Bramki",
            reset: "Wróć do |0⟩",
            notice:
              "Na co patrzeć: jedno H czyni oba wyniki równie prawdopodobnymi; drugie H znów czyni pierwszy pewnym.",
            circuit: "Obwód",
            state: "Stan",
          },
        },
      },
      figure: {
        figure: "Jądro ciepła Neumanna na odcinku, w czasie",
        caption:
          "Jądro ciepła Neumanna na odcinku, $K_t(x, y)$ dla ustalonego $y$. Przesuń $t$: ciepło z jednego punktu rozchodzi się i wyrównuje do średniej, $1/π$, a razem z nim rozchodzi się pole w tle tej strony. Ostre oszacowanie ogranicza takie jądro z góry i z dołu tym samym wyrażeniem, z dokładnością do stałych. Szereg ucięto na $n = 60$.",
        play: "Uruchom dyfuzję",
        time: "czas t",
      },
      education: "Wykształcenie",
      stack: "Publikacje jako stos akt",
      venue: "Miejsce publikacji",
      year: "Rok",
      publicationsLead:
        "Dwa artykuły o ostrych oszacowaniach jąder ciepła Jacobiego: na stożku, potem na podwójnym stożku. Otwórz jeden.",
      figureNotice:
        "Na co patrzeć: szczyt opada najpierw szybko, potem powoli, a cała krzywa osiada na przerywanej średniej.",
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
