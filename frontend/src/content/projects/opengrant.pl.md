---
title: OpenGrant
slug: opengrant
period: 2025-02 – ongoing (Grant-Smith: 2026-07 – ongoing)
status: live (open-grant.com: live; Grant-Smith: pre-launch)
role: CTO firmy OpenGrant; solo przy Grant-Smith: backend, frontend, potoki AI, CI, dokumentacja
context: commercial
stack: Python, Django, Celery, PostgreSQL, pgvector, Redis, React, Vue.js, TypeScript, Vite, Tailwind CSS, Google Gemini, LangGraph, LangChain, Google Cloud, Docker, Caddy, Vercel
demo: https://www.open-grant.com
repository: private
summary: OpenGrant pomaga amerykańskim firmom badawczo-rozwojowym znaleźć federalne granty i przygotować wnioski o dofinansowanie. Na podstawie dostarczonych dokumentów platforma dopasowuje grant do firmy. Po zaakceptowaniu propozycji przez klienta agent AI tworzy wniosek, który jest dostarczany klientowi. Platforma przygotowała już ponad 100 wniosków grantowych, przetwarzając miliardy tokenów.
---

# OpenGrant

## Okres i status

Pod nazwą OpenGrant działają trzy części:

- **Strona open-grant.com.** Działa publicznie i jest hostowana na Vercelu. Oferuje znalezienie grantów badawczo-rozwojowych i przygotowanie wniosku przez zespół OpenGrant.
- **Grant Flow.** Starsza aplikacja operacyjna. Pierwszy commit: 1 lutego 2025 r. Kod źródłowy i GitLab CI/CD doszły 17 lutego 2025 r., ostatni commit pochodzi z 5 sierpnia 2026 r. Nadal działa na produkcji i spełnia swoje zadanie, ale ma słaby interfejs i UX. Dlatego powstaje nowe rozwiązanie z porządnym frameworkiem frontendowym.
- **Grant-Smith.** Przepisanie Grant Flow od nowa. Pierwszy commit: 8 lipca 2026 r., ostatni: 30 września 2026 r., łącznie 291 commitów na głównej gałęzi. Status według README: faza 0, w aktywnym rozwoju. Grant-Smith nie jest wdrożony: nie ma ani środowiska testowego, ani produkcyjnego.

Plan przepisania powstał 2 czerwca 2026 r. Zakłada stopniowe zastępowanie starej aplikacji: Grant Flow działa, dopóki każda jej część nie dostanie następcy. Grant-Smith ma zostać wdrożony jak najszybciej, prawdopodobnie około listopada 2026 r.

## Rola i kontekst

- **OpenGrant to własna firma Dawida.** Według polityki prywatności strony operatorem jest OpenGrant Inc. Rola Dawida w firmie: CTO.
- **Grant-Smith to praca jednej osoby.** Co najmniej 287 z 291 commitów jest autorstwa Dawida. Pozostałe to aktualizacje zależności od Dependabota i kilka commitów zapisanych pod innym kontem.
- **Zakres Dawida w Grant-Smith:** backend (Django, DRF), frontend (React, TypeScript), potoki AI, bramka CI i dokumentacja. Kod pisał z pomocą asystenta AI do programowania. Plan rozwoju również współtworzył.
- **Starsze części** (Grant Flow, strona marketingowa, usługa Observo) nie mają historii w gicie. Zbudował je sam Dawid; ich kod był hostowany prywatnie.
- **Dla kogo jest konsola.** Dla operatorów wewnętrznych i zaufanych osób z firm klientów. Rejestracja wyłącznie na zaproszenie.
- **Strona open-grant.com** przedstawia komercyjną usługę prowadzoną przez „zespół OpenGrant”.

## Krótkie podsumowanie

OpenGrant pomaga amerykańskim firmom badawczym znaleźć federalne granty na B+R i przygotować wnioski. Publiczna strona na podstawie opisu poleca pasujące programy z maksymalną kwotą każdego z nich, a gdy nic nie pasuje, mówi to wprost. Grant-Smith, wewnętrzna konsola w budowie, składa wniosek z udokumentowanych faktów i oznacza każdą liczbę bez źródła.

## Problem

**Firmy szukające finansowania.** Zespoły badawcze i małe firmy muszą najpierw znaleźć granty, do których się kwalifikują, a potem napisać wnioski. Według strony na badania i rozwój w małych firmach 11 agencji federalnych przeznacza ponad 4 mld dolarów rocznie, a kwalifikowalność zależy od dziedziny i misji agencji. To dane o rynku, nie wynik produktu.

**Osoby przygotowujące wnioski.** Samo pisanie to około 20% pracy nad wnioskiem. Reszta to:

- ustalenie, o co właściwie się wnioskuje;
- pogodzenie materiałów źródłowych, które sobie przeczą;
- ustalenie, które fakty są prawdziwe i skąd pochodzą;
- wykazanie, że wniosek spełnia wymagania.

Poprzednie narzędzie zajmowało się prawie wyłącznie tymi 20%. Przechodziło od „firmy” od razu do „szkicu odpowiedzi”. Nie miało kroku definiującego projekt, nie obsługiwało załączników, terminów ani budżetów i nie znało pojęcia gotowego, złożonego pakietu.

Grant-Smith ma zapobiec jednemu: wnioskowi, który jest pięknie napisany i z pełnym przekonaniem błędny. Przykład z testu: zapytana o wymagania ogłoszenia, AI oznaczyła pewien element jako wymagany, choć ogłoszenie go zakazuje. Zakaz trafił tylko do pola z notatkami.

## Jak to działa dla użytkownika

**Strona open-grant.com (publiczna)**

1. Odwiedzający trafia na stronę główną i klika „Start Eligibility Check”.
2. Wkleja krótki opis projektu albo podaje adres swojej strony, a opis uzupełnia się sam.
3. Może odpowiedzieć na kilka pytań o kontekst. Strona zaznacza, że nie zawężają one wyników.
4. Dostaje listę najlepiej pasujących programów z maksymalną kwotą i kategoriami. Podsumowanie można pobrać jako PDF.
5. Jeśli nic nie pasuje, strona to mówi. Można poprawić opis albo obejrzeć dopasowania o niskiej pewności.
6. Dalej może umówić konsultację z ekspertem przez Calendly albo zostawić e-mail i w ciągu 2–3 dni roboczych dostać bezpłatne, jednostronicowe zarysy dla każdego grantu.
7. Strona ma też listę grantów, objaśnienie programu SBIR, opis obszarów technologii, FAQ i politykę prywatności.

**Konsola Grant-Smith (niewdrożona)**

1. Operator loguje się z zaproszenia. Główne sekcje: pulpit, klienci, projekty i granty. W ustawieniach są zakładki „AI” i „House standards” oraz zmiana rozmiaru tekstu.
2. Operator prowadzi firmy klientów i wspólny katalog grantów. Granty może importować z pliku CSV.
3. Projekt to jedna firma starająca się o jeden grant. Ma pięć etapów, a każdy pokazuje, czyj jest ruch: systemu czy operatora.
   1. **Czego wymaga wniosek** (system). System czyta ogłoszenie i wypisuje, co wniosek musi zawierać, czego nie wolno i gdzie właściwa reguła znajduje się w innym dokumencie. Gdy odczyty się różnią, decyduje człowiek.
   2. **Co deklarujecie** (operator). Operator zatwierdza problem, cele i granice tego, co wolno twierdzić. Bez tej zgody nic dalej nie powstaje.
   3. **Dowody i wyczytane z nich fakty** (operator). Operator wgrywa dokumenty. System proponuje fakty po jednym i żadnego sam nie zapisuje. Operator każdy przyjmuje albo odrzuca.
   4. **Odpowiedzi** (system). System pisze odpowiedź na każde pytanie grantowe z zapisanych faktów i je cytuje.
   5. **Co dzieli wniosek od złożenia** (operator). System sprawdza pakiet i wypisuje, czego nie może potwierdzić. Operator każdą pozycję naprawia albo uchyla z uzasadnieniem. Każde uchylenie jest podpisane jego nazwiskiem.
4. Dwie decyzje zawsze należą do człowieka: zatwierdzenie definicji projektu (z dołączoną odpowiedzią klienta jako dowodem) i uchylenie zastrzeżenia na końcowej kontroli.

## Opis techniczny

**Grant-Smith** to modularny monolit w jednym repozytorium. Backend dzieli się na aplikacje domenowe:

- `customers`: firmy, projekty, dowody (notatki i pliki), dopasowywanie grantów do klientów;
- `grants`: katalog, wczytywanie ogłoszeń, osobna tabela wektorów;
- `claims`: warstwa prawdy: twierdzenia, przyjmowanie dokumentów, zapotrzebowanie, tożsamość;
- `assembly`: deterministyczne kontrole i bramka końcowa;
- `generation`: potok generowania oparty na LangGraph;
- `review`: wczytywanie poprawek z recenzji, bez wywołań modelu;
- `platform`: uwierzytelnianie, zaproszenia, mechanika workerów.

Cały kod API znajduje się w jednej aplikacji, a SDK dostawców są opakowane w osobnym module.

**Dostęp.** Sesje po stronie serwera, rejestracja na zaproszenie. Zaproszenie tworzy firmę (najemcę) albo dołącza do istniejącej. Każdy widok filtruje dane po najemcy. Operatorzy widzą wszystkich.

**Droga żądania.**

1. Aplikacja React wywołuje `/api/v1/` przez typowanego klienta wygenerowanego ze schematu OpenAPI.
2. Nic czasochłonnego nie dzieje się w trakcie żądania HTTP. API zapisuje wiersz zadania i zwraca 202.
3. Worker przejmuje wiersz przez `SELECT … FOR UPDATE SKIP LOCKED`, wykonuje zadanie i zapisuje wynik.
4. Przeglądarka odpytuje o status. Jedynym źródłem prawdy jest status w bazie.
5. Są cztery workery, po jednym na kolejkę: generowanie, przyjmowanie dokumentów, wczytywanie ogłoszeń, składanie pakietu.

**Kluczowe mechanizmy.**

- **Czytanie ogłoszenia:** trzy niezależne przebiegi modelu szukają wymagań, zakazów i odwołań do innych dokumentów. Deterministyczne porównanie oznacza konflikty dla człowieka.
- **Fakty z dokumentów:** każdy cytat musi być dosłownym fragmentem źródła, inaczej kandydat odpada.
- **Kontrola:** trzynaście deterministycznych sprawdzeń.
- **Dopasowanie grantów:** profil możliwości firmy, twardy filtr, wyszukiwanie wektorowe w pgvector, a na końcu model oceniający ograniczoną liczbę kandydatów. Wynik trafia do bazy jednym atomowym zapisem.
- **Generowanie:** tryb odpowiedzi sprawdza się modelem. Tryb dokumentu wstawia odwołania typu `{{fact:47}}` zamiast liczb. Wartość pojawia się dopiero przy renderowaniu, a nierozwiązane odwołanie wyświetla się jako `[GAP: …]` i blokuje je bramka końcowa. Kolejność: ochrona przed nadpisaniem nowszej edycji człowieka, szkic, kontrola deterministyczna, najwyżej dwie poprawki.

**Stos technologiczny i rola każdego elementu.**

- Python 3.13, Django 5, DRF, drf-spectacular: API ze schematem OpenAPI.
- PostgreSQL 17 z pgvector: dane i wyszukiwanie wektorowe przy dopasowaniu.
- Google Gemini (`gemini-2.5-pro` do generowania, `gemini-2.5-flash` do oceny i ekstrakcji, `gemini-embedding-001` do wektorów). Każde wywołanie przechodzi przez jeden moduł, który pilnuje limitów czasu i kształtu odpowiedzi oraz loguje jedną linię.
- LangGraph z punktami kontrolnymi w Postgresie: tylko potok generowania.
- pypdf, python-docx, WeasyPrint, crawl4ai: czytanie dokumentów, renderowanie wyniku, pobieranie stron.
- React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query: osobna aplikacja frontendowa. Wybrana, bo HTMX w starej wersji ograniczał interfejs. Generowany klient OpenAPI pilnuje zgodności z backendem już przy budowaniu.
- Pliki: dysk lokalny w trakcie pracy, Google Cloud Storage z podpisanymi linkami docelowo.

**Grant Flow** (starsza wersja): Django 5.1, PostgreSQL, Celery, Redis, Daphne, Gemini, Google Cloud Storage, interfejs renderowany po stronie serwera. **Strona marketingowa** jest serwowana przez Vercel. Powstaje z folderu `grant-land`, czyli aplikacji Vue 3: GitLab CI publikuje gałąź master na produkcji w Vercelu. Backendem strony jest usługa Observo: uzupełnia opis na podstawie strony firmy i dopasowuje programy.

## Decyzje inżynierskie

- **Modularny monolit zamiast mikroserwisów.** Problemem było sprzężenie kodu, nie rozproszenie. Podział rozniósłby duplikację po granicach sieciowych i zamienił jedną transakcję w transakcje rozproszone. Do tego koszt utrzymania, którego jedna osoba nie udźwignie. Plan zastąpił wcześniejszą propozycję mikroserwisów.
- **Stopniowa migracja zamiast przepisania wszystkiego naraz.** Stara aplikacja działa, dopóki jej części nie mają następców.
- **Sesje zamiast JWT.** Sesje są po stronie serwera i można je unieważnić. Rotacja tokenów odświeżania uznana za przedwczesną.
- **Baza jako kolejka zadań, bez Celery.** Stara aplikacja używała Celery i Redisa, a plan zakładał ich zachowanie. Grant-Smith używa `SKIP LOCKED`, a każdy worker to krótka komenda. Z Celery zrezygnowano, bo zadania mają docelowo działać jako Kubernetes Jobs.
- **Każde zadanie najwyżej raz, bez automatycznych ponowień.** Każda kolejka wykonuje płatną pracę modelu ze skutkami ubocznymi. Ponowienie kosztuje i może zdublować zapisy. Nieudane zadanie zapisuje błąd i jego kategorię, a ponownie uruchamia je człowiek. Status końcowy zapisuje się warunkowo, żeby zadanie oznaczone jako zawieszone nie zmieniło się później w udane. Odrzucono heartbeat: najwolniejszy krok, jedno wywołanie generowania, nie ma kiedy go wysłać.
- **Ocena zapotrzebowania tylko porządkuje kolejkę.** Pierwsza wersja filtrowała. W rzeczywistym przebiegu zmniejszyła liczbę decyzji operatora z 410 do 0 i ukryła 100% faktów z klucza odpowiedzi, więc ją usunięto. Zasada: maszyna może zmienić kolejność tego, na co patrzy człowiek, ale nie może niczego mu zabrać.
- **Czego system celowo nie robi.** Nie ocenia staranności operatorów. Nie ma przyjmowania faktów hurtem, bo to byłaby dokładnie bezrefleksyjna akceptacja, którą pomiary mają wykrywać. Część tych zakazów pilnują testy.
- **Ścisła kontrola dosłownych cytatów.** Zbudowano, zmierzono i usunięto wyjątek dla znaku zastępczego U+FFFD. Nie odzyskał żadnej liczby, bo modele odtwarzają brakujący znak, zamiast go skopiować. Wartości z U+FFFD są odrzucane; w jednym przebiegu było ich 63.
- **Jeden współdzielony klient Gemini.** Przy zimnym starcie 7 z 8 wątków kończyło się błędem „client has been closed”. Przyczyną było sprzątanie przez garbage collector klienta, do którego nie było już odwołań, a `lru_cache` przy współbieżnych wywołaniach tworzył kilka klientów. Teraz to zmienna modułu tworzona pod blokadą, pilnowana testem.
- **Zapytania wyjęte z pętli.** Kontrola sprzeczności wykonywała 1601 zapytań w 4,9 s dla 400 twierdzeń. Teraz wykonuje 3 zapytania niezależnie od rozmiaru i trwa 0,71 s.
- **Przycięte listy podają prawdziwy rozmiar.** Odpowiedź zawiera listę, liczbę liczoną w bazie i flagę przycięcia. Odpowiedź z dopasowaniami ważyła 452 KB i była odpytywana co 2 s. W trakcie działania zadania ma teraz 368 bajtów.
- **Zablokowane usunięcie zwraca 409, nie 500**, z komunikatem dla operatora.
- **Limit fragmentu tekstu jest pilnowany i raportowany.** Plik 297 KB bez pustych linii stał się jednym fragmentem o 296 628 znakach i był po cichu pomijany. Teraz limit działa, a każde twarde cięcie jest liczone.
- **LangGraph tylko w generowaniu.** To świadomy wyjątek od zasady unikania frameworków. Pozostałe zadania AI mają jeden prosty wzorzec modułu.
- **Zabezpieczenia produkcyjne za jednym ustawieniem.** `SECURE_HTTPS` domyślnie włącza się poza trybem debugowania.

## Działanie na produkcji

**Grant-Smith** nie jest wdrożony. Docelowo pliki trafią do Google Cloud Storage. Wdrożenie: jak najszybciej, prawdopodobnie około listopada 2026 r. Host: Google Kubernetes Engine. Kod znajduje się w jednym prywatnym repozytorium.

- **CI:** GitHub Actions uruchamia bramkę (kontrole statyczne, frontend, testy z Postgresem z pgvector, kontrola zgodności schematu) i drugi workflow z hookami pre-commit. Oba uruchamiają te same cele Makefile co lokalny hook przed pushem. CI nie ma klucza Gemini, więc gałąź z forka nie wyda pieniędzy.
- **Znana pułapka:** dopasowanie trwa długo, około 25 wywołań oceniających i około 4 minut. Limit zawieszenia zadania i ewentualny timeout serwera muszą być wyższe.

**Grant Flow** (stan z dnia planu): baza na Cloud SQL, aplikacja, Celery i Redis na jednej maszynie wirtualnej w Google Compute Engine przez docker-compose, TLS przez Caddy, logi w GCP. Plan nazywa tę maszynę pojedynczym punktem awarii bez autoskalowania. Nie śledzono kosztów w dolarach ani wskaźnika błędów, opóźnień i kosztów wywołań modelu. Grant Flow nadal działa na produkcji i spełnia swoje zadanie.

**Strona open-grant.com** działa na Vercelu i korzysta z Google Analytics.

**Koszty:** około 100 dolarów miesięcznie. **Monitoring:** Better Stack.

## Wyniki

- **Wnioski:** przez OpenGrant złożono prawdopodobnie około 100 wniosków. Nie wiadomo jeszcze, czy któryś wygrał, bo wiele z nich wciąż czeka na ocenę.
- **Strona open-grant.com:** w źródłach nie ma liczby użytkowników, ocen kwalifikowalności, konwersji ani dostępności.
- **Grant-Smith:** niewdrożony, więc bez użytkowników i danych produkcyjnych.
- **Walidacja wewnętrzna:**
  - 6 sierpnia 2026 r. trzy przebiegi czytania ogłoszenia uruchomiono na publicznym ogłoszeniu NIH (PA-27-100). Przebieg szukający zakazów znalazł 68 wykluczeń, w tym to, które wcześniej, przy wniosku pisanym ręcznie, kosztowało dwa dokumenty. Test zapisano jako zaliczony.
  - Ten sam test pokazał, że przebieg szukający odwołań do innych dokumentów zwrócił 136 wyników, za dużo, żeby na nich działać.
  - W jednym momencie backend miał 354 przechodzące testy, a frontend 44.
- **Katalog grantów:** poprzednie narzędzie miało około 1800 ogłoszeń z publicznych źródeł. Strona z nich korzysta.

## Ograniczenia i dalsze kroki

**Ograniczenia**

- Grant-Smith nie ma środowiska testowego ani produkcyjnego.
- Nieudane zadanie czeka, aż człowiek przeczyta błąd i uruchomi je ponownie.
- Fakty zapisane innymi słowami bywają pomijane. Dopasowanie takich faktów działa w najlepszym razie w około 85%, więc system nie może twierdzić, że jest kompletny. Dwie sprzeczne wartości dokładności tego samego modelu zapisały się obok siebie bez ostrzeżenia. Sprzeczność wewnątrz jednego dokumentu nie trafia do operatora.
- Przebieg szukający odwołań do innych dokumentów zwraca za dużo wyników i wymaga zawężenia.
- Wciąż nie wiadomo, co sprawia, że wniosek wygrywa. Według planu odpowie na to dopiero praca na prawdziwym wniosku.

**Dalsze kroki**

- **Etap P10, „autonomia na szynach”:** system proponuje, operator przyjmuje. Każdy dokument pakietu powstaje w kolejności zależności i jest sprawdzany względem pozostałych. Mierzone jest, jak często operatorzy przyjmują propozycje. Pierwszy krok, zamiana dokumentów klienta na proponowane fakty, jest zbudowany.
- **Pierwszy prawdziwy wniosek** z prawdziwym terminem, a nie pokaz. Jeszcze się nie odbył: Grant-Smith nie pracował dotąd na prawdziwym wniosku.
- **Projekty zatwierdzone, jeszcze niezbudowane:** dokumenty `docs/ai-pipeline-hub.md` (AI pipeline hub) i `docs/grant-extraction-pipeline.md`. Opisana także w pierwszym z nich kolejka workerów oparta na `SKIP LOCKED` działa już w kodzie.

**Celowo poza zakresem:** klient jako użytkownik systemu, blokowanie zamiast oznaczania, automatyczne zatwierdzanie i uchylenia, decyzje modelu o kwalifikowalności lub nowatorstwie.
