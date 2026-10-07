---
title: Konfio
slug: konfio
period: 2025-07 – ongoing
status: live
role: współzałożyciel: backend, frontend, wdrożenie; drugi współzałożyciel odpowiada za sprzedaż i partnerstwa
context: commercial
stack: Python, Django, PostgreSQL, Celery, Redis, React, TypeScript, Vite, Tailwind CSS, OpenAI, Resend, Google Cloud Storage, Google Maps Platform, Docker, Railway, Cloudflare
demo: https://konfio.pl
repository: private
summary: Konfio łączy organizatorów wydarzeń z hotelami w Polsce. Wystarczy raz opisać wydarzenie i wysłać jedno zapytanie, by otrzymać oferty w ujednoliconym formacie. Organizator może porównać je z pomocą AI i negocjować ceny. Korzystanie z platformy jest bezpłatne, a hotele płacą prowizję wyłącznie za wydarzenia, które się odbyły. Z Konfio korzysta już ponad 50 podmiotów.
---

# Konfio

## Okres i status

- Prace ruszyły 29 lipca 2025 r. Pierwsze prace wdrożeniowe pochodzą z sierpnia 2025 r.
- Najwięcej działo się w sierpniu 2025 r. i od stycznia do sierpnia 2026 r. Od września do grudnia 2025 r. prawie nic nie powstało.
- Frontend rozwijano najpierw w osobnym repozytorium. 11 lipca 2026 r. trafił do wspólnego monorepo.
- Ostatnia zmiana w kodzie pochodzi z 13 sierpnia 2026 r.
- Konfio działa produkcyjnie pod adresami konfio.pl (strona) i app.konfio.pl (aplikacja). Strona nosi oznaczenie BETA.
- Dla prawdziwych organizatorów i hoteli Konfio ruszyło około kwietnia 2026 r.
- Domena konfio.com nie należy do projektu. Przekierowuje na stronę innej, niepowiązanej firmy.

## Rola i kontekst

- Konfio to przedsięwzięcie dwóch współzałożycieli. Formalnie działa w ramach jednoosobowej działalności gospodarczej Dawida.
- Dawid odpowiada za technologię i wsparcie techniczne. Drugi współzałożyciel zajmuje się sprzedażą i partnerstwami.
- Cały kod napisał Dawid: backend (Django), oba frontendy (React) i wdrożenie (konfiguracja Railway, skrypty wdrożeniowe). Historia kodu nie zawiera innych ludzkich autorów.
- Poza commitami Dawida w historii są scalenia pull requestów i automatyczne commity odznak z jego drugiego konta GitHub (SatoriAI), commity bota Lovable, w którym wygenerowano pierwszą wersję frontendu (kreator aplikacji oparty na AI), oraz 9 commitów podpisanych jako Claude.
- Konfio pobiera opłaty: hotele płacą prowizję od wydarzeń, które się odbyły.

## Krótkie podsumowanie

Konfio łączy organizatorów wydarzeń z hotelami w Polsce. Organizator raz opisuje wydarzenie i wysyła jedno zapytanie. Hotele odpowiadają ofertami w jednym formacie, rozpisanymi na pozycje. Organizator zestawia je ze sobą z pomocą AI i może negocjować ceny pozycji. Platforma jest bezpłatna, a hotel płaci prowizję tylko od odbytych wydarzeń. Konfio jest w wersji beta.

## Problem

- **Organizatorzy** szukali hoteli przez maile, pliki PDF i arkusze kalkulacyjne. Jedno wydarzenie oznaczało dziesiątki wiadomości.
- **Oferty hoteli** przychodziły w różnych formatach. Nie dało się ich wprost porównać.
- **Hotele** dostawały przypadkowe zapytania i same musiały ustalać, czego organizator oczekuje.
- Rynek to Polska: zapytanie dotyczy jednego miasta albo całego kraju, ceny są w złotych.
- Pomysł wyszedł od współzałożyciela, który przez całe życie zawodowe pracuje w hotelarstwie.

## Jak to działa dla użytkownika

**Organizator**

1. **Zakłada konto** w app.konfio.pl i potwierdza adres e-mail kodem. Może zaprosić współpracowników.
2. **Raz opisuje wydarzenie.** Jeden formularz obejmuje terminy, liczbę gości, pokoje, catering, napoje i budżet. Typy wydarzeń: od konferencji i szkoleń po gale i wigilie firmowe. Według strony zajmuje to około 5 minut.
3. **Wybiera adresatów.** Ma trzy możliwości:
   - Konfio sam dobiera hotele.
   - Organizator wskazuje konkretne hotele, także spoza platformy. Te dostają mailem bezpieczny link.
   - Organizator wysyła ze swojej skrzynki gotowy mail przygotowany przez Konfio, a hotele odpowiadają przez wspólny link.
4. **Dostaje oferty** rozpisane koszt po koszcie, w jednym formacie, wraz z powiadomieniami.
5. **Zestawia oferty ze sobą.** Może poprosić AI o ocenę każdej oferty w skali 1–10 pod względem ceny, standardu, spełnienia wymagań, wartości dodanej i jakości uwag. AI wskazuje najlepiej dopasowaną. Organizator może dodać własne wytyczne. Ostateczny wybór należy do niego.
6. **Negocjuje i decyduje.** Może negocjować cenę pojedynczej pozycji oferty, pisać do hoteli i prowadzić książkę adresową hoteli. Przyjmuje jedną ofertę, pozostałe zostają oznaczone jako niewybrane.
7. **Potwierdza, że wydarzenie się odbyło.** Dzień po jego zakończeniu obie strony dostają takie pytanie. Od potwierdzonego wydarzenia liczy się prowizja.

**Hotel**

1. **Dołącza i uzupełnia profil:** informacje ogólne, kontakt, pokoje i sale konferencyjne. Na tej podstawie Konfio dobiera zapytania.
2. **Dostaje pasujące zapytania** według lokalizacji, standardu i pojemności. Mail przychodzi po publikacji zapytania. Jeśli hotel nie odpowie, 12 godzin przed wygaśnięciem dostaje przypomnienie.
3. **Czyta opis i odpowiada albo odmawia.** Powód odmowy to zajęty termin, brak miejsc, zbyt niski budżet lub niepasujący typ wydarzenia.
4. **Przygotowuje ofertę.** Formularz jest wstępnie wypełniony danymi z zapytania, hotel dopisuje ceny. Hotel bez konta może odpowiedzieć przez link.
5. **Śledzi ofertę.** Widzi, kiedy organizator ją otworzył i kiedy wybrał. Bierze udział w negocjacjach cen.

**Koszt i język**

- Platforma jest bezpłatna dla obu stron. Hotele płacą 8% wyłącznie od wydarzeń, które się odbyły.
- Interfejs działa po polsku i angielsku. Maile wychodzą w języku odbiorcy.

## Opis techniczny

**Układ.** Monorepo z API w Django i dwiema aplikacjami React:

- `apps/marketing` to publiczna strona,
- `apps/app` to aplikacja po zalogowaniu, z osobnymi ścieżkami dla hoteli i organizatorów,
- `packages/shared` to wspólne komponenty i tłumaczenia (PL/EN). Tłumaczenia obsługuje własny hook `useLocale`, odziedziczony po szkielecie z Lovable.

**Moduły backendu**

- `partner`: użytkownicy, hotele i organizatorzy, profile, pokoje i sale, członkostwa, onboarding, usuwanie kont.
- `rfp`: cykl życia zapytania (szkic → opublikowane → zarchiwizowane), zaproszenia, oferty z pozycjami, negocjacje cen pozycji, potwierdzenia wydarzeń, powiadomienia, rejestr maili.
- `ai`: funkcje oparte na OpenAI z rejestrem kosztów: ocena ofert, wnioski dla organizatora, powitania na pulpicie, szkice maili.
- `addressbook`: zaproszenia dla hoteli, które nie są jeszcze zarejestrowane.

**Dobór hoteli.** Lokalizacja i standard to twarde filtry. Lokalizacja to jedno miasto, opcjonalnie z promieniem w kilometrach (wzór haversine), albo cała Polska. Standard to 2–5 gwiazdek lub brak kategorii. Pojemność celowo nie filtruje, tylko wpływa na ocenę. Publiczne linki dla hoteli spoza platformy mają limit 30 żądań na godzinę.

**Negocjacje** dotyczą pojedynczych pozycji, odbywają się na zmianę i mają limit 20 wiadomości.

**Droga żądania**

1. Aplikacja w przeglądarce wywołuje API (Django REST Framework) z tokenem JWT. Token dostępu ważny jest 60 minut, odświeżający 14 dni.
2. Żądanie obsługuje gunicorn z jednym workerem Uvicorn (ASGI).
3. Efekty uboczne, np. maile, trafiają do Celery przez Redis. Maile mają osobną kolejkę.
4. Worker wysyła maile przez HTTP API Resend.

**Powiadomienia na żywo.** Powiadomienie zapisuje się w bazie i publikuje przez Redis pub/sub. Przeglądarka odbiera je przez Server-Sent Events. EventSource nie wysyła nagłówków uwierzytelniania, więc klient najpierw pobiera jednorazowy bilet: UUID trzymany w Redisie przez 30 sekund i kasowany przy pierwszym użyciu.

**Zadania cykliczne** (Celery Beat, harmonogram w bazie):

- co 15 minut: przypomnienia o zapytaniach, zaplanowane usunięcia kont, czyszczenie wygasłych rejestracji i zmian adresu e-mail,
- codziennie: archiwizacja wygasłych zapytań, potwierdzenia wydarzeń, migawki liczby dopasowań,
- co tydzień: przypomnienia o onboardingu (poniedziałek, 8:05 czasu polskiego).

**AI.** Każda funkcja to „misja”: komunikat systemowy, komunikat użytkownika i schemat JSON. Odpowiedź modelu musi ściśle trzymać się schematu. Każde wywołanie zapisuje się z promptem, odpowiedzią, liczbą tokenów i kosztem w USD. Ocena ofert ma domyślny limit 5 uruchomień na zapytanie dziennie. Gdy przyjdą nowe oferty, analiza zostaje oznaczona jako nieaktualna. Modele: gpt-5.4-mini (domyślny) i gpt-5.4-nano.

**Pliki i panel.** Pliki i załączniki leżą w dwóch kubełkach Google Cloud Storage, z prefiksem dla każdego środowiska. Limit przesyłanego pliku to 15 MB. Panel administracyjny (django-unfold) ma własne pulpity z metrykami.

**Stos**

- Backend: Python 3.13, Django 5.2, Django REST Framework, PostgreSQL, Celery, Redis, simplejwt, drf-spectacular, uv.
- Frontend: React 18, TypeScript, Vite, React Router, TanStack Query, React Hook Form z Zod, Tailwind CSS, shadcn/ui, Google Maps, react-joyride (samouczek w aplikacji).
- Usługi: OpenAI, Resend, Google Cloud Storage, Google API do adresów.
- Narzędzia: GitHub Actions, Codecov, pre-commit (Ruff, MyPy, codespell), Vitest, Testing Library.

## Decyzje inżynierskie

1. **Worker Celery na wątkach, nie na procesach.** Railway zgłasza 32 procesory, więc domyślny prefork uruchamiał 32 procesy Django i zajmował około 3 GB w spoczynku. Osiem wątków mieści się w około 150 MB. To działa, bo wszystkie zadania czekają na sieć (Resend, OpenAI, Postgres). Konfiguracja zapisuje warunek powrotu: zadanie obciążające procesor trafi do osobnej usługi z prefork i dwoma procesami.
2. **Jeden worker gunicorna, restartowany po około 1000 żądań.** Liczba workerów jest podana wprost, żeby uniknąć tej samej pułapki 32 procesorów. Pamięć na produkcji urosła w sześć tygodni z 0,19 do 0,77 GB, a Railway rozlicza pamięć za GB-minutę. Restart ogranicza objaw. Przyczyny nie wyjaśnia, co konfiguracja mówi wprost.
3. **Healthcheck przy wdrożeniu sprawdza tylko usługę web.** Wcześniej obejmował Redis i workery Celery. Podczas awarii Redisa Railway zabijał zdrowe kontenery web i awaria Redisa stawała się awarią całego API. Teraz bramka wdrożenia sprawdza bazę i migracje. Pełny healthcheck zostaje do monitoringu. Testy pilnują zestawu sprawdzeń, bo nazwa niepasująca do żadnej wtyczki jest pomijana bez ostrzeżenia.
4. **Limity żądań liczone w pamięci procesu, nie w Redisie.** Awaria Redisa dawała błędy 500 przy rejestracji, resecie hasła i publicznych linkach. Odrzucona opcja: cache, który przy awarii przepuszcza ruch, bo po cichu wyłączyłby limity tam, gdzie są potrzebne. Koszt: przy N workerach limit rośnie N razy.
5. **Połączenia z Redisem mają limity czasu.** Domyślnie klient czeka bez końca, a zawieszony Redis zatrzymałby jedynego workera i całe API. Limit wynosi 2 s, czyli więcej niż 1 s, przez którą kombu czeka na wiadomość z kolejki (brpop). Publikacja ponawia się tylko raz.
6. **Oczekujące rejestracje i zmiany adresu e-mail trzymane w Postgresie.** Gdy leżały w Redisie, jego awaria blokowała rejestrację. Hasło jest haszowane od razu, kod weryfikacyjny też jest przechowywany jako hash.
7. **Maile przez HTTP API Resend zamiast SMTP.** Railway blokuje wychodzący SMTP na porcie 587. Każde zadanie mailowe kończyło się przekroczeniem czasu.
8. **Kroki budowania przeniesione ze startu kontenera do budowania obrazu.** `collectstatic` i `compilemessages` działają w czasie budowania obrazu, z atrapami sekretów tylko na ten krok. Odrzucono `preDeployCommand`, bo działa w osobnym kontenerze i jego pliki nie trafiłyby do aplikacji. Konfiguracja harmonogramu przeszła do usługi Beat, więc awaria Postgresa nie blokuje startu API.
9. **Celowo bez HEALTHCHECK w Dockerfile.** Poprzedni wołał curl, którego w obrazie już nie było, więc nie mógł przejść. Skierowanie go na pełny healthcheck oznaczałoby zdrowy kontener jako niesprawny przy każdym niedziałającym workerze.
10. **Usunięte sprawdzanie workerów Celery.** tracemalloc pokazał, że każde wywołanie `control.inspect()` trwale zostawia w pamięci powiązania kolejek odpowiedzi. Sprawdzono też wariant z jawnym połączeniem: pamięć przeciekała tak samo. Po usunięciu 600 żądań healthchecku trwa 8 s zamiast 79 s.
11. **Healthcheck zostaje wielowątkowy.** Wersję w wątku żądania wypróbowano i wycofano: zamykała połączenie z bazą w trakcie żądania, a 4 testy nie przechodziły.
12. **Odpowiedzi AI zawsze w ścisłym schemacie JSON, każde wywołanie z kosztem.** Dzienny limit na zapytanie ogranicza wydatki.
13. **Jedno polecenie przed wdrożeniem.** Dodanie drugiego zbiegło się z nieudanymi wdrożeniami web w obu środowiskach, bez ani jednej linii logów. Zmianę wycofano, a uzupełnienie danych stało się ręcznym krokiem w instrukcji.

## Działanie na produkcji

**Hosting**

- Railway, pięć usług budowanych z Dockerfile: serwer HTTP, worker Celery, Celery Beat oraz dwie aplikacje frontendowe serwowane jako pliki statyczne.
- Przed nimi stoi Cloudflare. Pliki leżą w Google Cloud Storage.
- Poza produkcją istnieje drugie środowisko Railway.

**Wdrożenia i CI**

- Migracje uruchamiają się przed wdrożeniem. Wdrożenie produkcyjne uruchamiają skrypty przez API Railway.
- GitHub Actions uruchamia osobne zadania dla backendu i frontendu oraz wspólne sprawdzenie pre-commit.
- Backend: MyPy, testy na Postgresie 17 z wymaganym pokryciem co najmniej 85%, kontrola migracji na czystej bazie.
- Frontend: eslint, vitest i próbne budowanie.
- Commity w formacie Conventional Commits, pilnowanym przez hook.

**Monitoring**

- Dwa endpointy healthcheck: `/healthcheck/web/` jako bramka wdrożenia i `/healthcheck/` do monitorowania całości.
- Każdy mail trafia do rejestru, każde wywołanie OpenAI zapisuje się z kosztem.
- Zewnętrznego monitorowania dostępności ani błędów jeszcze nie ma. Instrukcja wycofania samouczka wspomina o Sentry, ale nie jest on podłączony.

**Incydenty i wnioski**

- Awaria Redisa przez healthcheck wyłączyła całe API. Stąd decyzje 3–5.
- Maile w ogóle nie wychodziły, bo Railway blokuje SMTP. Stąd przejście na Resend.
- Pamięć rosła stale, a za pamięć się płaci. Pomogły restarty workera i usunięcie przeciekającego sprawdzenia. Około 600 MB wzrostu pozostaje niewyjaśnione.
- Rejestracja zależała od Redisa, dopóki oczekujące dane nie przeszły do Postgresa.

**Ruch i koszty.** Według komentarza w konfiguracji API obsługuje około 10 tys. żądań miesięcznie. Railway, OpenAI, Resend i Google Cloud kosztują łącznie około 10 USD miesięcznie.

## Wyniki

- Z Konfio korzysta 49 aktywnych hoteli i 8 organizatorów.
- Organizator wysyła średnio 4,5 zapytania.
- Hotele odpowiadają na zapytania średnio w niecałe 10 minut.
- API obsługuje około 10 tys. żądań miesięcznie.
- Liczby na stronie („~5 min”, „1 format”, „0 zł”) opisują produkt, nie jego użycie.
- Konfio działa od kilku miesięcy i przeszło przez nie około 40 ofert. Przychodu z prowizji jeszcze nie ma. Liczba potwierdzonych wydarzeń nie jest publikowana.

## Ograniczenia i dalsze kroki

- Strona wciąż ma oznaczenie BETA.
- Otwarte pytanie to podaż hoteli. Jedna metryka decyduje, kiedy wyłączyć zachętę do wysyłki przez organizatora: gdy automatyczny dobór znajduje dość hoteli. Druga zgłasza do przeglądu udział tej wysyłki poniżej 60%. Przeglądy zaplanowano na 30. i 60. dzień po uruchomieniu.
- W sierpniu 2026 r. trwały jeszcze prace nad stabilnością produkcji: poprawki startu i healthchecku oraz notatki w zadaniach w tle do usunięcia, gdy wdrożenia się ustabilizują.
- W panelu brakuje ponownej wysyłki maili i ponownego uruchomienia analizy AI. Są zapisane jako zadania na później.
- W kodzie czeka porządkowanie: wysyłka maili do poszczególnych odbiorców ma trafić do jednej wspólnej funkcji pomocniczej.
- Zasięg ogranicza się do Polski.
- README frontendu wciąż podaje domenę konfio.com, która należy do innej, niepowiązanej firmy.
- Najbliższy krok to pozyskanie większej liczby hoteli.
