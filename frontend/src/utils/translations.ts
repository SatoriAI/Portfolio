import { typesetDeep } from "@/lib/typography";

const copy = {
  en: {
    meta: {
      workshop: {
        title: "In the workshop · Dawid Hanrahan",
        description:
          "Ideas, experiments and conclusions from research and successive prototypes: software in production and mathematics.",
      },
      home: {
        title: "Dawid Hanrahan · Mathematician by training, engineer by trade",
        description:
          "Python backend engineer and PhD candidate in harmonic analysis. In production since 2019: Nokia, PeakData, Xperi, CloudFerro. Projects and pieces from the workshop.",
      },
      experience: {
        title: "Work experience · Dawid Hanrahan",
        description:
          "Roles, achievements and technologies across Nokia, Xperi, CloudFerro and PeakData.",
      },
      research: {
        title: "Research · Dawid Hanrahan",
        description:
          "Published papers in harmonic analysis and the questions under investigation now.",
      },
      education: {
        title: "Education and teaching · Dawid Hanrahan",
        description:
          "A PhD in harmonic analysis, in progress, and what students say about the teaching.",
      },
      notFound: {
        title: "Page not found · Dawid Hanrahan",
        description:
          "Python backend engineer and PhD candidate in harmonic analysis. In production since 2019: Nokia, PeakData, Xperi, CloudFerro. Projects and pieces from the workshop.",
      },
    },
    common: {
      tagline: "Mathematician by training, engineer by trade",
      language: "Language",
      menu: "Menu",
      openMenu: "Open navigation menu",
      chatWithVex: "Chat with Vex",
      loading: "Loading…",
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
        "Vex didn't answer. Email me at dawidhanrahan@gmail.com and I'll reply within a few hours.",
      typing: "Vex is typing",
      clear: "Clear",
      send: "Send",
    },
    nav: {
      home: "Home",
      about: "About",
      projects: "Projects",
      contact: "Contact",
      experience: "Experience",
      academic: "Research",
      education: "Education",
      workshop: "In the workshop",
      skipToContent: "Skip to content",
      mainPage: "Main page",
      pages: "Pages",
      homeSections: "Home sections",
    },
    navDescriptions: {
      home: "Jump to the top of the Home page.",
      about: "Learn more about me on the Home page.",
      projects: "View featured projects on the Home page.",
      contact: "Get in touch or chat with Vex on the Home page.",
    },
    hero: {
      theorem: "Theorem.",
      statement: ["Mathematician by training", "engineer by trade"],
      and: "and",
      proof: "Proof.",
      proofLines: [
        {
          text: "I'm working on a PhD in pure mathematics.",
          to: "/education",
          label: "education",
        },
        {
          text: "For almost a decade I've built commercial software.",
          to: "/experience",
          label: "experience",
        },
        {
          text: "I build my own products, from idea to deployment.",
          to: "/#projects",
          label: "projects",
        },
      ],
      askAI: "Ask Vex about me",
    },
    about: {
      title: "About me",
      definition: {
        label: "Definition.",
        sentence: "{name} is a mathematician who builds software.",
        name: "Dawid Hanrahan",
        book: "Einstein's Cosmos",
        body: "Mathematics stopped being a school subject for me when, as a teenager, I read Michio Kaku's {book}. Today I'm doing a PhD and teaching. In the software I build, theory pays off: in system architecture, optimisation problems and understanding AI models, and lately in UI/UX too.",
        properties: [
          { key: "home", value: "Wrocław" },
          { key: "after work", value: "boxing, the gym, chess, books" },
          { key: "superhero", value: "Iron Man, for obvious reasons" },
        ],
      },
      routes: {
        experience: "Nokia, PeakData, Xperi, CloudFerro: roles and skills",
        research: "Heat kernels, the papers, and grokking",
        education: "Degrees and teaching",
        workshop: "Latest: {title}",
      },
    },
    skills: {
      title: "How a request travels",
      subtitle: "Pick a technology to see where I used it. Or the other way round.",
      layers: {
        interfaceApi: "Interface and API",
        dataServices: "Data and services",
        platformDelivery: "Platform and delivery",
        ai: "AI and tools",
      },
      roles: "Roles",
      /** A sidebar circle's name; `{company}` is replaced. */
      showSkills: "{company}: show the skills",
      openRole: "More",
      /** The link's full name; `{company}` is replaced. */
      openRoleFull: "More about {company}",
      /** After the first projects, how many more there are. */
      more: "+{count} more",
      /** Where a claimed level reaches back before the roles on the axis. */
      earlier: "earlier",
      projects: "Projects",
      /** Beside a skill no role above lists. */
      outsideRoles: "Outside the roles above",
      /** A level that is not a count of years, as the backend stores it, said here. */
      levels: { "Since launch": "Since launch" } as Record<string, string>,
      /** The row's accessible name when it can be pressed. */
      show: "{name}: show the roles",
    },
    workshop: {
      title: "In the workshop",
      /** The workshop page's heading, under its name. */
      headline: "Every prototype starts as a Mark I",
      /** Over the text before a piece's first heading, in the margin. */
      introduction: "Introduction",
      lead: "Ideas, experiments and conclusions from research and successive prototypes.",
      all: "all pieces",
      /** The small figure with a piece on the home page. */
      figure: {
        newExamples: "new examples",
        training: "training",
        delay: "delay",
        variants: {
          old: "Old prompt, literal matching",
          trim: "Trimming the endings (#144)",
          new: "New prompt and the short-word rule (#145)",
          both: "Both approaches together",
        },
        hits: "Hits",
        falseHits: "FA",
        searchNote: "{n} expected hits · FA = false alarms",
        heatCaption: "Comparing multiplication before and after diffusion recovers the gradients.",
      },
      minutes: "{n} min read",
      tags: "Topics",
      /** A piece shown in the language it was written in, keyed by that language. */
      onlyIn: { pl: "Polish only for now", en: "English only for now" },
      onlyInLong: {
        pl: "This piece is in Polish only for now.",
        en: "This piece is in English only for now.",
      },
      empty: "No pieces yet.",
      copy: "Copy",
      copied: "Copied",
      footnotes: "Footnotes",
      /** A footnote's way back to where it is cited; `{n}` is its number. */
      backToText: "Back to reference {n}",
      related: "More on this:",
      pages: {
        "/experience": "Experience",
        "/research": "Research",
        "/education": "Education",
        "/#projects": "Projects",
      } as Record<string, string>,
      closing: {
        title: "Got an idea for a piece?",
        body: "Write, or ask Vex first.",
        email: "Write to me",
      },
      articleClosing: {
        title: "A question about this piece?",
        body: "Write, or ask Vex first.",
        email: "Write to me",
      },
    },
    projects: {
      /** When the projects cannot be loaded; no stand-in work is shown. */
      error: "The projects could not be loaded.",
      tryAgain: "Try again",
      title: "Projects",
      code: "code",
      codeOnGithub: "Code on GitHub",
      codePrivate: "private code",
      stack: "Stack",
      stackNext: "Next technology",
      proof: {
        checking: { one: "Checking {n} site…", other: "Checking {n} sites…" },
        answered: {
          one: "{n} site answered just now, in {ms}",
          other: "{n} sites answered just now, in {ms} on average",
        },
        none: "No site answered this time.",
      },
      youAreHere: "you are here",
      notPublic: "not public yet",
      askVex: "Ask Vex about {title}",
      askVexQuestion: "Tell me about {title}.",
      quoted: "“{text}”",
      screenshotAlt: "{title}: screenshot",
      previous: "Show previous projects",
      next: "Show more projects",
      live: {
        check: "Check it live",
        again: "Check again",
        checking: "checking…",
        answered: "answers · {ms} ms",
        silent: "no answer",
        openAria: "Open {host} in a new tab",
      },
      /** One line under each title in the index, keyed by the backend's title. */
      subtitles: {
        tURL: "Link shortening with a personal touch!",
        OpenGrant: "GenAI for writing grant applications.",
        AdLume: "AI marketing around the clock.",
        Portfolio: "This site, with an assistant that has read it",
        Picko: "A Secret Santa draw without the needless complexity.",
        Slip: "No more keeping receipts in the freezer!",
        Konfio: "No more dozens of emails! Everything in one place.",
        Athlo: "Sports competitions, reimagined.",
      } as Record<string, string>,
      facts: {
        tURL: { role: "My first project built with AI · 2025" },
        Picko: { role: "I learned Claude Code and UI/UX intensively · 2025" },
        Slip: { role: "I developed my UI/UX skills · since 2026" },
        AdLume: { role: "I co-created the project as an AI engineer · 2025–2026" },
        Athlo: { role: "Responsible for the technology and UI/UX · since 2026 · before launch" },
        Konfio: {
          role: "Co-founder and the only person responsible for the technology · since 2025",
        },
        OpenGrant: { role: "Co-founder, responsible for the technology · since 2025" },
      } as Record<string, { role: string }>,
    },
    contact: {
      title: "Let's talk",
      lead: "Any reason to talk is a good one.",
      list: {
        email: "Email",
        reply: "I usually reply within a few hours.",
        copy: "Copy the email address",
        copied: "Address copied",
        vex: "Vex",
        vexMain: "Ask my assistant",
        vexLine: "It answers you right away, any time.",
        github: "GitHub",
        githubLine: "Browse the code behind my projects.",
      },
    },
    experience: {
      title: "I like code that holds up in production",
      subtitle: "Less magic, more engineering. Though sometimes it's hard to tell.",
      rolesTitle: "Roles",
      timeline: {
        figure: "Career timeline, to scale",
        now: "now",
      },
      closing: {
        title: "A project together? Sure!",
        body: "Write, or ask Vex first.",
        email: "Write to me",
        /** Above the closing: the way on to the next page. */
        next: { lead: "Beyond engineering:", label: "research" },
      },
      dialog: {
        previous: "Previous role",
        next: "Next role",
        close: "Close",
      },
      keyAchievements: "Key achievements",
      technologies: "Technologies",
      askVex: "Ask Vex about {company}",
      askVexQuestion: "What did he do at {company}?",
      error: "Failed to load work experience data",
      tryAgain: "Try again",
      noData: "No work experience data available.",
    },
    academic: {
      title: "I like it when a proof comes together",
      educationTitle: "I like it when a hard idea turns simple",
      educationLeadLine: "Intuition first, then proof. Usually in that order.",
      subtitle:
        "Heat kernels, since a bachelor's thesis in 2019: sharp estimates on segments, cones and double cones. Two papers. Lately, the algebra inside transformers; next, quantum computing. Teaching analysis and algebra alongside.",
      interests: {
        title: "Research interests",
        transformers: {
          title: "What changes when a model generalises",
          stages: {
            task: "A simple task",
            result: "First memorisation, then generalisation",
            clue: "A mathematical clue",
            open: "What is not yet established",
          },
          /** Over the chart, which asks before it answers; the finding sits under it. */
          predictQuestion:
            "The model already gets every training example right. From which step will it handle new ones too? Move the marker to your guess and check.",
          /**
           * The finding, under the chart, with the work the setup reproduces
           * credited. grokking.test.ts holds the data to its claims.
           */
          resultLead:
            "By step 1,000 the model answered every training example correctly. On the same data, one to two thousand steps later, its accuracy on new ones passed 50% as well. This delayed generalisation is called *grokking*.",
          /** After the finding: the work the setup reproduces, and where the name comes from; both linked. */
          resultCredit: {
            before: "The setup reproduces ",
            setup: "Nanda et al. (2023)",
            between: "; the term comes from ",
            term: "Power et al. (2022)",
            after: ".",
          },
          /** Below the chart's panel: what the result shows, and the question stage 03 takes up. */
          resultQuestion:
            "The result shows when the model began to handle new examples. My research question concerns what changed in its internal structure at that point.",
          paragraphs: [
            "Imagine a student who knows every answer to the practice questions but struggles with a test full of new ones. An AI model can behave similarly. In a task like adding hours on a clock, it may master the examples it trained on and still get unfamiliar ones wrong.",
            "I’m interested in what changes inside the model at that moment. Can we describe that change mathematically? One clue is patterns that look like waves arranged around a circle. On this kind of clock, adding a number shifts the position by a fixed number of places. Waves give us a mathematical way to describe such shifts.",
            "The illustration shows a mathematical idea, not a direct view inside the model. Nanda et al. found this structure in the representations of networks of this kind, and I see similar signs of it in my runs. It has not yet been established whether the emergence of that structure causes the improvement on new examples.",
            "This simple experiment does not yet explain reasoning in large language models, but it helps us ask more precise questions about how they learn rules and apply them in unfamiliar situations.",
          ],
          clock: {
            label: "Explanatory example",
            figure: "A 12-hour clock: 7 + 8 = 3",
            /** The clock can be pressed to count the eight hours again. */
            replay: "Count again",
            caption:
              "On a 12-hour clock, 7\u00a0+\u00a08\u00a0=\u00a03: past twelve, counting starts over. The model learned the same operation on a clock with 113 places.",
          },
          chart: {
            /** Stands in the frame's top edge, as the other figures' labels do. */
            title: "Accuracy on seen and new examples",
            /** The guess before the new examples are shown. `{step}` is replaced. */
            predict: {
              guess: "Your guess: step {step}",
              marker: "Your guess",
              check: "Check",
              drag: "Drag the marker on the chart",
              /** The slider's value before the marker has been moved. */
              none: "No step chosen",
              how: "Drag the marker on the chart or move it with the left and right arrow keys, then press Enter or Check.",
              retry: "Try again",
              verdict: { perfect: "Spot on", almost: "Almost", wrong: "Not this time" },
              result:
                "Accuracy on new examples passed 50% between step {from} and step {to}, in all three runs.",
            },
            seen: "Examples seen in training",
            unseen: "New examples",
            stepAxis: "Training step",
            accuracyAxis: "Correct answers",
            step: "Step",
            run: "Run",
            caption:
              "The same type of model was trained three times. Each run used a randomly chosen starting point and a new split of the number pairs: 30% were used for training, while the remaining 70% were held back to check the results. The chart shows measurements taken every 1,000 steps; the lines simply connect them.",
            /** The selected step in words, one form per shape of its data; see `stepSentence`. */
            stepNote: {
              same: "Step {step}: accuracy on both training and new examples is {value} in all three runs.",
              seenFixed:
                "Step {step}: accuracy on training examples is {seen} in all three runs, while accuracy on new examples ranges from {unseenMin} to {unseenMax}.",
              bothVary:
                "Step {step}: across the three runs, accuracy on training examples ranges from {seenMin} to {seenMax}, and on new examples from {unseenMin} to {unseenMax}.",
            },
          },
          figure: {
            label: "Illustration of a mathematical principle",
            figure: "The numbers 0 to 112 on a circle, with a wave drawn over them",
            prompt:
              "Shift the numbers and check: does the wave change its shape, or only its position?",
            waves: "Number of waves: $k = {k}$",
            add: "Add to the input: $+{a}$",
            note: "Move the slider: adding the same number to the input moves the wave around the circle but does not change its shape. The points stand for the numbers 0 to 112.",
            curious: "For the curious",
            detail:
              "A wave of frequency $k$ repeats its pattern $k$ times around the circle. Shifting the numbers changes its phase: the place where the pattern begins. In the model, I study whether similar relationships appear among its internal signals.",
          },
        },
      },
      figure: {
        figure: "The Neumann heat kernel on a segment, over time",
        caption:
          "The Neumann heat kernel on a segment, $K_t(x, y)$ for fixed $y$. Drag $t$: heat placed at one point spreads and flattens towards the mean, $1/π$, and the field behind this page spreads with it. A sharp estimate bounds a kernel like this one from above and below by the same expression, up to constants. The series is cut at $n = 60$.",
        play: "Run the diffusion",
        playing: "Running…",
        time: "time t",
      },
      education: "Academic background",
      story: {
        lead: "A hunch says “probably”. Mathematics says “always”.",
        contents: "On this page",
        kernels: {
          title: "Heat kernels",
          leadLine:
            "How can we describe the spread of heat when the geometry of a space complicates the answer?",
          stages: {
            map: "A map of influence",
            geometry: "Why isn’t distance alone enough?",
            sharp: "What does my work involve?",
            why: "Why it matters",
          },
          map: "A heat kernel can be thought of as a map of influence. We specify where a pulse of heat begins, where we observe its effect, and how much time has passed. The kernel describes how strong that effect is at the observation point. By varying the locations and time, we see the process as a whole.",
          geometry:
            "In the spaces I study, the distance between the pulse and the observation point is not enough on its own. Their position relative to a boundary or a tip matters too. So even at the same distance, the influence of heat can differ. Over time, the importance of these special places changes as well. This makes it harder to find bounds that work for different places and moments.",
          sharp:
            "In my work, I derive lower and upper bounds for the value of the heat kernel. Both have the same form and differ only by a constant factor. This is exactly what makes the estimate *sharp*: it shows the right dependence on position and time, even though it does not give the exact value of the kernel.",
          whyBefore:
            "These bounds are useful when the kernel’s exact form is too complicated to work with easily. They help us study mathematical models of diffusion and ask new questions. I explore one of them in “",
          whyLink: "From heat kernels to a quantum algorithm",
          whyAfter: ".”",
          influence: {
            label: "A map of influence on a cone",
            figure:
              "A cone with a heated spot and an observation point; the heat spreads as time passes",
            impulse: "heated spot",
            observation: "observation point",
            tip: "tip",
            boundary: "boundary",
            time: "Time since heating",
            start: "just after heating",
            later: "later",
            caption:
              "Move the slider to see how heat spreads from the heated spot towards the observation point.",
          },
          bounds: {
            label: "What a sharp estimate looks like",
            figure:
              "A lower and an upper bound of the same shape; the exact value of the kernel lies between them",
            yAxis: "strength of the influence",
            xAxis: "distance from the heated spot",
            upper: "upper bound",
            between: "the kernel’s value lies between the bounds",
            lower: "lower bound",
            time: "Time",
            start: "earlier",
            later: "later",
            caption:
              "The kernel’s value lies between the lower and upper bounds. Both change by the same rule and differ only by a constant factor.",
          },
        },
        transformers: {
          question:
            "What can simple sums reveal about how AI models learn to handle unfamiliar examples?",
        },
        jacobiQuantum: {
          title: "From heat kernels to a quantum algorithm",
          leadLine:
            "Imagine a long rod. One part of it is hot and the rest is cooler. Can a quantum computer calculate how much heat will be in the marked region A a moment later, without simulating the whole rod?",
          introTitle: "One number, a new question",
          intro:
            "Region A cannot simply be cut out. Heat from other parts of the rod, including distant ones, can change the result. I want to establish how large a neighbourhood has to be included so that the error from leaving out the rest stays within an agreed limit.",
          clueTitle: "A mathematical clue",
          clueBeforePaper:
            "The rod helps picture the problem. In the research I start from a mathematical model of heat spreading called the Jacobi model. In it, the heat kernel works as a map of influence: it describes how strongly one place affects another after some time. ",
          paper: "The estimates of Nowak, Sjögren and Szarek",
          clueAfterPaper:
            " suggest that when little time has passed since the process began, the influence falls off quickly with distance from A. Move the slider to see this intuition in the illustration.",
          figure: {
            label: "Schematic of heat spreading",
            figure:
              "A horizontal rod: heat from a section that starts hot spreads to the sides and in time reaches region A",
            hot: "hot at the start",
            region: "A",
            time: "Time since the start",
            start: "start",
            later: "later",
            states: {
              concentrated: "The heat is concentrated in the heated section.",
              spreading: "The heat spreads to the sides and becomes less concentrated.",
              reached: "The heat also reaches A.",
            },
            caption:
              "Move the slider to see how heat from the heated section reaches region A. Although only A interests us, the result also depends on what happens in other parts of the rod.",
          },
          proofTitle: "What remains to be proved",
          proof:
            "The small influence of distant places is only a first hint. It still has to be shown that a calculation on a smaller region gives almost the same result in A, and that the error can be bounded. Only then can a quantum algorithm be built and its full cost counted, from preparing the data to reading out the answer. A comparison with the best classical methods will show whether this approach really helps.",
        },
        teaching: {
          title: "Teaching",
          /** A paraphrase of Feynman, so it is credited "after" him, not quoted as his. */
          quote:
            "If you can't explain something to a first-year student, you don't really understand it.",
          quoteSource: "after Richard Feynman",
          themesLabel: "What students noticed",
          themes: [
            { key: "clarity", label: "Explains simply" },
            { key: "prepared", label: "Well prepared" },
            { key: "beyond", label: "Beyond the syllabus" },
            { key: "friendly", label: "Friendly classes" },
          ],
          /**
           * Per review (by its id), the words that say each theme, exactly as
           * the review reads. A phrase that is not in the review is ignored.
           * Ordered by what a theme says about the teaching, not by count:
           * friendliness is the most common praise and says the least.
           */
          evidence: {
            "1": {
              clarity: ["explains issues clearly"],
              prepared: ["is always prepared for classes and approaches them thoroughly"],
            },
            "2": {
              friendly: ["the classes were enjoyable", "very kind and nice"],
              beyond: [
                "how what we were doing related to computer science and where these issues were used",
              ],
            },
            "3": {
              friendly: ["very friendly, helpful", "a friendly atmosphere"],
              prepared: ["knowledgeable"],
              clarity: ["explain the topics in an accessible way"],
            },
            "4": {
              friendly: ["incredibly polite"],
              prepared: ["extensive knowledge"],
              beyond: ["interesting additional tasks"],
            },
            "5": {
              clarity: ["explains complex issues in a simple way"],
              friendly: ["a friendly atmosphere in class"],
            },
            "6": {
              friendly: ["very friendly lecturer", "one of the most enjoyable ones"],
            },
          } as Record<string, Record<string, string[]>>,
        },
        closing: {
          title: "Any questions about my degrees or classes?",
          body: "Write, or ask Vex first.",
          email: "Write to me",
          next: { lead: "Theory at work:", label: "in the workshop" },
        },
        researchClosing: {
          title: "Shall we talk science?",
          body: "Write, or ask Vex first.",
          email: "Write to me",
          next: { lead: "Where it started:", label: "degrees and teaching" },
        },
      },
      /** Over the research page's headline: what the work is. */
      eyebrow: "Research · PhD",
      stack: "Publications, as a stack of files",
      established: "What it shows",
      author: "Author",
      authors: "Authors",
      status: { published: "Published", preprint: "Preprint" },
      more: "More",
      less: "Less",
      /** Two or three sentences per paper, keyed by its link; the abstract sits behind a toggle. */
      publicationSummaries: {
        "https://doi.org/10.1016/j.jat.2023.105921":
          "On a cone, the boundary and the tip change the way heat spreads. How can we estimate how much heating one point affects the temperature at another? In this paper we derive lower and upper estimates, separately for the cone and for its surface.",
        "https://arxiv.org/abs/2411.15793":
          "Imagine two cones touching at their tips. How strongly does heat from one point affect another in such a model? In this paper I derive estimates that answer this. I also study related shapes and point out cases where the method does not yet give a complete answer.",
      } as Record<string, string>,
      /** One line worth its own place, keyed by the degree's start date. */
      educationHighlights: {
        "2016-10-03": {
          label: "Wrocław University of Science and Technology",
          text: "9th place in the TOP 10 competition for the best bachelor's graduates (2019)",
          href: "https://wmat.pwr.edu.pl/o-wydziale/aktualnosci/laureaci-konkursu-top-10-2019-10960.html",
        },
        "2022-10-03": {
          label: "Wrocław University of Science and Technology",
          text: "Average grade 4.75 (scale 2–5)",
        },
        "2019-10-03": {
          label: "Polish Mathematical Society",
          text: "2nd place in the Józef Marcinkiewicz Competition for the best master's thesis in mathematics in Poland",
          href: "https://www.mat.umk.pl/nauka/konkurs-im-jozefa-marcinkiewicza/",
        },
      } as Record<string, { label: string; text: string; href?: string }>,
      // The degree's topic, lifted from its own research paragraph (the
      // bachelor's is its thesis title).
      // What the drawing beside the degrees shows, named under it.
      degreeSteps: "Degrees",
      /** Under the degree's drawing: it can be pressed to set heat on it. */
      heatHint: "Press the shape to heat it",
      /** Read after a link that opens elsewhere. */
      newTab: "(opens in a new tab)",
      domainNames: {
        "torus-interval": "Torus and interval",
        cone: "Cone",
        revolution: "Solid of revolution",
        "double-cone": "Double cone",
      },
      educationHeadlines: {
        "2016-10-03": "The heat equation on the torus and the interval",
        "2019-10-03": "The heat equation on the cone",
        "2022-10-03": "Sharp estimates of Jacobi heat kernels",
      } as Record<string, string>,
      advisor: "Advisor",
      researchAreas: "Research areas",
      publications: "Publications",
      error: "Failed to load academic data",
      tryAgain: "Try again",
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
      workshop: {
        title: "Z warsztatu · Dawid Hanrahan",
        description:
          "Pomysły, eksperymenty i wnioski z badań i kolejnych prototypów: oprogramowanie na produkcji i matematyka.",
      },
      home: {
        title: "Dawid Hanrahan · Matematyk z wykształcenia, inżynier z zawodu",
        description:
          "Inżynier backendu w Pythonie, doktorant z analizy harmonicznej. Na produkcji od 2019 roku: Nokia, PeakData, Xperi, CloudFerro. Projekty i teksty z warsztatu.",
      },
      experience: {
        title: "Doświadczenie zawodowe · Dawid Hanrahan",
        description: "Stanowiska, osiągnięcia i technologie w Nokii, Xperi, CloudFerro i PeakData.",
      },
      research: {
        title: "Badania naukowe · Dawid Hanrahan",
        description: "Publikacje z analizy harmonicznej i pytania, nad którymi pracuję teraz.",
      },
      education: {
        title: "Wykształcenie i dydaktyka · Dawid Hanrahan",
        description:
          "Doktorat z analizy harmonicznej w toku i opinie studentów o prowadzonych zajęciach.",
      },
      notFound: {
        title: "Nie znaleziono strony · Dawid Hanrahan",
        description:
          "Inżynier backendu w Pythonie, doktorant z analizy harmonicznej. Na produkcji od 2019 roku: Nokia, PeakData, Xperi, CloudFerro. Projekty i teksty z warsztatu.",
      },
    },
    common: {
      tagline: "Matematyk z wykształcenia, inżynier z zawodu",
      language: "Język",
      menu: "Menu",
      openMenu: "Otwórz menu nawigacji",
      chatWithVex: "Porozmawiaj z Vexem",
      loading: "Wczytywanie…",
    },
    chat: {
      prompt: "Zapytaj Vexa o Dawida.",
      inputPlaceholder: "Zapytaj Vexa o Dawida…",
      starters: [
        "Jakie ma doświadczenie z Kubernetesem?",
        "Opowiedz o jego badaniach doktorskich",
        "Czy jest dostępny do pracy kontraktowej?",
      ],
      errorFallback:
        "Vex nie odpowiedział. Napisz na dawidhanrahan@gmail.com — odpowiem w ciągu kilku godzin.",
      typing: "Vex pisze",
      clear: "Wyczyść",
      send: "Wyślij",
    },
    nav: {
      home: "Strona główna",
      about: "O mnie",
      projects: "Projekty",
      contact: "Kontakt",
      experience: "Doświadczenie",
      academic: "Badania",
      education: "Wykształcenie",
      workshop: "Z warsztatu",
      skipToContent: "Przejdź do treści",
      mainPage: "Strona główna",
      pages: "Strony",
      homeSections: "Sekcje strony głównej",
    },
    navDescriptions: {
      home: "Przejdź na początek strony głównej.",
      about: "Dowiedz się więcej o mnie na stronie głównej.",
      projects: "Zobacz wybrane projekty na stronie głównej.",
      contact: "Skontaktuj się lub porozmawiaj z Vexem na stronie głównej.",
    },
    hero: {
      theorem: "Twierdzenie.",
      statement: ["Matematyk z wykształcenia", "inżynier z zawodu"],
      and: "i",
      proof: "Dowód.",
      proofLines: [
        {
          text: "Pracuję nad doktoratem z matematyki teoretycznej.",
          to: "/education",
          label: "wykształcenie",
        },
        {
          text: "Od prawie dekady tworzę oprogramowanie komercyjne.",
          to: "/experience",
          label: "doświadczenie",
        },
        {
          text: "Buduję własne produkty, od pomysłu po wdrożenie.",
          to: "/#projects",
          label: "projekty",
        },
      ],
      askAI: "Zapytaj Vexa o mnie",
    },
    about: {
      title: "O mnie",
      definition: {
        label: "Definicja.",
        sentence: "{name} to matematyk, który buduje oprogramowanie.",
        name: "Dawid Hanrahan",
        book: "Kosmos Einsteina",
        body: "Matematyka przestała być dla mnie szkolnym przedmiotem, kiedy jako nastolatek przeczytałem {book} Michio Kaku. Dziś piszę doktorat i prowadzę zajęcia ze studentami. Gdy buduję oprogramowanie, teoria procentuje: w architekturze systemów, problemach optymalizacyjnych i rozumieniu modeli AI, a od pewnego czasu również w UI/UX.",
        properties: [
          { key: "miasto", value: "Wrocław" },
          { key: "po pracy", value: "boks, siłownia, szachy, książki" },
          { key: "superbohater", value: "Iron Man z wiadomych przyczyn" },
        ],
      },
      routes: {
        experience: "Nokia, PeakData, Xperi, CloudFerro: role i umiejętności",
        research: "Jądra ciepła, publikacje i grokking",
        education: "Studia i nauczanie",
        workshop: "Najnowszy: {title}",
      },
    },
    skills: {
      title: "Jak przechodzi żądanie",
      subtitle: "Wybierz technologię, a zobaczysz, gdzie jej używałem. Albo odwrotnie.",
      layers: {
        interfaceApi: "Interfejs i API",
        dataServices: "Dane i usługi",
        platformDelivery: "Platforma i dostarczanie",
        ai: "AI i narzędzia",
      },
      roles: "Role",
      showSkills: "{company}: pokaż umiejętności",
      openRole: "Więcej",
      openRoleFull: "Więcej o {company}",
      more: "+{count} więcej",
      earlier: "wcześniej",
      projects: "Projekty",
      outsideRoles: "Poza rolami powyżej",
      levels: { "Since launch": "Od premiery" } as Record<string, string>,
      show: "{name}: pokaż role",
    },
    workshop: {
      title: "Z warsztatu",
      headline: "Każdy prototyp zaczyna się od Mark I",
      introduction: "Wstęp",
      lead: "Pomysły, eksperymenty i wnioski z badań i kolejnych prototypów.",
      all: "wszystkie teksty",
      figure: {
        newExamples: "nowe przykłady",
        training: "treningowe",
        delay: "opóźnienie",
        variants: {
          old: "Stary prompt, dopasowanie dosłowne",
          trim: "Przycinanie końcówek (#144)",
          new: "Nowy prompt i reguła krótkich słów (#145)",
          both: "Oba podejścia naraz",
        },
        hits: "Traf.",
        falseHits: "FA",
        searchNote: "{n} oczekiwanych trafień · FA = fałszywe alarmy",
        heatCaption: "Porównując mnożenie przed dyfuzją i po niej, odzyskujemy gradienty.",
      },
      minutes: "{n} min czytania",
      tags: "Tematy",
      onlyIn: { pl: "na razie tylko po polsku", en: "na razie tylko po angielsku" },
      onlyInLong: {
        pl: "Ten tekst jest na razie tylko po polsku.",
        en: "Ten tekst jest na razie tylko po angielsku.",
      },
      empty: "Nie ma jeszcze tekstów.",
      copy: "Kopiuj",
      copied: "Skopiowano",
      footnotes: "Przypisy",
      backToText: "Wróć do odsyłacza {n}",
      related: "Więcej w tym temacie:",
      pages: {
        "/experience": "Doświadczenie",
        "/research": "Badania",
        "/education": "Wykształcenie",
        "/#projects": "Projekty",
      } as Record<string, string>,
      closing: {
        title: "Masz pomysł na tekst?",
        body: "Napisz albo najpierw zapytaj Vexa.",
        email: "Napisz do mnie",
      },
      articleClosing: {
        title: "Pytanie o ten tekst?",
        body: "Napisz albo najpierw zapytaj Vexa.",
        email: "Napisz do mnie",
      },
    },
    projects: {
      error: "Nie udało się wczytać projektów.",
      tryAgain: "Spróbuj ponownie",
      title: "Projekty",
      code: "kod",
      codeOnGithub: "Kod na GitHubie",
      codePrivate: "kod prywatny",
      stack: "Technologie",
      stackNext: "Następna technologia",
      proof: {
        checking: {
          one: "Sprawdzam {n} serwis…",
          few: "Sprawdzam {n} serwisy…",
          many: "Sprawdzam {n} serwisów…",
          other: "Sprawdzam {n} serwisów…",
        },
        answered: {
          one: "{n} serwis odpowiedział przed chwilą, w {ms}",
          few: "{n} serwisy odpowiedziały przed chwilą, średnio w {ms}",
          many: "{n} serwisów odpowiedziało przed chwilą, średnio w {ms}",
          other: "{n} serwisów odpowiedziało przed chwilą, średnio w {ms}",
        },
        none: "Żaden serwis nie odpowiedział tym razem.",
      },
      youAreHere: "jesteś tutaj",
      notPublic: "jeszcze niepubliczne",
      askVex: "Zapytaj Vexa o projekt {title}",
      askVexQuestion: "Opowiedz o projekcie {title}.",
      quoted: "„{text}”",
      screenshotAlt: "{title}: zrzut ekranu",
      previous: "Pokaż poprzednie projekty",
      next: "Pokaż kolejne projekty",
      live: {
        check: "Sprawdź na żywo",
        again: "Sprawdź ponownie",
        checking: "sprawdzam…",
        answered: "odpowiada · {ms} ms",
        silent: "nie odpowiada",
        openAria: "Otwórz {host} w nowej karcie",
      },
      subtitles: {
        tURL: "Skracanie linków z nutką personalizacji!",
        OpenGrant: "GenAI w tworzeniu wniosków grantowych.",
        AdLume: "Marketing AI przez całą dobę.",
        Portfolio: "Ta strona, z asystentem, który ją przeczytał",
        Picko: "Losowanie mikołajkowe bez zbędnej złożoności.",
        Slip: "Koniec z trzymaniem paragonów w zamrażalce!",
        Konfio: "Koniec z dziesiątkami maili! Wszystko w jednym miejscu.",
        Athlo: "Zawody sportowe w nowej odsłonie.",
      } as Record<string, string>,
      facts: {
        tURL: { role: "Pierwszy projekt, w którym wykorzystałem AI · 2025" },
        Picko: { role: "Intensywnie uczyłem się Claude Code’a i UI/UX · 2025" },
        Slip: { role: "Rozwijałem swoje umiejętności UI/UX · od 2026" },
        AdLume: { role: "Współtworzyłem projekt jako inżynier AI · 2025–2026" },
        Athlo: { role: "Odpowiadam za stronę techniczną i UI/UX · od 2026 · przed premierą" },
        Konfio: {
          role: "Współzałożyciel projektu i jedyna osoba odpowiedzialna za technologię · od 2025",
        },
        OpenGrant: {
          role: "Współzałożyciel projektu odpowiedzialny za stronę techniczną · od 2025",
        },
      } as Record<string, { role: string }>,
    },
    contact: {
      title: "Porozmawiajmy",
      lead: "Każdy powód do rozmowy jest dobry.",
      list: {
        email: "E-mail",
        reply: "Odpisuję zwykle w ciągu kilku godzin.",
        copy: "Skopiuj adres e-mail",
        copied: "Skopiowano adres",
        vex: "Vex",
        vexMain: "Zapytaj mojego asystenta",
        vexLine: "Odpowie ci od razu, o każdej porze.",
        github: "GitHub",
        githubLine: "Zajrzyj do kodu moich projektów.",
      },
    },
    experience: {
      title: "Lubię, kiedy kod działa na produkcji",
      subtitle: "Mniej magii, więcej inżynierii. Choć czasem trudno odróżnić.",
      rolesTitle: "Role",
      timeline: {
        figure: "Oś czasu kariery, w skali",
        now: "teraz",
      },
      closing: {
        title: "Wspólny projekt? Jasne!",
        body: "Napisz albo najpierw zapytaj Vexa.",
        email: "Napisz do mnie",
        next: { lead: "Poza inżynierią:", label: "badania" },
      },
      dialog: {
        previous: "Poprzednia rola",
        next: "Następna rola",
        close: "Zamknij",
      },
      keyAchievements: "Kluczowe osiągnięcia",
      technologies: "Technologie",
      askVex: "Zapytaj Vexa o firmę {company}",
      askVexQuestion: "Co robił w firmie {company}?",
      error: "Nie udało się załadować danych o doświadczeniu zawodowym",
      tryAgain: "Spróbuj ponownie",
      noData: "Brak dostępnych danych o doświadczeniu zawodowym.",
    },
    academic: {
      title: "Lubię, kiedy dowód się domyka",
      educationTitle: "Lubię, kiedy trudne staje się proste",
      educationLeadLine: "Najpierw intuicja, potem dowód. Zwykle w tej kolejności.",
      subtitle:
        "Jądra ciepła od pracy licencjackiej w 2019 roku: ostre oszacowania na odcinku, stożku i podwójnym stożku. Dwa artykuły. Ostatnio algebra wewnątrz transformerów, dalej obliczenia kwantowe. Obok tego zajęcia z analizy i algebry.",
      interests: {
        title: "Zainteresowania badawcze",
        transformers: {
          title: "Co się zmienia, gdy model zaczyna uogólniać",
          stages: {
            task: "Proste zadanie",
            result: "Najpierw zapamiętywanie, potem uogólnianie",
            clue: "Matematyczny trop",
            open: "Czego jeszcze nie ustalono",
          },
          predictQuestion:
            "Model zna już wszystkie przykłady z treningu. Od którego kroku poradzi sobie także z nowymi? Przesuń znacznik na swój typ i sprawdź.",
          resultLead:
            "Po 1000 krokach model bezbłędnie rozwiązywał przykłady treningowe. Na tych samych danych, tysiąc do dwóch tysięcy kroków później, przekroczył 50% trafności także na nowych. To opóźnione uogólnienie nazywa się *grokkingiem*.",
          resultCredit: {
            before: "Układ odtwarza pracę ",
            setup: "Nandy i in. (2023)",
            between: "; nazwę wprowadzili ",
            term: "Power i in. (2022)",
            after: ".",
          },
          resultQuestion:
            "Wynik pokazuje, kiedy model zaczął radzić sobie z nowymi przykładami. Moje pytanie badawcze dotyczy tego, co zmieniło się wtedy w jego wewnętrznej strukturze.",
          paragraphs: [
            "Wyobraź sobie ucznia, który zna odpowiedzi na wszystkie ćwiczenia, ale gubi się na sprawdzianie z nowymi zadaniami. Model AI może działać podobnie. W zadaniu przypominającym dodawanie godzin na zegarze potrafi opanować przykłady, na których się uczył, a nadal mylić się przy nowych.",
            "Interesuje mnie, co zmienia się wtedy wewnątrz modelu. Czy da się opisać tę zmianę matematycznie? Jednym z tropów są wzory przypominające fale ułożone wokół okręgu. Na takim zegarze dodanie liczby oznacza przesunięcie o określoną liczbę pól. Fale pozwalają matematycznie opisać takie przesunięcia.",
            "Ilustracja pokazuje pomysł matematyczny, a nie bezpośredni obraz pracy modelu. Nanda i in. znaleźli tę strukturę w reprezentacjach sieci tego typu; w moich przebiegach widzę podobne ślady. Nie ustalono jednak, czy jej pojawienie się powoduje poprawę wyników na nowych przykładach.",
            "Prosty eksperyment nie wyjaśnia jeszcze rozumowania dużych modeli językowych, ale pozwala zadawać dokładniejsze pytania o to, jak uczą się reguł i wykorzystują je w nowych sytuacjach.",
          ],
          clock: {
            label: "Przykład objaśniający",
            figure: "Zegar 12-godzinny: 7 + 8 = 3",
            replay: "Policz jeszcze raz",
            caption:
              "Na zegarze 12-godzinnym 7\u00a0+\u00a08\u00a0=\u00a03: po dwunastej liczymy od początku. Model uczył się tego samego działania na zegarze ze 113 polami.",
          },
          chart: {
            title: "Trafność na przykładach znanych i nowych",
            predict: {
              guess: "Twój typ: krok {step}",
              marker: "Twój typ",
              check: "Sprawdź",
              drag: "Przeciągnij znacznik na wykresie",
              none: "Nie wybrano kroku",
              how: "Przeciągnij znacznik na wykresie albo przesuń go strzałkami w lewo i w prawo, potem naciśnij Enter albo Sprawdź.",
              retry: "Jeszcze raz",
              verdict: { perfect: "W punkt", almost: "Prawie", wrong: "Nie tym razem" },
              result:
                "Trafność na nowych przykładach przekroczyła 50% między krokiem {from} a {to}, we wszystkich trzech przebiegach.",
            },
            seen: "Przykłady znane z treningu",
            unseen: "Nowe przykłady",
            stepAxis: "Krok treningu",
            accuracyAxis: "Trafne odpowiedzi",
            step: "Krok",
            run: "Trening",
            caption:
              "Ten sam typ modelu trenowano trzy razy. Za każdym razem losowano jego ustawienia początkowe oraz podział par liczb: 30% służyło do nauki, a pozostałe 70% do sprawdzenia wyniku. Punkty na wykresie pokazują pomiary co 1000 kroków; odcinki jedynie je łączą.",
            stepNote: {
              same: "Krok {step}: we wszystkich trzech przebiegach trafność na przykładach treningowych i nowych wynosi {value}.",
              seenFixed:
                "Krok {step}: trafność na przykładach treningowych wynosi {seen} we wszystkich trzech przebiegach, a na nowych {unseen}.",
              bothVary:
                "Krok {step}: w trzech przebiegach trafność na przykładach treningowych wynosi {seen}, a na nowych {unseen}.",
            },
          },
          figure: {
            label: "Ilustracja zasady matematycznej",
            figure: "Liczby od 0 do 112 na okręgu i fala nad nimi",
            prompt: "Przesuń liczby i sprawdź: czy fala zmienia kształt, czy tylko położenie?",
            waves: "Liczba fal: $k = {k}$",
            add: "Dodaj do wejścia: $+{a}$",
            note: "Przesuń suwak: dodanie tej samej liczby do wejścia przesuwa falę wokół okręgu, ale nie zmienia jej kształtu. Punkty odpowiadają liczbom od 0 do 112.",
            curious: "Dla ciekawych",
            detail:
              "Fala o częstotliwości $k$ powtarza swój wzór $k$ razy wokół okręgu. Przesunięcie liczb zmienia jej fazę, czyli miejsce, od którego zaczyna się wzór. W modelu badam, czy podobne zależności pojawiają się między jego wewnętrznymi sygnałami.",
          },
        },
      },
      figure: {
        figure: "Jądro ciepła Neumanna na odcinku, w czasie",
        caption:
          "Jądro ciepła Neumanna na odcinku, $K_t(x, y)$ dla ustalonego $y$. Przesuń $t$: ciepło z jednego punktu rozchodzi się i wyrównuje do średniej, $1/π$, a razem z nim rozchodzi się pole w tle tej strony. Ostre oszacowanie ogranicza takie jądro z góry i z dołu tym samym wyrażeniem, z dokładnością do stałych. Szereg ucięto na $n = 60$.",
        play: "Uruchom dyfuzję",
        playing: "Trwa…",
        time: "czas t",
      },
      education: "Wykształcenie",
      story: {
        lead: "Przeczucie mówi „chyba”. Matematyka mówi „zawsze”.",
        contents: "Na tej stronie",
        kernels: {
          title: "Jądra ciepła",
          leadLine:
            "Jak opisać rozchodzenie się ciepła, gdy kształt przestrzeni komplikuje odpowiedź?",
          stages: {
            map: "Mapa wpływu",
            geometry: "Dlaczego sama odległość nie wystarcza?",
            sharp: "Na czym polega moja praca?",
            why: "Po co",
          },
          map: "Jądro ciepła można potraktować jak mapę wpływu. Wskazujemy, gdzie pojawia się impuls ciepła, w którym miejscu obserwujemy jego wpływ i ile czasu upłynęło. Jądro opisuje, jak silny jest ten wpływ w punkcie obserwacji. Zmieniając miejsca i czas, otrzymujemy obraz całego procesu.",
          geometry:
            "W przestrzeniach, które badam, sama odległość między miejscem impulsu a punktem obserwacji nie wystarcza. Liczy się także ich położenie względem brzegu lub wierzchołka. Dlatego nawet przy tej samej odległości wpływ ciepła może być inny. Z czasem zmienia się też znaczenie tych szczególnych miejsc. To utrudnia znalezienie ograniczeń, które działają dla różnych miejsc i chwil.",
          sharp:
            "W moich pracach wyznaczam ograniczenie dolne i górne wartości jądra ciepła. Oba mają tę samą postać i różnią się jedynie stałym mnożnikiem. To właśnie oznacza, że oszacowanie jest *ostre*: pokazuje właściwą zależność od położenia i czasu, choć nie podaje dokładnej wartości jądra.",
          whyBefore:
            "Takie ograniczenia są przydatne, gdy dokładna postać jądra jest zbyt skomplikowana, by łatwo z niej korzystać. Pomagają dalej badać matematyczne modele dyfuzji i stawiać nowe pytania. Jedno z nich rozwijam w części „",
          whyLink: "Od jądra ciepła do algorytmu kwantowego",
          whyAfter: "”.",
          influence: {
            label: "Mapa wpływu na stożku",
            figure:
              "Schemat stożka z miejscem ogrzania i punktem obserwacji; ciepło rozchodzi się wraz z czasem",
            impulse: "miejsce ogrzania",
            observation: "punkt obserwacji",
            tip: "wierzchołek",
            boundary: "brzeg",
            time: "Czas od ogrzania",
            start: "tuż po ogrzaniu",
            later: "później",
            caption:
              "Przesuń suwak i zobacz, jak ciepło rozchodzi się od ogrzanego miejsca w stronę punktu obserwacji.",
          },
          bounds: {
            label: "Schemat ostrego oszacowania",
            figure:
              "Ograniczenie dolne i górne o tym samym kształcie; dokładna wartość jądra leży między nimi",
            yAxis: "siła wpływu",
            xAxis: "odległość od miejsca ogrzania",
            upper: "ograniczenie górne",
            between: "wartość jądra leży między ograniczeniami",
            lower: "ograniczenie dolne",
            time: "Czas",
            start: "wcześniej",
            later: "później",
            caption:
              "Wartość jądra leży między ograniczeniem dolnym a górnym. Oba zmieniają się według tej samej reguły i różnią się tylko stałym mnożnikiem.",
          },
        },
        transformers: {
          question:
            "Co proste zadania matematyczne mogą zdradzić o tym, jak modele uczą się radzić sobie z nowymi zadaniami?",
        },
        jacobiQuantum: {
          title: "Od jądra ciepła do algorytmu kwantowego",
          leadLine:
            "Wyobraź sobie długi pręt. Jeden jego fragment jest gorący, a reszta chłodniejsza. Czy komputer kwantowy może obliczyć, ile ciepła znajdzie się po chwili w zaznaczonym obszarze A, bez symulowania całego pręta?",
          introTitle: "Jedna liczba, nowe pytanie",
          intro:
            "Nie można po prostu wyciąć obszaru A. Ciepło z innych części pręta, także odległych, może zmienić wynik. Chcę ustalić, jak duże otoczenie trzeba uwzględnić, aby błąd spowodowany pominięciem reszty mieścił się w przyjętym progu.",
          clueTitle: "Matematyczna wskazówka",
          clueBeforePaper:
            "Pręt pomaga wyobrazić sobie problem. W badaniu zaczynam od matematycznego modelu rozchodzenia się ciepła zwanego modelem Jacobiego. Jądro ciepła działa w nim jak mapa wpływów: opisuje, jak silnie jedno miejsce oddziałuje po pewnym czasie na drugie. ",
          paper: "Oszacowania Nowaka, Sjögrena i Szarka",
          clueAfterPaper:
            " podpowiadają, że gdy od rozpoczęcia procesu minęło niewiele czasu, wpływ szybko maleje wraz z odległością od A. Przesuń suwak, aby zobaczyć tę intuicję na ilustracji.",
          figure: {
            label: "Schemat rozchodzenia się ciepła",
            figure:
              "Poziomy pręt: ciepło z początkowo gorącego fragmentu rozchodzi się na boki i z czasem dociera do obszaru A",
            hot: "początkowo gorący",
            region: "A",
            time: "Czas od rozpoczęcia",
            start: "początek",
            later: "później",
            states: {
              concentrated: "Ciepło jest skupione w rozgrzanym fragmencie.",
              spreading: "Ciepło rozchodzi się na boki, a jego skupienie słabnie.",
              reached: "Ciepło dociera także do A.",
            },
            caption:
              "Przesuń suwak i zobacz, jak ciepło z rozgrzanego fragmentu dociera do obszaru A. Choć interesuje nas tylko A, na wynik wpływa także to, co dzieje się w innych częściach pręta.",
          },
          proofTitle: "Co trzeba jeszcze udowodnić",
          proof:
            "Mały wpływ odległych miejsc to dopiero pierwsza wskazówka. Trzeba jeszcze wykazać, że obliczenia prowadzone na mniejszym obszarze dają niemal ten sam wynik w A i że błąd da się ograniczyć. Dopiero potem można zbudować algorytm kwantowy i policzyć cały koszt jego działania, od przygotowania danych po odczyt odpowiedzi. Porównanie z najlepszymi metodami klasycznymi pokaże, czy takie podejście rzeczywiście pomaga.",
        },
        teaching: {
          title: "Dydaktyka",
          quote:
            "Jeśli nie potrafisz wyjaśnić czegoś studentowi pierwszego roku, to znaczy, że sam tego nie rozumiesz.",
          quoteSource: "za Richardem Feynmanem",
          themesLabel: "Co zauważyli studenci",
          themes: [
            { key: "clarity", label: "Tłumaczy prosto" },
            { key: "prepared", label: "Przygotowany" },
            { key: "beyond", label: "Wychodzi poza program" },
            { key: "friendly", label: "Przyjazna atmosfera" },
          ],
          evidence: {
            "1": {
              clarity: ["Zrozumiale tłumaczy zagadnienia"],
              prepared: ["jest zawsze przygotowany do zajęć i rzetelnie do nich podchodzi"],
            },
            "2": {
              friendly: ["przyjemne były te zajęcia", "bardzo życzliwy i miły"],
              beyond: [
                "jak to co robimy przekłada się na informatykę i gdzie tych zagadnień się używa",
              ],
            },
            "3": {
              friendly: ["bardzo miły, chętny do pomocy", "w przyjaznej atmosferze"],
              prepared: ["kompetentny"],
              clarity: ["tłumaczyć zagadnienia w przystępny sposób"],
            },
            "4": {
              friendly: ["Niesamowicie uprzejmy"],
              prepared: ["z dużą wiedzą"],
              beyond: ["ciekawe zadania dodatkowe"],
            },
            "5": {
              clarity: ["w prosty sposób wyjaśnia skomplikowane zagadnienia"],
              friendly: ["przyjazna atmosfera na zajęciach"],
            },
            "6": {
              friendly: [
                "bardzo sympatycznego prowadzącego",
                "jednym z najprzyjemniejszych w tym semestrze",
              ],
            },
          } as Record<string, Record<string, string[]>>,
        },
        closing: {
          title: "Masz pytanie o studia albo zajęcia?",
          body: "Napisz albo najpierw zapytaj Vexa.",
          email: "Napisz do mnie",
          next: { lead: "Teoria w działaniu:", label: "z warsztatu" },
        },
        researchClosing: {
          title: "Porozmawiamy o nauce?",
          body: "Napisz albo najpierw zapytaj Vexa.",
          email: "Napisz do mnie",
          next: { lead: "Skąd to się wzięło:", label: "studia i dydaktyka" },
        },
      },
      eyebrow: "Badania · doktorat",
      stack: "Publikacje ułożone w stos",
      established: "Co pokazuje",
      author: "Autor",
      authors: "Autorzy",
      status: { published: "Opublikowano", preprint: "Preprint" },
      more: "Więcej",
      less: "Mniej",
      publicationSummaries: {
        "https://doi.org/10.1016/j.jat.2023.105921":
          "Na stożku brzeg i wierzchołek zmieniają sposób, w jaki rozchodzi się ciepło. Jak oszacować, na ile ogrzanie jednego punktu wpływa na temperaturę w innym? W tej pracy wyznaczamy oszacowania z dołu i z góry, osobno dla stożka i dla jego powierzchni.",
        "https://arxiv.org/abs/2411.15793":
          "Wyobraź sobie dwa stożki zetknięte wierzchołkami. Jak silnie ciepło z jednego punktu wpływa na inny w takim modelu? W tej pracy wyznaczam oszacowania, które na to odpowiadają. Badam też kształty pokrewne i wskazuję przypadki, w których metoda nie daje jeszcze pełnej odpowiedzi.",
      } as Record<string, string>,
      educationHighlights: {
        "2016-10-03": {
          label: "Wydział Matematyki PWr",
          text: "9. miejsce w konkursie TOP 10 na najlepszego absolwenta studiów I stopnia (2019)",
          href: "https://wmat.pwr.edu.pl/o-wydziale/aktualnosci/laureaci-konkursu-top-10-2019-10960.html",
        },
        "2022-10-03": {
          label: "Szkoła Doktorska PWr",
          text: "Średnia ocen 4,75",
        },
        "2019-10-03": {
          label: "Nagroda PTM",
          text: "II miejsce w Konkursie im. Józefa Marcinkiewicza na najlepszą pracę magisterską z matematyki w Polsce",
          href: "https://www.mat.umk.pl/nauka/konkurs-im-jozefa-marcinkiewicza/",
        },
      } as Record<string, { label: string; text: string; href?: string }>,
      degreeSteps: "Stopnie",
      heatHint: "Kliknij figurę, by ją ogrzać",
      newTab: "(otwiera się w nowej karcie)",
      domainNames: {
        "torus-interval": "Torus i odcinek",
        cone: "Stożek",
        revolution: "Bryła obrotowa",
        "double-cone": "Stożek podwójny",
      },
      educationHeadlines: {
        "2016-10-03": "Równanie ciepła na torusie i odcinku",
        "2019-10-03": "Równanie ciepła na stożku",
        "2022-10-03": "Ostre oszacowania jąder ciepła Jacobiego",
      } as Record<string, string>,
      advisor: "Promotor",
      researchAreas: "Obszary badawcze",
      publications: "Publikacje",
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
