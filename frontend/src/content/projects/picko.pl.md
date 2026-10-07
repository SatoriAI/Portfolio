---
title: Picko
slug: picko
period: 2025-12 – ongoing
status: live
role: solo: frontend, backend, baza danych, e-maile, wdrożenie
context: personal
stack: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, Celery, Redis, SvelteKit, TypeScript, Tailwind CSS, Resend, Docker, Railway, Cloudflare
demo: https://picko.world
repository: https://github.com/SatoriAI/Picko
summary: Picko powstało z potrzeby zorganizowania prostego losowania mikołajkowego ze znajomymi. Wystarczy utworzyć losowanie, ustalić termin zapisów i opcjonalny limit ceny prezentu, a następnie udostępnić link uczestnikom. Każdy może zapisać się bez zakładania konta i dodać swoją listę życzeń. Po zakończeniu zapisów uczestnicy otrzymują wyniki losowania mailem.
---

# Picko

## Okres i status

- Pierwszy commit: 1 grudnia 2025. Prawie wszystkie funkcje powstały między 13 a 20 grudnia 2025.
- Serwis trafił do sieci na początku grudnia 2025. Dokładnej daty Dawid nie pamięta.
- Później tylko utrzymanie: 26 sierpnia 2026 obsługa wielu domen frontendu (CORS), 1 września 2026 przejście na jeden proces serwera WWW. To ostatni commit.
- Status: działa pod adresem https://picko.world, po angielsku i po polsku.
- Aplikacja ma charakter sezonowy. Motyw świąteczny włącza się zmienną środowiskową, a według jednego z commitów poza grudniem Picko obsługuje kilka zapytań dziennie.
- Z serwisu korzystano już w sezonie 2025. Dawid wspomina o rzeczywistych przypadkach, które trzeba było obsłużyć narzędziami wiersza poleceń (zob. „Ręczne operacje”).

## Rola i kontekst

- Projekt jednoosobowy. Wszystkie 44 commity są autorstwa Dawida Hanrahana: frontend, backend, baza danych, wysyłka e-maili, motyw świąteczny, pliki wdrożeniowe i narzędzia wiersza poleceń.
- 42 commity są podpisane jego imieniem i nazwiskiem. Pozostałe dwa (commit początkowy z 1 grudnia 2025 i scalenie pull requesta nr 1 z 26 sierpnia 2026) pochodzą z SatoriAI, jego prywatnego konta GitHub, do którego należy repozytorium. Jedynym innym współautorem jest asystent AI Dawida, współtworzący commity dotyczące CORS i jednego procesu serwera.
- W stopce polskiej wersji strony widnieje „Stworzone przez Dawid Hanrahan”. Kod jest na licencji MIT.
- Projekt prywatny. Dawid zbudował Picko dla swoich znajomych. Z serwisu korzystają też inne osoby, co go cieszy. Strona opisuje usługę jako bezpłatną.

## Krótkie podsumowanie

Picko to darmowa aplikacja do losowania mikołajkowego dla przyjaciół, rodzin i współpracowników. Organizator zakłada losowanie z terminem zapisów oraz ewentualnym limitem ceny prezentu i rozsyła jeden link. Uczestnicy zapisują się bez konta i mogą dodać listę życzeń. Po terminie losowanie rusza samo, a każdy poznaje osobę, której kupuje prezent, i jej listę życzeń.

## Problem

Grupa znajomych, rodzina albo zespół w pracy chce zrobić losowanie mikołajkowe. Wynik musi pozostać tajny, a nikt nie powinien musieć się nigdzie rejestrować. Według README brakowało szybkiego sposobu, żeby założyć losowanie, zebrać uczestników i rozesłać im osobiste linki, bez kont i bez zbędnych kroków.

Istniejące narzędzia do losowania mikołajkowego były w ocenie Dawida po prostu zbyt skomplikowane. Picko miało być prostsze.

## Jak to działa dla użytkownika

1. **Organizator zakłada wydarzenie.** Podaje nazwę i termin zapisów. Może też ustalić maksymalną kwotę prezentu (PLN, USD lub EUR) i datę spotkania.
2. **Organizator też może się zapisać.** Po utworzeniu wydarzenia trafia od razu na stronę zapisów.
3. **Uczestnicy zapisują się sami.** Organizator kopiuje link do zapisów i rozsyła go grupie. Każdy podaje:
   - imię,
   - adres e-mail (opcjonalnie), na który przyjdzie wynik,
   - język: polski lub angielski,
   - listę życzeń (opcjonalnie, pozycje po przecinku).
4. **Każdy dostaje własną stronę („Moja karta”).** Jest na niej odliczanie do losowania i prośba, żeby dodać stronę do zakładek.
5. **Strona wydarzenia.** Pokazuje link do zapisów, odliczanie oraz zapisane osoby z ich listami życzeń. Prowadzi do niej przycisk na karcie każdego uczestnika.
6. **Losowanie odbywa się samo, gdy minie termin.** Nikt nie musi niczego klikać. Nikt nie wylosuje samego siebie. Potrzebne są co najmniej dwie osoby. Jeśli jest ich mniej, wszyscy widzą komunikat, że losowanie się nie odbyło, i prośbę o kontakt z organizatorem.
7. **Odkrycie wyniku.** Osoby, które podały e-mail, dostają wiadomość w swoim języku z osobistym linkiem. Ten link albo zapisana karta otwiera animowane pudełko z prezentem, a w nim:
   - komu kupujesz prezent,
   - lista życzeń tej osoby,
   - budżet i data wydarzenia,
   - przypomnienie, żeby zachować to w tajemnicy.

   Jest też link „Dodaj do kalendarza” do Kalendarza Google.

8. **Język i wygląd.** Interfejs jest po polsku i po angielsku i dopasowuje się do języka przeglądarki. Ma przełącznik trybu jasnego i ciemnego oraz motyw świąteczny.

## Opis techniczny

**Cztery części.**

- Serwer SvelteKit (Svelte 5, TypeScript, Tailwind CSS 4, adapter-node).
- API w FastAPI (Python 3.13) z SQLAlchemy 2 w trybie asynchronicznym, asyncpg i migracjami Alembic.
- Worker Celery z Redisem jako brokerem.
- PostgreSQL i Redis.

**Droga zapytania.** Przeglądarka nigdy nie łączy się bezpośrednio z API. Wywołuje trasy `/api/...` na tym samym serwerze SvelteKit, a te przekazują zapytanie do backendu. Przekazywane są tylko metoda, treść i typ treści.

**Model danych.** Cztery tabele:

- **Event:** nazwa, opcjonalna data, budżet (kwota i waluta: EUR, PLN lub USD), termin zapisów, token zapisów, znacznik zakończenia losowania i znacznik wysłania powiadomień.
- **Participant:** imię (unikalne w obrębie wydarzenia), opcjonalny e-mail, język, lista życzeń do 1000 znaków i osobisty token dostępu.
- **Draw:** jedno losowanie na wydarzenie.
- **Assignment:** kto komu daje prezent, z osobnym tokenem do odkrycia wyniku.

Baza sama pilnuje poprawności: ograniczenie CHECK wyklucza wylosowanie samego siebie, a ograniczenia UNIQUE sprawiają, że każdy daje i dostaje prezent dokładnie raz.

**Linki zamiast kont.** Każda rola dostaje link z losowym tokenem (`secrets.token_urlsafe(32)`):

- organizator: link do zapisów,
- uczestnik: osobista strona statusu,
- osoba dająca prezent: link do wyniku z imieniem i listą życzeń obdarowanego oraz budżetem.

**Przebieg losowania.**

- Utworzenie wydarzenia planuje zadanie Celery z opóźnieniem równym czasowi do terminu zapisów plus 5 sekund.
- Zadanie blokuje wiersz wydarzenia (`SELECT … FOR UPDATE`) i losuje tylko wtedy, gdy termin minął i są co najmniej dwie osoby.
- Następnie wysyła każdemu, kto podał e-mail, link do wyniku w jego języku. Osoby bez adresu są pomijane.
- Jeśli zadanie jeszcze się nie wykonało, losowanie uruchamia się przy pierwszym odczycie wydarzenia lub strony uczestnika po terminie.

**Algorytm.** Próbkowanie z odrzucaniem: tasowanie i ponawianie, dopóki nikt nie trafia na siebie. Daje to jednostajnie losowy nieporządek (derangement). Do tasowania służy `random.shuffle`. Moduł `secrets` generuje tylko tokeny w linkach.

**E-maile.** Własny, niewielki klient wysyła wiadomości przez REST API Resend. Każda wiadomość ma część HTML z szablonów dla obu języków (znaki specjalne HTML w wartościach są zamieniane na encje) i część tekstową. Klient ponawia próby przy odpowiedziach 408, 425, 429, 500, 502, 503 i 504 oraz przy błędach sieci. Respektuje nagłówek `Retry-After`, a bez niego stosuje wykładnicze odczekiwanie z losowym rozrzutem (domyślnie do 6 ponownych prób, od 0,5 s do 20 s).

**Pozostałe elementy.**

- Narzędzie wiersza poleceń `picko`: `set-deadline` przesuwa termin i planuje losowanie od nowa, `resend-email` ponownie wysyła wynik jednej osobie.
- `GET /status` do kontroli stanu, dokumentacja API w ReDoc pod `/docs`.
- Języki obsługuje Paraglide (inlang). Strona wyniku ma animację pudełka, konfetti i odliczanie.

## Decyzje inżynierskie

- **Losowanie w zadaniu w tle, nie w zapytaniu.** Losowanie i wysyłka e-maili działają w Celery, więc wolny dostawca poczty nie blokuje zapytania HTTP. Właśnie dlatego wystarcza jeden proces serwera WWW.
- **Opóźnienie zamiast konkretnej godziny.** Zadanie dostaje opóźnienie w sekundach, a nie godzinę wykonania, żeby uniknąć problemów ze strefami czasowymi. Daty bez strefy są wszędzie traktowane jako UTC.
- **Poprawka sytuacji wyścigu przy losowaniu (20 grudnia 2025).** Jeden commit wprowadził trzy zmiany: kolumnę `notified_at`, blokadę wiersza z wcześniejszym wyjściem, gdy powiadomienia już wysłano, oraz `visibility_timeout` Redisa ustawiony na 14 dni. Według Dawida poprawka nie była reakcją na incydent, tylko prawdopodobnie wynikiem przeglądu kodu. Prawdopodobnie chodziło o to, że Redis ponownie dostarcza zadania z długim opóźnieniem, co mogłoby dublować losowania lub e-maile.
- **Losowanie również przy odczycie.** Zgubione zadanie Celery nie zostawia uczestników bez wyniku. Koszt: losowanie może teraz wystartować z dwóch miejsc, a ścieżka przy odczycie nie zakłada blokady.
- **Poprawność w bazie, nie tylko w kodzie.** Ograniczenia CHECK i UNIQUE uniemożliwiają błędne przydziały. Powtórzone imię w wydarzeniu kończy się odpowiedzią HTTP 409.
- **Linki zamiast kont.** Dostęp opiera się na tokenach, których nie da się zgadnąć, osobnych dla każdej roli.
- **Serwer frontendu jako pośrednik do API.** Przeglądarka rozmawia tylko z serwerem SvelteKit, dzięki czemu API pozostaje ukryte przed użytkownikami. Dla Dawida było to w tej aplikacji podstawowe założenie.
- **Własny klient Resend zamiast SDK.** Jawnie obsługuje odpowiedzi 429 i nagłówek `Retry-After`. Nie wynikało to z braków oficjalnego SDK: Dawid napisał go dla przyjemności, bo lubi porządną inżynierię.
- **Wiele domen CORS.** Wcześniej cała zmienna środowiskowa trafiała do listy jako jeden element, więc API obsługiwało dokładnie jeden frontend. Przeniesienie domeny oznaczałoby twarde przełączenie bez okresu przejściowego. Teraz zmienna jest dzielona po przecinkach.
- **Jeden proces Gunicorna.** Drugi proces zajmował pamięć dla ruchu, który nie przychodzi, a Railway nalicza opłaty za zarezerwowaną pamięć RAM co sekundę. Jeden proces oznacza jedno zapytanie naraz. To wystarcza, bo losowanie działa w Celery.

## Działanie na produkcji

- **Hosting:** Railway, trzy usługi budowane z Dockerfile'ów i opisane w plikach `.railway/*.toml`: `backend` (FastAPI z Gunicornem), `celery` (worker) i `frontend`. Każda restartuje się po awarii, maksymalnie 5 razy.
- **PostgreSQL i Redis** również działają na Railway, choć pliki w repozytorium ich nie definiują.
- **Wdrożenie:** migracje Alembic uruchamiają się przed każdym wdrożeniem (`alembic upgrade head`). Kontrola stanu: `/status` dla backendu, `/` dla frontendu. Obrazy instalują zależności z zablokowanych wersji (`uv sync --frozen`, `pnpm install --frozen-lockfile`).
- **Lekcja z Railway:** konfiguracja w repozytorium nadpisuje ustawienia usługi. Liczbę procesów zmieniono najpierw przez API Railway i nie przyniosło to efektu, bo plik `.toml` wciąż ustawiał polecenie startowe. Zmianę trzeba było wprowadzić w repozytorium.
- **Koszty:** poniżej 2 USD miesięcznie. Railway nalicza opłaty za zarezerwowaną pamięć RAM co sekundę, a poza grudniem ruch to kilka zapytań dziennie.
- **Ręczne operacje:** narzędzia do przesuwania terminu, ponownego planowania losowania i ponownej wysyłki e-maila powstały 17 grudnia 2025, w trakcie sezonu. Z tego, co wie Dawid, wszystkie rzeczywiste przypadki zostały prawidłowo obsłużone.
- **Monitoring:** tylko logi aplikacji (structlog) i kontrole stanu Railway. Repozytorium nie konfiguruje śledzenia błędów ani metryk.
- **Jakość kodu:** brak CI w repozytorium. Kontrole to lokalne hooki pre-commit (ruff, ruff-format, codespell). Jedyny test to przykładowy plik Vitest. Backend nie ma testów.

## Wyniki

- Utworzono kilkadziesiąt wydarzeń.
- Z serwisu skorzystało mniej niż 100 różnych użytkowników.
- Serwis działa pod https://picko.world, a kod jest publiczny. Sama strona nie pokazuje statystyk.

## Ograniczenia i dalsze kroki

- **Brak planów rozwoju.** Picko to narzędzie do zabawy i zostaje takie, jakie jest. Repozytorium nie zawiera TODO ani roadmapy.
- **Uczestnicy widzą nawzajem swoje adresy e-mail.** Strona wydarzenia pokazuje adresy wszystkich zapisanych, a karta każdego uczestnika do niej prowadzi. Tak to zaprojektowano.
- **Brak wykluczeń.** Losowanie gwarantuje tylko, że nikt nie trafi na siebie. Nie da się na przykład wykluczyć, żeby partnerzy wylosowali siebie nawzajem.
- **Sztywne limity:** trzy waluty (PLN, USD, EUR), dwa języki, e-maile tylko w szablonie świątecznym.
- **Mały margines na pomyłki.** Zapisy zamykają się na stałe w chwili terminu. Kto nie podał e-maila, musi mieć zapisany link do swojej karty. Zgubionego linku nie da się odzyskać.
- **Brak narzędzi dla organizatora w interfejsie.** Przesunięcie losowania i ponowna wysyłka e-maila są dostępne tylko w wierszu poleceń administratora.
- **Uwagi z przeglądu kodu (niezweryfikowane uruchomieniem):**
  - linki w e-mailach budowane są z listy domen CORS, więc przy więcej niż jednej domenie byłyby błędne,
  - losowanie przy odczycie nie zakłada blokady wiersza.
- **Testy:** praktycznie brak testów automatycznych i brak CI.
