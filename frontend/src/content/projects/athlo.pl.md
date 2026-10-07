---
title: Athlo
slug: athlo
period: 2026-09 – w toku
status: pre-launch
role: Jedyny twórca i właściciel (projekt, backend, frontend, infrastruktura)
context: Projekt osobisty, który może przerodzić się w eksperyment komercyjny. Powstał na prośbę osoby ze środowiska bokserskiego.
stack: Python, Django, PostgreSQL, Celery, Redis, React, TypeScript, Vite, Tailwind CSS, Resend, Docker, Caddy, Railway
demo: https://athlo-ui-production.up.railway.app
repository: prywatne repozytorium na GitHubie
summary: Athlo powstało po rozmowie ze znajomym bokserem, który opowiedział mi o trudnościach związanych z organizacją zawodów. Platforma łączy sportowców, kluby i organizatorów. Organizatorzy mogą publikować wydarzenia, zarządzać zgłoszeniami i ogłaszać wyniki. Sportowcy wyszukują zawody według dyscypliny i daty oraz zapisują się na wybrane wydarzenia, a wyniki tworzą historię startów w ich profilach.
---

# Athlo

## Okres i status

- Pierwszy commit: 21 września 2026. Ostatni na `main`: 24 września 2026. W tych czterech dniach powstało 75 commitów.
- Status: pre-alfa, trwają prace nad etapem M0. Projekt nie jest dostępny dla użytkowników, a wszystkie dane są demonstracyjne.
- Wdrożony do testów wewnętrznych na Railway, bez publicznego adresu. Pierwsze wdrożenie odbyło się 22 września 2026.
- Data startu dla użytkowników nie została jeszcze ustalona.

## Rola i kontekst

- Według historii gita Dawid jest jedynym autorem-człowiekiem: 86 z 89 commitów we wszystkich gałęziach, w tym 5 scalonych pull requestów z jego osobistego konta GitHub. Pozostałe 3 to aktualizacje od Dependabota.
- Część commitów powstała z pomocą AI (Claude).
- Dokument wymagań wskazuje Dawida jako właściciela projektu.
- To projekt osobisty, który może przerodzić się w eksperyment komercyjny. Dawid zbudował go na prośbę osoby ze środowiska bokserskiego. Wymagania opisują już model przychodów: abonamenty dla klubów i związków oraz stałą opłatę od zgłoszenia.

## Krótkie podsumowanie

Athlo łączy sportowców, kluby i organizatorów zawodów. Zaczyna od boksu w Polsce. Organizator publikuje wydarzenia, przegląda zgłoszenia, eksportuje je do CSV i ogłasza wyniki. Sportowiec szuka imprez według dyscypliny i daty, zapisuje się, a wyniki tworzą historię startów w jego profilu. Faza pre-alfa: projekt w budowie, jeszcze niedostępny dla użytkowników.

## Problem

Athlo ma obsłużyć całą drogę zawodów: od znalezienia ich, przez zapis, opłatę startową i udział, po wyniki i relacje. Każda grupa ma inną potrzebę:

- **Zawodnicy** nie mają jednego miejsca, w którym znajdą zawody, zapiszą się na nie i będą mieli całą historię swoich wyników.
- **Organizatorzy** chcą szybko opublikować zawody, także na podstawie gotowego regulaminu w PDF, a potem prowadzić zgłoszenia i opłaty i opublikować wyniki.
- **Kluby i związki** chcą prowadzić listę zawodników i zgłaszać ich hurtowo.
- **Wszyscy odwiedzający** chcą bieżących informacji o niedawnych zawodach.

Dziś organizatorzy sami zbierają opłaty startowe. W Polsce za rejestrację płaci się od zgłoszenia (ZapisyOnline pobiera 0,99 zł od płatnej rejestracji). Opłaty w Polskim Związku Bokserskim wyglądają na sezonowe i pobierane centralnie, czego dokument wymagań jeszcze nie potwierdził.

Projekt powstał na prośbę osoby ze środowiska bokserskiego. Nie wiadomo jeszcze, z czego dziś korzystają organizatorzy i zawodnicy.

## Jak to działa dla użytkownika

Nic nie jest jeszcze publicznie dostępne. Poniżej opisano produkt etapu M0 w takim kształcie, w jakim istnieje w repozytorium.

**Zawodnik**

1. Na stronie głównej widzi hasło: „Znajdź start, zapisz się, śledź wyniki”.
2. Przegląda zawody: wyszukuje, wybiera dyscyplinę, gotowe filtry i zakres dat w kalendarzu. Domyślnie widzi zawody z otwartymi zapisami.
3. Zakłada konto (imię i nazwisko, data urodzenia, główna dyscyplina, kategoria) i potwierdza adres e-mail.
4. Otwiera stronę zawodów: kategorie z opłatą i liczbą wolnych miejsc, wymagania, zasady zwrotów, instrukcje płatności i kontakt.
5. Zapisuje się: wybiera kategorię, potwierdza, że spełnia wymagania, i dostaje e-mail z potwierdzeniem.
6. W zakładce „Moje zawody” widzi nadchodzące i minione starty ze statusem płatności. Może się wycofać.
7. Na profilu widzi swoje wyniki, medale za miejsca na podium, wykres miejsc i to, od ilu zawodników wypadł lepiej. Sam decyduje, kto widzi jego nazwisko, dyscyplinę i wyniki.

**Organizator**

1. Tworzy zawody: daty, miejsce, okres zapisów, limit miejsc, opłata i waluta, instrukcje płatności, zasady zwrotów, wymagania, kontakt oraz widoczność (publiczne albo tylko przez link).
2. Zmienia status zawodów na kolejnych etapach: otwarte zapisy, zakończone, opublikowane wyniki.
3. Przegląda zgłoszenia z filtrami po kategorii i statusie i eksportuje je do pliku CSV.
4. Publikuje wyniki.

**Wszyscy odwiedzający**

- Strona zawodów do udostępnienia, z listą startową i wynikami.
- Sekcja aktualności. Na razie zawiera artykuły zastępcze. Artykuły pisane przez AI są planowane na etap M6.

Interfejs jest najpierw po polsku, dostępny także po angielsku.

## Opis techniczny

**Usługi (trzy na Railway)**

- **Athlo-UI**: kontener z Caddy. Serwuje aplikację SPA zbudowaną Vite i jest jedynym publicznym wejściem. Żądania do API przekazuje przez prywatną sieć Railway.
- **Athlo-API**: Django i DRF pod Gunicornem (1 worker, 4 wątki). Migracje uruchamiają się przed wdrożeniem, a `/healthz` służy do kontroli stanu. Celowo nie ma publicznej domeny.
- **Athlo-Worker**: worker Celery z tego samego obrazu Django.
- Athlo ma własną rolę i bazę PostgreSQL, bez uprawnień superużytkownika.

**Droga żądania**

1. Przeglądarka zawsze rozmawia z jednym originem.
2. Warstwa brzegowa Railway (edge) obsługuje TLS i przekazuje żądanie do Caddy.
3. Caddy serwuje plik statyczny z hashem w nazwie (cache na rok) albo przekazuje `/api/*` do Django.
4. Dzięki jednemu originowi ciasteczko sesji jest własne (first-party), a ochrona CSRF pozostaje prosta.

**Kod**

- `backend/apps/` ma osobny pakiet dla każdej domeny: konta, zawodnicy, audyt, zawody, dyscypliny, zgłoszenia, wydarzenia, organizatorzy, poczta, metadane publiczne.
- `backend/api/` to warstwa DRF bez logiki domenowej.
- Typowany klient frontendu jest generowany ze schematu OpenAPI zapisanego w repozytorium.

**Model danych**

- Dyscypliny to dane, nie kod. Każda ma wersjonowane schematy: wymiary kategorii, pola profilu, pola wyniku i regułę wieku. Zawody przypinają wersję schematu, a wynik zapamiętuje, według której wersji go zapisano. Najpierw dodano boks, potem bieganie, kolarstwo, pływanie, MMA i triathlon.
- Rodzaje wyników to zamknięty zbiór w kodzie: klasyfikacja, pojedynek, punktacja, mecz drużynowy.
- Pola potrzebne we wszystkich dyscyplinach (miejsce, punkty rankingowe, data wyniku) to zwykłe kolumny obok danych w JSON.
- Wyniki tylko się dopisuje. Korekta zastępuje wcześniejszy wiersz, a opublikowanego wiersza nie da się zmienić.
- Zgłoszenie dotyczy kategorii, nie całych zawodów. Limit miejsc jest sprawdzany pod blokadą wiersza.
- Wyszukiwanie zawodów korzysta z pełnotekstowego wyszukiwania PostgreSQL. Cel: 500 ms dla 95. percentyla.

**Poczta**

- Wiadomość trafia najpierw do tabeli outbox, w tej samej transakcji co zdarzenie, które ją wywołało.
- Po zatwierdzeniu transakcji uruchamia się zadanie Celery.
- Dostarczenie co najmniej raz: wiersze są pobierane przez `SELECT … FOR UPDATE SKIP LOCKED`, a klucz deduplikacji chroni przed duplikatami. Ponowienia po 1, 5, 15 i 60 minutach.
- Lokalnie poczta idzie do Mailpit, na produkcji przez Resend (SMTP).

**Podglądy linków**

- Dla `/events/<slug>` i `/athletes/<slug>` Django zwraca „powłokę z metadanymi”: prawdziwy tytuł, tagi Open Graph i Twitter, JSON-LD oraz `noindex` dla zawodów dostępnych tylko przez link.
- Powłoka ładuje te same pliki JS i CSS co SPA. Ich nazwy Django zna z zapisanej w repozytorium kopii manifestu builda Vite.
- Przeglądarka uruchamia z niej aplikację, a robot czyta tylko tagi. Obaj dostają identyczny HTML, bez rozróżniania po User-Agencie.

**Pozostałe**

- Hasła haszowane Argon2.
- Restrykcyjne CSP (skrypt inline przed renderowaniem dopuszczony przez hash), HSTS, COOP i X-Frame-Options DENY.
- Logi na konsolę, z filtrem usuwającym ścieżki z tokenami.
- Polski jest językiem głównym. Angielski wyznacza zestaw kluczy tłumaczeń, a polski jest do niego typowany, więc brak tłumaczenia przerywa build.

## Decyzje inżynierskie

1. **Django, DRF i Celery zamiast FastAPI.** Django daje panel administracyjny (pokrywa większość wymagań administracyjnych), uwierzytelnianie i kolejkę zadań. Przy FastAPI wszystkie trzy trzeba by napisać od zera. Schematy dyscyplin w jsonb i tak przesądzały o PostgreSQL. To także wzorce znane ze Slip.
2. **React i Vite zamiast SvelteKit**, choć wymagania i system projektowy zakładały SvelteKit. Konfiguracja ze Slip miała już rozwiązane PWA, mignięcie przy trybie ciemnym, typowane tłumaczenia, CSP i jeden origin. Katalog tłumaczeń Paraglide kompilowany przy budowaniu kłóciłby się z nazwami dyscyplin wpisywanymi przez administratorów w trakcie działania. Zapisana lekcja: pierwsza analiza porównała tylko pliki `package.json` i błędnie uznała, że Slip nie ma i18n.
3. **Powłoka z metadanymi w Django zamiast Next.js, Vike albo prerenderingu.** Potrzebne były metadane czytelne dla robotów, nie renderowanie po stronie serwera. Next.js oznaczałby porzucenie routera, i18n, PWA i motywów. Vike dodałby proces Node i wymagał komponentów bezpiecznych dla SSR. Usługa prerenderingu w przeglądarce bez interfejsu to dodatkowy element, dostawca i opóźnienie przy indeksowaniu. Nazwy plików pochodzą z manifestu Vite, a nie z parsowania zbudowanego HTML.
4. **Jeden wspólny model z wersjonowanymi schematami zamiast tabeli na każdy sport.** Osobne tabele dają prawdziwe typy, ale każda nowa dyscyplina wymagałaby migracji, API, eksportu i rankingu. Funkcje przekrojowe (historia zawodnika, wyszukiwanie, rankingi) zamieniłyby się w rosnące sumy zapytań. Test pilnuje, by słowo `boxing` występowało tylko w rejestrze dyscyplin.
5. **Opublikowany wynik przechowuje własną kopię nazwiska zawodnika.** Tak da się pogodzić prawo do usunięcia danych (RODO) z trwałymi wynikami: przy usunięciu konto jest pseudonimizowane, a wyniki zachowują skopiowane nazwisko i klub. Korekta przenosi kopię dalej, zamiast czytać ją ponownie z profilu.
6. **Wiek liczony względem daty zawodów, nie dnia dzisiejszego.** Inaczej zawodnicy przechodziliby między kategoriami w trakcie sezonu. Sprawdzanie, czy zawodnik jest niepełnoletni, liczy wiek osobno, według kalendarza.
7. **Role to członkostwa przypisane do organizatora**, a nie kolumna z typem konta.
8. **Status zgłoszenia i status płatności to osobne kolumny** od pierwszej migracji, choć płatności jeszcze nie ma.
9. **Caddy jako jedyne wejście, bez publicznego adresu API.** Przy dwóch publicznych ścieżkach o różnej liczbie proxy żadna wartość `NUM_PROXIES` nie była dobra. Przy 1 wszyscy użytkownicy dzielili jeden limit zapytań. Przy 2 ktoś wywołujący API bezpośrednio mógł podrobić `X-Forwarded-For`. Drugą ścieżkę usunięto, a `collectstatic` przeniesiono do Dockerfile, żeby panel administracyjny miał style.
10. **Poczta wysyłana po zatwierdzeniu transakcji, bez `celery beat`.** Beat co 30 sekund sprawdzał outbox, choć żaden e-mail nie zależy od upływu czasu. Do e-maili weryfikacyjnych dochodziło przez to do 30 sekund opóźnienia. Po zmianie zmierzono 0,44 s od żądania do doręczenia. Kolejność miała znaczenie: usługę beat można było usunąć dopiero po wdrożeniu nowego mechanizmu.
11. **Celery szybko zgłasza błąd, gdy Redis nie działa.** Przy wyłączonym Redisie rejestracja trwała 19 s przez ponawianie zapisu wyników i odstępy w bibliotece kombu. Wyłączenie zapisu wyników i ograniczenie prób połączenia skróciło to do 0,23 s.
12. **Sposób wysyłki poczty zależy od tego, czy skonfigurowano serwer SMTP, a nie od `DEBUG`.** Przy przełączniku `DEBUG` wdrożenie testowe bez danych dostępowych po cichu gubiłoby wszystkie e-maile weryfikacyjne.
13. **Argon2 od początku.** Zmiana po założeniu prawdziwych kont wymagałaby przeliczania haszy przy logowaniu i utrzymywania dwóch algorytmów naraz.
14. **Konfiguracja Railway jako kod (`railway.ts`) zamiast wycofywanego `railway.json`**, który przestanie być czytany 1 grudnia 2026. Plan zmian trafia do pull requesta, a zastosowanie zmian wykonuje dokładnie ten plan.
15. **Przesunięte porty lokalne** (aplikacja 5183, API 8802, baza 5435), żeby Athlo działało obok Slip i Picko.

## Działanie na produkcji

Na razie istnieje tylko środowisko do testów wewnętrznych, bez publicznego adresu.

- **Hosting:** Railway. Usługi: Athlo-UI, Athlo-API, Athlo-Worker oraz PostgreSQL i Redis.
- **Wdrożenia:** push do `main` buduje obie usługi z Dockerfile. Migracje uruchamiają się przed wdrożeniem, a worker ma 120 s na dokończenie zadań. Obrazy są przypięte do digestu i działają jako użytkownik bez uprawnień roota. Zmiany konfiguracji Railway przechodzą przez pull request: plan trafia do komentarza i jest stosowany po scaleniu. Plan, który coś usuwa, jest odrzucany i stosowany ręcznie.
- **CI:** GitHub Actions wywołuje te same cele Makefile co lokalna bramka `make check`, uruchamiana też jako hook pre-commit.
  - Backend: lint, typy, kontrola migracji i zgodności schematu API, testy na PostgreSQL 17.
  - Frontend: lint, typy, testy Vitest w przeglądarce, build produkcyjny i sprawdzenie, czy powłoka z metadanymi wskazuje bieżący build.
  - Dependabot proponuje aktualizacje zależności.
- **Testy:** 76 plików testów backendu i 27 frontendu.
- **Monitoring:** logi na konsolę, kontrole stanu Railway (`/healthz` dla API, `/` dla UI) i polecenie `mail_outbox_status` do wykrywania zablokowanej poczty. Poza tym na razie nic: brak Sentry, innych narzędzi APM i zewnętrznego monitoringu dostępności.
- **Koszty:** niemal zerowe.

**Czego nauczyło środowisko testowe**

- Przy pierwszym prawdziwym wdrożeniu `celery beat` wpadł w pętlę restartów: jako użytkownik bez roota nie mógł zapisać pliku harmonogramu.
- Pierwsze uruchomienie bramki frontendu w CI nie powiodło się, bo `npm ci` nie instaluje przeglądarki Playwright.
- Problem z liczbą proxy i limitem zapytań (decyzja 9).
- Część zmian sprawdzano na zbudowanych kontenerach, nie na serwerze deweloperskim, bo bramka nie wychwyciłaby tych problemów.

## Wyniki

Nie ma jeszcze nic mierzalnego po stronie użytkowników: projekt nie jest wdrożony dla nich, a dane są demonstracyjne (ładowane przez `make seed`).

Liczby inżynierskie z commitu zamykającego ścieżkę M0: 182 testy backendu, 28 frontendu, sprawdzanie typów bez błędów w 145 plikach. Zmierzone przy zmianie wysyłki poczty: 0,44 s od żądania do doręczenia e-maila.

Wskaźniki sukcesu (m.in. opublikowane zawody, konwersja zgłoszeń, powracalność) są zdefiniowane, ale mają być mierzone od startu. Spoza projektu Athlo widziała i wypróbowała dotąd jedna osoba ze środowiska bokserskiego.

## Ograniczenia i dalsze kroki

**Celowo poza M0:** płatności, przesyłanie zdjęć, kluby, losowania, rozstawienia i harmonogram walk. Zgłoszenia mają tylko podstawowe statusy, bez listy rezerwowej, akceptacji i odprawy.

**Plan etapów**

- M1: klikalny szkielet i jedne prawdziwe zawody, darmowe lub płatne na miejscu.
- M2: przeprowadzanie zawodów (losowanie, ważenie, wyniki).
- M3: kluby.
- M4: opłaty startowe.
- M5: rozliczenia.
- M6: import zawodów z PDF przez AI i aktualności pisane przez AI.
- M7: rozwój i wzmocnienie, w tym druga dyscyplina.

Boks jest pierwszy. Bieganie, kolarstwo, pływanie, MMA i triathlon są już w rejestrze, a interfejs oznacza je jako „Wkrótce”.

**Otwarte decyzje blokujące dalsze etapy**

- Jak naprawdę przepływa opłata startowa w Polskim Związku Bokserskim (blokuje rozliczenia).
- Kto jest sprzedawcą w transakcjach (blokuje płatności).
- Po czym jednoznacznie rozpoznać zawodnika (blokuje zaproszenia z klubów).
- Niepełnoletni i opiekunowie przy płatnych zgłoszeniach.
- Zachowanie opublikowanych wyników po usunięciu konta.

**Ryzyko nazwane w wymaganiach:** trzy etapy powstaną, zanim popłyną jakiekolwiek pieniądze. Założenia biznesowe trzeba więc sprawdzić w rozmowach podczas M1 i M2, m.in. z okręgowym związkiem bokserskim. Rozmowa ze związkiem jeszcze się nie odbyła, ale jest zaplanowana.

**Do poprawienia w dokumentacji:** README i instrukcje dla agentów opisują katalog `backend/clients/`, którego w repozytorium nie ma. Poczta idzie bezpośrednio przez backend SMTP Django.
