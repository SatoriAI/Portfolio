---
title: AdLume
slug: adlume
period: 2025-03 – 2026-08
status: pre-launch
role: "Współzałożyciel i specjalista AI w trzyosobowym zespole założycielskim; zbudował Lumy, agenta AI do obsługi kont Google Ads"
context: "Komercyjny: startup, którego Dawid był współzałożycielem"
stack: Python, Django, Celery, PostgreSQL, Redis, LangGraph, Pipedream, Railway, Google Cloud
demo: https://adlume.co
repository: private
summary: Lumy od AdLume to asystent AI dla osób prowadzących płatne kampanie reklamowe. Działa jako wtyczka do Slacka i łączy się z kontami Google Ads lub Meta Ads, by tworzyć i stale monitorować kampanie. Zmiany wprowadza samodzielnie lub proponuje je na Slacku i prosi o zgodę. Lumy zarządzał około 30 kontami Google Ads, a dzisiaj na liście oczekujących jest już ponad 750 osób.
---

# AdLume

## Okres i status

- Dawid pracował nad AdLume od marca 2025 do sierpnia 2026, kiedy odszedł z zespołu. Repozytorium jest prywatne, więc historii commitów nie da się pokazać.
- Dawid pracował nad wcześniejszą wersją produktu. Obecna wersja jest nowsza i korzysta z części elementów, które zbudował.
- Regulamin i polityka prywatności obowiązują od 25 czerwca 2026 r. Ostatnio zaktualizowano je 29 września 2026 r.
- Status: przed startem. Strona zapowiada, że AdLume „wkrótce się otworzy”, i zaprasza na listę oczekujących. Osoby z listy dostaną wcześniejszy dostęp i cenę dla pierwszych klientów.
- Strona adlume.co działa. Są na niej strona główna, blog z 47 wpisami (ostatni z 11 września 2026 r.) i dokumenty prawne.
- Data startu nie jest znana. Dawid spodziewa się, że produkt kiedyś wystartuje.

## Rola i kontekst

- AdLume założyło trzech wspólników: prezes, który prowadził też marketing, dyrektor techniczny i Dawid.
- Dawid był współzałożycielem i specjalistą od AI. Odpowiadał za zbudowanie Lumy, agenta AI, który obsługuje konta Google Ads.
- To projekt komercyjny. Jako operatora i administratora danych strona podaje jednoosobową działalność gospodarczą zarejestrowaną w Polsce i prowadzoną pod nazwą AdLume.

## Krótkie podsumowanie

Lumy od AdLume łączy się z kontem Google Ads lub Meta Ads przez logowanie u dostawcy, bez podawania hasła. Sprawdza kampanie, także cyklicznie, niczego przy tym nie zmieniając. Poprawki proponuje na Slacku i wprowadza je pojedynczo, każdą dopiero za zgodą użytkownika. Jest dla osób prowadzących płatne reklamy. Jeszcze przed startem, z listą oczekujących.

## Problem

Kto prowadzi kampanie w Google Ads lub Meta Ads, sam przegląda listę poprawek w panelu reklamowym i sam je wprowadza. Tak ten problem opisuje strona AdLume.

Według regulaminu z produktu mogą korzystać osoby prywatne oraz osoby działające w imieniu firmy, agencji lub klienta. Blog pisze do specjalistów od kampanii efektywnościowych, agencji oraz zespołów B2B i e-commerce. Zespół najpierw celował w agencje, a później uznał, że lepszym wyborem są klienci końcowi.

Źródła nie podają, jak duży jest ten problem.

## Jak to działa dla użytkownika

Kroki poniżej opisują obecną wersję, przedstawioną na stronie i w dokumentach prawnych.

1. Użytkownik zapisuje się na listę oczekujących.
2. Dodaje Lumy do Slacka. Tu Lumy współpracuje z użytkownikiem.
3. Łączy konto Google Ads lub Meta Ads. Loguje się u dostawcy i nadaje uprawnienia, bez podawania hasła. Konto Meta można połączyć przez zewnętrzny łącznik, z którego korzystają obecni klienci, albo bezpośrednio. Połączenie bezpośrednie jest jeszcze testowane.
4. Lumy sprawdza kampanie, także według harmonogramu. Samo sprawdzanie tylko odczytuje dane.
5. Lumy przysyła na Slacku propozycję poprawki.
6. Użytkownik zatwierdza każdą zmianę osobno i dopiero wtedy Lumy ją wprowadza. Zgoda na ogólny zakres działania nie obejmuje z góry przyszłych zmian. Polityka prywatności wspomina jeszcze o włączaniu niektórych typów zmian w ustawieniach uprawnień. W wersji, nad którą pracował Dawid, rzeczywiście dało się z góry włączyć całe typy zmian.
7. Przy bezpośrednim połączeniu z Meta jedyna dostępna zmiana to wstrzymanie lub wznowienie kampanii.
8. Lumy wysyła na Slacku link do panelu w przeglądarce. W ustawieniach jest opcja „Usuń wszystko”. Anuluje plan, odbiera dostęp do Google, usuwa dane przestrzeni roboczej i usuwa Lumy ze Slacka.

Ceny w regulaminie dla zamkniętej bety, do której trafia się z zaproszenia:

- pierwsze kwalifikujące się konto reklamowe dostaje jeden bezpłatny audyt;
- potem 10 USD daje 7 dni dostępu, a całe 10 USD trafia na saldo na użycie AI, bez marży;
- opcjonalny plan kosztuje 49 USD miesięcznie;
- przez 30 dni można odzyskać pieniądze.

## Opis techniczny

Trzeba tu rozdzielić dwie wersje: tę, którą budował Dawid, i obecną, opisaną w polityce prywatności z 29 września 2026 r. Obecna wersja jest nowsza i korzysta z części elementów wersji Dawida.

**Wersja, którą budował Dawid**

- **Backend:** Django z bazą PostgreSQL. Zadania w tle obsługiwały Redis i Celery.
- **Agent AI:** Lumy powstał na LangGraph, który był jednym z kluczowych frameworków projektu.
- **Inne narzędzia:** w projekcie korzystano też z Pipedream.
- **Droga zapytania:**
  1. Wiadomość ze Slacka trafia do warstwy, która przyjmuje ruch z zewnątrz.
  2. Ta warstwa tworzy zadanie Celery.
  3. Worker pobiera zadanie z kolejki i uruchamia przetwarzanie w LangGraph.
  4. Pierwszy węzeł załatwia proste sprawdzenia, na przykład czy pytanie dotyczy tematu.
  5. Jeśli warunki są spełnione, sterowanie przejmuje „węzeł mózgu”, który ma do dyspozycji narzędzia i podagentów.
  6. Powstaje odpowiedź, a warstwa wyjściowa wysyła ją do właściwego dostawcy, na przykład na Slacka. Obsługiwani byli też inni dostawcy.
- **Hosting:** produkcja na Railway, środowisko testowe (staging) na maszynie wirtualnej w Google Cloud.

**Obecna wersja (polityka prywatności z 29 września 2026 r.)**

- **Backend, baza danych, logi, e-maile transakcyjne i wywołania modelu:** AWS.
- **Analiza AI:** modele Anthropic przez Amazon Bedrock w UE.
- **Interfejs:** Slack służy do rozmowy, zatwierdzania zmian i powiadomień.
- **Połączenia z platformami reklamowymi:** Google Ads bezpośrednio przez OAuth i API dostawcy. Meta Ads przez Windsor.ai, który łączy konto, pobiera dane i wprowadza zatwierdzone zmiany. Połączenie bezpośrednie z Meta jest w testach.
- **Strona internetowa, dostarczanie treści, DNS i ochrona:** Cloudflare.
- **Pozostali dostawcy:** Stripe (płatności), MailerLite (e-mail marketing), GA4, PostHog i Meta Pixel (analityka).
- **Przetwarzane dane:**
  - z kont reklamowych: nazwy, ustawienia, struktura i status kampanii, budżety, stawki, grupy odbiorców, słowa kluczowe, wyświetlenia, kliknięcia, wydatki, konwersje i przychód;
  - ze Slacka: identyfikatory przestrzeni roboczej, kanałów i rozmów oraz wiadomości, polecenia, zatwierdzenia, pliki i historia interakcji.
- **Co trafia do modelu:** prompty, kontekst firmy, dane konta i polecenia użytkownika. Według polityki produkt celowo nie wysyła surowych danych logowania, tokenów OAuth, kluczy API ani numerów kart.
- **Tokeny dostępu:** Meta i Google są przechowywane w bazie AWS z kontrolą dostępu i szyfrowaniem przez AWS Key Management Service.

Harmonogram sprawdzeń, model danych oraz sposób zapisu i audytu propozycji nie są publikowane.

## Decyzje inżynierskie

Nie ma dokumentów z decyzjami, więc nie da się podać odrzuconych wariantów. Poniższe decyzje opisuje polityka prywatności obecnej wersji. Decyzje o osobnej zgodzie na każdą zmianę, o działaniu tylko na Slacku oraz o Bedrocku i Windsor.ai zapadły bez udziału Dawida. Ich uzasadnienie i odrzucone opcje nie są publikowane.

- **Zgoda człowieka przed każdą zmianą.** Każda zmiana w połączonym koncie wymaga osobnej zgody, także zmiana rutynowa. W wersji Dawida można było z góry włączyć całe typy zmian.
- **Slack zamiast osobnego panelu.** Produkt działa obecnie tylko na Slacku. Wersja Dawida mogła odpowiadać także przez innych dostawców.
- **OAuth zamiast haseł.** AdLume nie prosi o hasło do Google. Dostęp nadaje się i odbiera w systemie dostawcy.
- **Przetwarzanie AI w UE.** Modele Anthropic przez Amazon Bedrock.
- **Meta przez Windsor.ai, Google bezpośrednio.**
- **Bez sekretów w logach.** W polityce prywatności AdLume zobowiązuje się nie zapisywać w logach surowych danych logowania, tokenów OAuth ani kluczy API.

## Działanie na produkcji

- **Hosting wersji Dawida:** produkcja na Railway, staging na maszynie wirtualnej w Google Cloud.
- **Hosting obecnej wersji:** według polityki prywatności backend, baza, logi, e-maile i wywołania modelu działają na AWS, a strona na Cloudflare.
- **Kopie zapasowe (obecna wersja):** dane z bazy można odtworzyć z kopii przez 35 dni.
- **Logi aplikacji (obecna wersja):** przechowywane najwyżej 30 dni.
- **Bezpieczeństwo według polityki:** szyfrowany ruch produkcyjny, kontrola dostępu do systemów produkcyjnych, tokeny szyfrowane przez AWS KMS.
- **Użytkownicy:** produkt nie jest jeszcze otwarty publicznie. Gdy Dawid był w zespole, Lumy obsłużył około 30 kont.
- **CI i testy (wersja Dawida):** standardowy pipeline CI/CD, pipeline ewaluacyjny sprawdzający decyzje Lumy oraz standardowe testy end-to-end.
- **Wdrożenia (wersja Dawida):** automatyczne. Railway sam wdrażał produkcję, a staging na maszynie wirtualnej – skrypt napisany przez Dawida.
- **Koszty (wersja Dawida):** około 30 dolarów miesięcznie za produkcję i kilka dolarów za staging.
- **Incydenty:** nie było żadnych, gdy Dawid był w zespole.

## Wyniki

- Gdy Dawid był w zespole, Lumy obsłużył około 30 kont. To jego szacunek.
- Według strony głównej na listę oczekujących zapisało się ponad 750 osób.
- Liczba aktywnych użytkowników, obsługiwany budżet reklamowy, liczba wprowadzonych zmian i dostępność nie są publikowane.

## Ograniczenia i dalsze kroki

- Produkt nie jest jeszcze dostępny publicznie. Jest lista oczekujących, a start zapowiedziano na „wkrótce”, bez konkretnej daty.
- Obsługuje tylko Google Ads i Meta Ads, i tylko przez Slacka. Inne kanały i integracje „mogą zostać dodane później”.
- Bezpośrednie połączenie z Meta jest w testach i pozwala tylko wstrzymać lub wznowić kampanię.
- Odebranie dostępu w ustawieniach Google lub Meta nie usuwa danych, które AdLume już ma. Usunięte dane można odtworzyć z kopii zapasowych przez 35 dni.
- Jeśli usuwanie danych zostanie przerwane w połowie, kończy się je ręcznie.
- Dawid nie wie obecnie, jakie są dalsze plany AdLume.
- Co Dawid zrobiłby inaczej: zaprojektowałby architekturę Lumy inaczej, a kilka niezbędnych sprawdzeń zakodowałby na sztywno, zamiast zostawiać je modelowi.
