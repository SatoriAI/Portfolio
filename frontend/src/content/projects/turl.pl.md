---
title: tURL
slug: turl
period: 2025-08 – 2025-09
status: live
role: backend, testy, CI, wdrożenie i połączenie frontendu z API; interfejs wygenerowany w Lovable
context: personal
stack: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, React, TypeScript, Vite, Tailwind CSS, Docker, Railway, Cloudflare
demo: https://turl.info
repository: https://github.com/SatoriAI/tURL
summary: tURL to serwis do skracania linków, który pozwala ustawić ich termin ważności oraz wybrać skrót o długości 2, 4, 6 lub 8 znaków. Użytkownik może w dowolnym momencie sprawdzić status utworzonego linku i edytować jego ustawienia. Wszystko bez zakładania konta.
---

# tURL

## Okres i status

- Pierwszy commit: 28 sierpnia 2025 r. Ostatni: 2 września 2025 r., w obu repozytoriach (backend i frontend). Prace trwały około sześciu dni.
- Serwis działa. 1 października 2026 r. adres turl.info przekierowywał na aplikację pod app.turl.info, a endpoint `/status` odpowiadał poprawnie.
- Od 2 września 2025 r. nie ma nowych commitów, więc projekt nie jest rozwijany od 2 września 2025 r.
- Daty uruchomienia nie planowano. Dawid wdrożył serwis, gdy był gotowy: 2 września 2025 r.

## Rola i kontekst

- **Backend:** commity pochodzą od Dawida i od konta GitHub SatoriAI, do którego należą repozytoria. Commity SatoriAI to scalenia pull requestów i commit początkowy. SatoriAI to własne konto GitHub Dawida, więc projekt był w całości samodzielny; w repozytoriach nie ma innych autorów.
- **Frontend:** interfejs wygenerował Lovable (narzędzie AI do budowania aplikacji). Dawid podłączył go do API, uzupełnił tłumaczenia, podpiął linki w przyciskach i przygotował wdrożenie.
- **Co należało do Dawida:** API i jego testy, CI, konfiguracja wdrożenia oraz integracja frontendu z API. Wyglądem interfejsu kierował głównie przez prompty w Lovable.
- **Kontekst:** osobisty projekt poboczny, zrobiony częściowo dla zabawy, a częściowo po to, żeby poznać Lovable i go wypróbować. Strona ma przycisk „Donate” prowadzący do Buy Me a Coffee oraz linki do osobistej strony i konta X Dawida.
- Kod jest publiczny na GitHubie w dwóch repozytoriach: backend (https://github.com/SatoriAI/tURL) i frontend (https://github.com/SatoriAI/tURL-UI).
- Licencja: MIT.

## Krótkie podsumowanie

tURL to serwis do skracania linków z terminem ważności. Wklejasz długi adres i wybierasz okres działania linku (od jednego dnia do braku terminu) oraz długość kodu: 2, 4, 6 lub 8 znaków. Dostajesz krótki link do skopiowania. Później możesz sprawdzić, czy link jest aktywny i ile dni mu zostało. Możesz go przedłużyć albo zdjąć limit czasu. Bez zakładania konta.

## Problem

tURL nie powstał po to, by załatać lukę w istniejących skracaczach; Dawid nie uważa, żeby czegoś im brakowało. Interfejs przedstawia cel jako tworzenie krótkich linków z własnym czasem życia: domyślnie nie działają wiecznie, a w razie potrzeby można je przedłużyć.

Serwis jest dla każdego, kto potrzebuje skracacza linków. tURL oferuje dwa proste ustawienia: termin ważności i długość kodu.

## Jak to działa dla użytkownika

1. Wchodzisz na turl.info i trafiasz na stronę aplikacji. Jest po polsku lub po angielsku, z przełącznikiem języka i jasnym lub ciemnym motywem.
2. W sekcji skracania wklejasz długi adres.
3. Wybierasz czas działania linku: 1 dzień, 7 dni, 30 dni (domyślnie), 1 rok albo bezterminowo.
4. Wybierasz długość kodu: 2, 4, 6 (domyślnie) lub 8 znaków. Przy każdej opcji widać, ile mniej więcej kodów jest do wykorzystania.
5. Jeśli pole jest puste albo adres jest nieprawidłowy, pojawia się komunikat o błędzie.
6. Po skróceniu dostajesz kartę z oryginalnym i krótkim linkiem, przyciskiem do skopiowania, wybranym czasem działania i datą utworzenia.
7. Każdy, kto otworzy krótki link, trafia od razu na oryginalny adres. Nieznany kod daje odpowiedź „nie znaleziono”.
8. Później w sekcji sprawdzania stanu wklejasz krótki link i widzisz: czy jest aktywny, kiedy powstał, jak długo ma działać („Nieskończony”, jeśli nie wygasa), ile dni mu zostało i dokąd prowadzi.
9. Dopóki link jest aktywny, możesz przedłużyć mu ważność o wybrany okres albo zrobić go bezterminowym.

Konto nie jest potrzebne. Żadne z repozytoriów nie obsługuje logowania ani użytkowników.

## Opis techniczny

**Dwie usługi:**

- API w FastAPI pod turl.info. Jego adres główny przekierowuje (308) na frontend, więc krótka domena jest też adresem marki.
- Aplikacja React (jedna strona) pod app.turl.info, która wywołuje API z przeglądarki. Adres API jest wpisywany do paczki podczas budowania.

**Dane:** dwie tabele w PostgreSQL w relacji jeden do jednego.

- `link`: adres docelowy i unikalny, zaindeksowany kod.
- `detail`: długość kodu, czas życia w dniach (NULL oznacza „bezterminowo”), data rejestracji i modyfikacji. Usuwana razem z linkiem.
- Ograniczenia CHECK w bazie: długość większa od zera, czas życia pusty albo większy od zera.
- Data wygaśnięcia nie jest zapisywana. Liczy się ją przy odczycie: data rejestracji plus czas życia.

**Endpointy:**

- `POST /encode` tworzy link i zwraca krótki adres.
- `GET /d/{code}` przekierowuje (308) albo zwraca 404.
- `GET /info/{code}` zwraca adres, daty, termin wygaśnięcia i informację, czy link wygasł.
- `PATCH /extend/{code}` dodaje dni do czasu życia albo ustawia go na bezterminowy.
- `GET /status` służy do sprawdzania stanu usługi. Dokumentacja (ReDoc) jest pod `/docs`; Swagger jest wyłączony.

**Droga żądania przy tworzeniu linku:** kontrola CORS (jedno dozwolone źródło) i globalny limit zapytań → walidacja adresu i liczb przez Pydantic → losowy kod z liter i cyfr → zapis `link` i `detail`. Jeśli kod się powtórzy, zapis jest wycofywany i API losuje nowy kod, domyślnie do 10 razy. Potem zwraca 406 z prośbą o dłuższy kod.

**Stos:**

- Backend: Python 3.13, FastAPI, asynchroniczny SQLAlchemy 2 z asyncpg, Alembic, pydantic-settings (cała konfiguracja ze zmiennych środowiskowych), fastapi-throttle, Gunicorn z workerami Uvicorn, uv.
- Frontend: React 18, TypeScript, Vite 5, Tailwind CSS, shadcn/ui, TanStack Query, React Router. Tłumaczenia EN/PL są ręcznie napisaną mapą, a wybrany język zapisuje się w przeglądarce.

## Decyzje inżynierskie

W repozytoriach nie ma zapisanych decyzji architektonicznych. Poniższe wynikają z kodu, komentarzy i wyjaśnień Dawida. Alternatyw nie rozważano poważnie: tURL powstał dla przyjemności.

- **Unikalność kodu pilnuje baza, nie osobne zapytanie.** API od razu próbuje zapisać link i polega na ograniczeniu UNIQUE. Według komentarza w kodzie to tańsze niż wcześniejsze sprawdzanie. Przy okazji znika wyścig między sprawdzeniem a zapisem.
- **Długość kodu wybiera użytkownik, a brak wolnych kodów jest zgłaszany.** API nie wydłuża kodu samo, tylko zwraca 406 i sugeruje dłuższy kod. Interfejs pokazuje, ile kodów daje każda długość.
- **Czas życia zamiast daty wygaśnięcia.** Przedłużenie to zwykłe dodawanie, a NULL czytelnie oznacza „bezterminowo”. Koszt: termin trzeba liczyć przy każdym odczycie, a baza nie może go zaindeksować do sprzątania.
- **Metadane w osobnej tabeli.** Podział jest celowy: zapytanie przekierowujące czyta tylko wąską tabelę `link`.
- **Blokada przy przedłużaniu.** `SELECT … FOR UPDATE` w transakcji sprawia, że dwa równoczesne przedłużenia nie nadpisują się nawzajem.
- **Walidacja w dwóch miejscach.** Pydantic sprawdza dane na wejściu API, a ograniczenia CHECK pilnują tych samych reguł w bazie.
- **Przekierowanie 308.** Krótkie linki i adres główny używają 308, co potwierdzają testy. Przeglądarki mogą zapamiętać takie przekierowanie, co kłóci się z wygasaniem linków. Dziś Dawid prawdopodobnie by to zmienił, choć nie uważa tego za duży problem.
- **Globalny limit zapytań.** Obejmuje wszystkie ścieżki i jest ustawiany zmiennymi środowiskowymi.
- **Migracje przed wdrożeniem.** Railway uruchamia `alembic upgrade head` przed startem nowej wersji, a nie przy starcie aplikacji.
- **Interfejs z generatora, integracja ręczna.** Lovable wygenerował UI na podstawie promptów Dawida; połączenie z API, tłumaczenia i wdrożenie Dawid zrobił sam. Endpointy są w jednym module konfiguracyjnym.

## Działanie na produkcji

- **Hosting:** obie usługi na Railway, każda z własnym Dockerfile i plikiem konfiguracyjnym w repozytorium. Ruch przechodzi przez Cloudflare.
- **Kontener API:** obraz `python:3.13-slim`, zależności przez uv z warstwami cache'owanymi przez Dockera, Gunicorn z liczbą workerów ze zmiennej środowiskowej, health check na `/status`.
- **Kontener frontendu:** budowanie w dwóch etapach. Node 20 buduje aplikację, a `serve` udostępnia gotowe pliki.
- **Baza:** PostgreSQL z najnowszego obrazu udostępnianego przez Railway. CI testuje na PostgreSQL 17.
- **CI (tylko backend):** GitHub Actions przy pushach i PR-ach do `main`: pre-commit (ruff, codespell, sprawdzanie YAML i TOML), równolegle pylint i mypy, potem pytest na kontenerze PostgreSQL. Pokrycie trafia do Codecov, a testy nie przechodzą poniżej 85%. Testy obejmują wszystkie endpointy, łącznie z odpowiedzią 429 po przekroczeniu limitu.
- **Frontend:** brak CI w repozytorium.
- **Wdrożenia:** Railway wdraża automatycznie po każdym pushu.
- **Monitoring:** poza health checkiem nic w repozytoriach.
- **Koszty:** utrzymanie kosztuje mniej niż dolara miesięcznie.
- **Incydenty:** jedynym znanym był błąd 500 w `/info` dla wygasłych linków, naprawiony w PR #6. O innych problemach Dawid nie wie.

## Wyniki

Nie ma danych liczbowych: liczby użytkowników, utworzonych linków, przekierowań ani dostępności. W repozytorium nie zapisano też aktualnego wyniku pokrycia testami; CI wymaga co najmniej 85%. Sprawdzalne jest to, że serwis działa i przekierowuje na aplikację.

## Ograniczenia i dalsze kroki

W repozytoriach nie ma planu rozwoju ani notatek TODO. Luki poniżej wynikają z lektury kodu, a plany pochodzą od Dawida.

- **Wygaśnięcie nie blokuje przekierowania.** `GET /d/{code}` nie sprawdza ważności, a nic nie usuwa wygasłych linków, więc we wdrożonej wersji wygasły link nadal przekierowuje. Termin widać tylko w widoku stanu. Komunikat o linku „już unieważnionym” nie ma pokrycia w kodzie. Sprawdzanie terminu przy przekierowaniu jest zaplanowane.
- **Przedłużenie liczy się od daty utworzenia.** Dni dodaje się do pierwotnego czasu życia, a nie od dziś. Krótkie przedłużenie wygasłego linku może go nie wskrzesić, choć interfejs nazywa wybór „nowym czasem życia”.
- **Brak statystyk kliknięć,** choć tekst interfejsu wspomina o śledzeniu linków. Linków nie da się też usunąć ani edytować. Ważność liczy się w pełnych dniach.
- **Health check w Dockerfile** wywołuje `curl`, który wcześniej w tym samym obrazie jest odinstalowywany. Railway korzysta z własnego health checku na `/status`.
- **Dokumentacja:** README frontendu to szablon Lovable, README backendu ma jedno zdanie, a opis w `pyproject.toml` został z szablonu.
- **Dalsze plany:** sprawdzanie terminu ważności przy przekierowaniu oraz własność linku (zmiany w linku tylko dla jego właściciela).
