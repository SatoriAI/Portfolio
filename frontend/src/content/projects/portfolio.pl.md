---
title: Portfolio
slug: portfolio
period: 2025-07 – ongoing
status: live
role: Samodzielnie: backend, frontend, CI i wdrożenie oraz system identyfikacji wizualnej
context: personal
stack: Python, Django, PostgreSQL, pgvector, React, TypeScript, Vite, Tailwind CSS, shadcn/ui, OpenAI, LangChain, Tigris, Docker, Railway, Cloudflare
demo: https://dawidhanrahan.com
repository: https://github.com/SatoriAI/Portfolio
summary: Moja dwujęzyczna (PL/EN) strona dla osób, które rozważają mnie do roli w backendzie lub AI albo do projektu. Pokazuje doświadczenie na proporcjonalnej osi czasu, badania z interaktywnymi ilustracjami i dydaktykę z opiniami studentów. Z przeglądarki można sprawdzić, czy serwer każdego projektu odpowiada, i zapytać Vexa, asystenta, który zna treść strony.
---

# Portfolio

## Okres i status

- Frontend powstał 7 lipca 2025 r. jako szkielet wygenerowany w Lovable. Backend ruszył 29 lipca 2025 r. Pierwszy commit Dawida pod jego nazwiskiem pochodzi z 6 września 2025 r.
- Przez mniej więcej rok frontend miał osobne repozytorium. 9 września 2026 r. jego historię przeniesiono do katalogu `frontend/` i połączono z backendem w jednym repozytorium.
- Najważniejsze daty na gałęzi `main`: potok RAG dla Vexa (13 listopada 2025 r.), usunięcie biblioteki Stanza (20 listopada 2025 r.), przeniesienie plików do magazynu zgodnego z S3 (26 sierpnia 2026 r.), połączenie repozytoriów i przebudowa CI (9 września 2026 r.).
- Status: działa i jest utrzymywana. Obie części wdrażane są na Railway.
- Pod dawidhanrahan.com działa wciąż poprzednia wersja. Nowa odsłona powstaje na gałęzi `feature/memorable-portfolio`: 25 commitów, których nie ma w `main`, i wiele niezatwierdzonych zmian. Ostatni commit: 25 września 2026 r.
- Pierwsze wdrożenie produkcyjne: 16 listopada 2025 r., jednocześnie backendu i frontendu (według rejestru wdrożeń na GitHubie). Wcześniej obie części trafiały tylko na środowisko testowe: backend od 5 września 2025 r., frontend od 20 września 2025 r. Najpewniej właśnie od 16 listopada 2025 r. strona działa pod adresem dawidhanrahan.com. Nową odsłonę Dawid chce wdrożyć jak najszybciej, docelowo w listopadzie 2026 r.

## Rola i kontekst

- Projekt osobisty: README opisuje stronę jako osobiste portfolio Dawida Hanrahana.
- Historia git obejmuje 126 commitów: 77 autorstwa Dawida Hanrahana, 25 konta „SatoriAI” (prywatnego konta Dawida na GitHubie, właściciela repozytorium), 23 bota Lovable (pierwszy szkielet frontendu) i 1 Dependabota. Innych autorów nie ma.
- SatoriAI to prywatne konto Dawida na GitHubie, założone 17 października 2020 r. Z tego konta pochodzą commit początkowy z 29 lipca 2025 r. (tylko .gitignore, LICENSE i jednolinijkowe README utworzone przez GitHuba) oraz scalenia pull requestów. Poza botami nie ma innych autorów, więc projekt jest w całości pracą Dawida.
- Repozytorium obejmuje backend (API w Django, panel administracyjny, potok wyszukiwania dla Vexa), frontend w React, system identyfikacji wizualnej, CI i wdrożenie na Railway. Wygenerowany szkielet dotyczy tylko frontendu. Bot Lovable zrobił 23 commity: szkielet vite_react_shadcn_ts, pierwszą treść, pasek nawigacji i przełącznik trybu jasnego i ciemnego (7–10 lipca 2025 r.) oraz pięć poprawek kolorów trybu jasnego (4 września 2025 r.). Cała dalsza praca nad frontendem, od 6 września 2025 r., to praca Dawida. Backend nie ma wygenerowanego kodu: cały jego kod (65 plików) trafił do repozytorium w PR #1 13 września 2025 r. Według `git blame` katalogu `frontend/src` na `main` 5890 linii pochodzi od Dawida Hanrahana, 384 z konta SatoriAI, a 3534 od bota, w tym 2731 w komponentach shadcn/ui (`components/ui`). Poza nimi kod bota to ok. 15% (803 z ok. 5440 linii).

## Krótkie podsumowanie

Moja dwujęzyczna (PL/EN) strona dla osób, które rozważają mnie do roli w backendzie lub AI albo do projektu. Pokazuje doświadczenie na proporcjonalnej osi czasu, badania z interaktywnymi ilustracjami i dydaktykę z opiniami studentów. Z przeglądarki można sprawdzić, czy serwer każdego projektu odpowiada, i zapytać Vexa, asystenta, który zna treść strony.

## Problem

Strona nie powstała dlatego, że czegoś brakowało. To kolejna warstwa, na której Dawid pokazuje swoje umiejętności i zainteresowania.

Treść strony wskazuje odbiorców: osoby, które szukają kogoś do roli backendowej lub AI albo do projektu. Strona łączy dwie role Dawida: inżyniera backendu w Pythonie i doktoranta z analizy harmonicznej. Jej deklarowany cel to umożliwić odwiedzającym sprawdzenie projektów na żywo i zobaczenie, jak działają w praktyce.

## Jak to działa dla użytkownika

Poniższy opis dotyczy nowej odsłony, która nie jest jeszcze wdrożona. Obecna wersja na dawidhanrahan.com ma tylko trzy podstrony: stronę główną, doświadczenie i część akademicką.

1. **Strona główna.** Otwiera ją zdanie sformułowane jak twierdzenie: „Mathematician by training, engineer by trade”. Trzy linijki „dowodu” prowadzą do wykształcenia, doświadczenia i projektów. Obok jest pole, w którym można od razu zadać pytanie Vexowi.
2. **Projekty.** Każdy projekt działa pod własnym adresem i ma zrzut ekranu, listę technologii oraz link do kodu albo informację, że kod jest prywatny. Przycisk „Sprawdź na żywo” sprawia, że przeglądarka odwiedzającego łączy się z adresem projektu. Wynik to czas odpowiedzi w milisekundach albo brak odpowiedzi. Po 8 sekundach sprawdzanie się kończy. Pokazuje ono tylko, czy serwer odpowiedział, a nie czy strona działa poprawnie. Przy każdym projekcie można też zapytać o niego Vexa.
3. **Z warsztatu.** Krótkie teksty trzech rodzajów: ilustracja, z produkcji, dowód. Każdy ma szacowany czas czytania. Tekst dostępny w jednym języku wyświetla się w drugim z adnotacją, bez tłumaczenia maszynowego. Jedyny tekst w repozytorium to szkic, a szkice nie trafiają na stronę, więc ta sekcja jest na razie pusta.
4. **O mnie i kontakt.** Tekst o Dawidzie prowadzi do trzech podstron. W kontakcie jest e-mail, link do GitHuba i rozmowa z Vexem.
5. **Doświadczenie.** Oś czasu w skali z rolami w firmach Nokia, PeakData, Xperi i CloudFerro, z osiągnięciami i technologiami dla każdej. O każdą firmę można zapytać Vexa.
6. **Badania.** Interaktywne ilustracje z suwakami i przyciskiem odtwarzania: rozchodzenie się ciepła na odcinku w czasie, „mapa wpływu” na stożku, wykres dokładności modelu (odwiedzający najpierw zgaduje, w którym kroku treningu model zaczyna radzić sobie z nowymi przykładami, a potem to sprawdza), przykład z zegarem i fala na okręgu, którą można przesuwać. Na tej stronie jest też lista opublikowanych prac.
7. **Wykształcenie.** Ukończone studia i cytaty studentów o zajęciach prowadzonych przez Dawida.
8. **Vex.** Czat dostępny na każdej podstronie. Odpowiada na podstawie treści strony, a odpowiedź pojawia się w miarę pisania. Proponuje pytania na start, na przykład o doktorat. Jeśli przez 30 sekund nic nie odpowie, pokazuje błąd i podsuwa kontakt mailowy.
9. **Język.** Przełącznik PL/EN; przeglądarka zapamiętuje wybór.

## Opis techniczny

Jedno repozytorium, dwie części. Każda ma własne narzędzia, Dockerfile i konfigurację Railway.

**Backend** (Python 3.13, Django 5.2, Django REST Framework, PostgreSQL z pgvector, uv):

- Trzy aplikacje domenowe: `work` (umiejętności, projekty, doświadczenie), `university` (uczelnie, publikacje, opinie), `vex` (rozmowy, dokumenty, konfiguracja promptu) oraz `utils` na wspólne funkcje pomocnicze.
- Cała treść portfolio jest w bazie danych i edytuje się ją w panelu administracyjnym Django. Tłumaczenia obsługuje django-parler w bazie danych. Frontend nie ma biblioteki i18n, tylko przekazuje wybrany język w nagłówku `Accept-Language`.
- API: `/api/work/`, `/api/university/`, `/api/vex/`, schemat OpenAPI z dokumentacją Redoc, `/healthcheck/`.

**Jak przebiega pytanie do Vexa:**

1. Widżet wysyła POST na `/api/vex/chat/` i dostaje klucz sesji oraz token CSRF.
2. Otwiera `EventSource` na `/api/vex/chat/stream/` z pytaniem, kluczem sesji i językiem.
3. Backend wysyła zdarzenie `received`, potem strumieniuje odpowiedź fragmentami i kończy zdarzeniem `finished`. Każdy wyjątek zamienia się w zdarzenie `error`.
4. Łańcuch LangChain jest budowany raz na proces. Łączy kontekst, prompt, model czatu OpenAI i historię rozmowy, zapisywaną w Postgresie osobno dla każdej sesji.
5. Kontekst pochodzi z dwóch źródeł: wyszukiwania podobieństwa w pgvector (domyślnie 6 fragmentów, filtrowanych według języka) oraz bezpośredniego odczytu tabel. Pytanie jest dzielone na słowa i porównywane ze słownikiem słów kluczowych dla PL i EN. Przy trafieniu odczytywanych jest do 10 wierszy z odpowiedniej tabeli (umiejętności, projekty, doświadczenie, uczelnie, publikacje, opinie).
6. Konfigurację edytuje się w panelu: treść promptu osobno dla każdego języka, a model i temperaturę wspólnie dla wszystkich języków. Bez takiego rekordu obowiązuje `gpt-4o-mini` z temperaturą 0,5.

**Wczytywanie dokumentów.** Akcja w panelu administracyjnym dzieli przesłany plik na fragmenty po 1200 znaków (z zakładką 150), oznacza je językiem, dodaje do kolekcji w pgvector (embeddingi `text-embedding-3-small`) i oznacza dokument jako wczytany, żeby nie trafił tam drugi raz.

**Frontend** (React 18, TypeScript, Vite, Tailwind, shadcn/ui, Vitest):

- Trasy w nowej odsłonie: `/`, `/experience`, `/research` (stary adres `/academic` przekierowuje), `/education`, `/workshop`, `/workshop/:slug`. Wszystkie poza stroną główną ładują się leniwie.
- Większość kodu widżetu czatu zabezpiecza strumień: naprawia Markdown pocięty między fragmentami przy każdym renderowaniu, a 30 sekund ciszy traktuje jako awarię.
- Teksty z warsztatu to pliki Markdown wczytywane przy budowaniu. Szkice (`*.draft.md`) czyta tylko serwer deweloperski.
- Ilustracje do badań mają czystą matematykę wydzieloną do modułów z testami. Motyw HeatField to suma jąder ciepła liczona na canvasie. Reaguje na kursor i zatrzymuje się przy `prefers-reduced-motion`.
- Wygląd wyznacza system identyfikacji „Binary Axis” w wersji 5.1, wersjonowany w repozytorium: jedna jasna paleta, fonty Manrope i IBM Plex Mono, kolumna 1160 px i zasady pisania.
- Dokumenty projektów w `frontend/src/content/projects/` mają zasilać stronę główną i Vexa. Na razie żaden kod ich nie czyta. Sposób, w jaki trafią do Vexa, nie jest jeszcze ustalony; możliwe, że przez panel administracyjny.

## Decyzje inżynierskie

- **Wyszukiwanie hybrydowe.** Wyszukiwanie wektorowe uzupełniają wiersze czytane prosto z tabel, więc pytania o umiejętności czy projekty dostają aktualną treść z bazy, a nie tylko z przesłanych dokumentów. Rozważanym podejściem była sama baza wektorowa. Na przyszłość warto przyjrzeć się też graph-RAG.
- **Stanza zastąpiona tokenizacją wyrażeniem regularnym**, ze względu na wydajność. Według tytułu commita poprawiło to znacząco wydajność RAG. Pomiarów nie zapisano.
- **Prompt i model w bazie danych**, edytowane w panelu zamiast zapisane w kodzie. Prompt jest osobny dla każdego języka, a model i temperatura są wspólne.
- **SSE przez GET (EventSource)** z dwuetapowym otwarciem: najpierw POST po klucz sesji, potem strumień.
- **Pliki przeniesione z wolumenu Railway do prywatnego bucketu zgodnego z S3 (Tigris).** Wolumen nie przetrwa przenosin między projektami i nie da się go współdzielić między usługami. Pliki są udostępniane przez podpisane adresy URL. Nagłówki ACL są wyłączone, bo Tigris je odrzuca. CI jawnie ustawia `USE_S3`, zamiast podawać fikcyjne dane bucketu, więc produkcja bez konfiguracji bucketu zgłosi błąd od razu. Przy tej okazji wyszło na jaw, że od Django 5.1 ustawienie `STATICFILES_STORAGE` było ignorowane, a skompresowane pliki statyczne Whitenoise nie działały na produkcji. Ustawienie przeniesiono do `STORAGES`.
- **Historia frontendu zachowana przy łączeniu repozytoriów.** Zamiast kopiować kod jednym commitem, historię przepisano do podkatalogu (`git filter-repo`) i scalono. Dzięki temu zostało 71 commitów historii. Koszt: dwa commity początkowe i scalenie przez merge, nie squash.
- **Testy CI na obrazie pgvector/pgvector:pg17 zamiast postgres:17-alpine.** Na zwykłym obrazie każdy test pgvector mógł padać tylko w CI, więc żadnego nie dało się napisać. Dodany test zapytania o odległość nie przechodzi na starym obrazie, a przechodzi na nowym.
- **CI frontendu: jedno zadanie zamiast trzech w łańcuchu.** Każde zadanie zajmowało ok. 15 s na przygotowanie przy 2–9 s właściwej pracy. Backend celowo zachowuje równoległe pylint i mypy: 82 s wobec 97 s po połączeniu, a w publicznym repozytorium minuty Actions są darmowe. Usunięto filtr `branches:`, bo pomijał piętrowe PR-y. Dodano anulowanie nieaktualnych (zastąpionych nowszymi) przebiegów, 10-minutowe limity czasu i tokeny tylko do odczytu.
- **Akcje przypięte do SHA commitów**, aktualizowane przez Dependabota.
- **Każde polecenie zdefiniowane raz w Makefile.** CI wywołuje te same cele, więc lokalne polecenia i CI nie mogą się rozjechać.
- **Node 24 do budowania.** Node 18 nie jest już wspierany, a okres utrzymania Node 22 kończy się w kwietniu 2027 r.
- **Naprawa Markdownu omija bloki kodu.** Bloki są na czas naprawy zastępowane znacznikami. To usunęło dwa błędy zapisane wcześniej jako oczekiwanie porażki w testach: zdublowany pusty blok kodu i listy rozbijane wewnątrz kodu. Test sprawdza, że funkcja jest idempotentna, bo działa przy każdym renderowaniu.
- **Porządki po Lovable** i pierwsze lintowanie aplikacji `vex`. Wzorzec `ignore-paths` w pylint był odczytywany jako wyrażenie regularne i niczego nie wykluczał.
- **Sprawdzanie na żywo z przeglądarki odwiedzającego**, w trybie `no-cors`. Strona mówi wprost, co sprawdza: tylko osiągalność i czas, i z czyjej przeglądarki. Liczy się to, jak stronę widzi odwiedzający, a nie serwer.
- **Szkice wykluczone z builda** już przy imporcie, więc nieopublikowany tekst nie wycieknie w paczce. Publikacja to zmiana nazwy pliku.
- **Bez ciemnego motywu**, bo system identyfikacji go nie definiuje.
- **HeatField świadomie łamie zasadę ruchu** z systemu identyfikacji (dozwolone jest tylko uniesienie o 8 px przy wejściu). Wyjątek jest opisany w dokumentacji.

## Działanie na produkcji

- **Hosting.** Backend i frontend to osobne usługi w jednym projekcie Railway, budowane z tego repozytorium.
- **Backend.** Budowany z Dockerfile. Przed wdrożeniem uruchamiane są migracje. Start: kompilacja tłumaczeń, `collectstatic`, potem gunicorn z 2 workerami i limitem 120 s. Railway sprawdza `/healthcheck/`.
- **Frontend.** Wieloetapowy build na Node 24. Adres API i tryb danych testowych są wpisywane przy budowaniu, więc ich zmiana wymaga przebudowy. Paczkę serwuje `serve`.
- **Pliki.** Media trafiają do prywatnego bucketu Railway (Tigris) i są udostępniane przez podpisane adresy URL. Pliki statyczne serwuje Whitenoise.
- **CI.** Trzy workflowy GitHub Actions, uruchamiane tylko dla zmienionej części: backend (lint, typy, testy na pgvector z progiem pokrycia 85%), frontend (formatowanie, testy, lint, build) i higiena (Lefthook). Pokrycie trafia do Codecov.
- **Lekcja z wdrożeń.** Ścieżka do pliku konfiguracji Railway liczy się od katalogu głównego repozytorium, a nie od katalogu usługi. Zła ścieżka kończy wdrożenie błędem „service config not found”, zanim zacznie się build.
- **Tryb awarii.** Vex potrzebuje środków na koncie OpenAI. Bez nich strumień się otwiera, ale zwraca błąd. Reszta strony działa normalnie.
- **Utrzymanie.** Poza health checkiem Railway nie ma monitoringu technicznego; Dawid śledzi liczbę wejść na stronę. Koszt utrzymania to kilka dolarów miesięcznie, łącznie z OpenAI. Dawid nie wie o żadnych incydentach. Na produkcji czat korzysta z modelu GPT-Luna (OpenAI).

## Wyniki

Rozmów z Vexem są już setki. Dawid śledzi liczbę wejść na stronę, ale jej nie podaje. Danych o dostępności nie ma.

## Ograniczenia i dalsze kroki

- Vex nie odpowiada bez klucza OpenAI ze środkami na koncie.
- Treść jest w bazie danych, a nie w repozytorium. Nowa instalacja pokazuje pustą stronę, bo nie ma danych startowych.
- Testy frontendu sprawdzają tylko logikę. Brak testów komponentów i testów end-to-end.
- Brak ciemnego motywu oraz kolorów dla sukcesu i błędu. System identyfikacji odkłada je na później.
- Nowa odsłona nie jest wydana: 25 commitów poza `main`, wiele niezatwierdzonych zmian, a jedyny tekst z warsztatu to szkic.
- Wczytywanie przesłanych plików do Vexa nie działa z magazynem S3 (wniosek z lektury kodu, nie z uruchomienia). Akcja odczytuje plik spod ścieżki na dysku (`file.path`), a backend S3 zgłasza wtedy `NotImplementedError`. Produkcja domyślnie korzysta z S3, więc wczytanie przesłanego pliku zakończy się tam błędem. Dokumenty podane tylko jako adres URL wczytują się normalnie.
- Dalsze plany: Dawid chce skupić się na sekcji „Z warsztatu” i wykorzystać ją do popularyzowania nauki, przede wszystkim matematyki.
