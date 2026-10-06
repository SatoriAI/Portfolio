---
title: Czy z ciepła można zbudować inteligencję?
date: 2026-10-03
format: proof
summary: Od jąder ciepła do matematycznych podstaw modeli rozwiązujących równania fizyki.
related: /research
tags: Matematyka, Nauka, AI
figure: heat
---

W Tonym Starku najbardziej fascynuje mnie moment, w którym pomysł zaczyna działać. Najpierw jest pytanie, potem model, obliczenia, prototyp. W końcu coś, co jeszcze chwilę wcześniej istniało tylko w wyobraźni, staje się urządzeniem.

Jako matematyk, badacz i inżynier lubię szukać takich momentów również w nauce. Szczególnie tam, gdzie klasyczna matematyka spotyka się ze współczesną technologią.

Ostatnio takim miejscem okazało się równanie ciepła.

Trudno o bardziej znajomy proces: gorący przedmiot stygnie, temperatura się wyrównuje, lokalna różnica stopniowo wpływa na otoczenie. Ale za tym prostym obrazem kryje się narzędzie, które pozwala opisywać przepływ informacji w przestrzeni.

Nasze pytanie brzmiało: **czy z dyfuzji i kilku prostych operacji można zbudować model odtwarzający rozwiązania bardziej złożonego równania fizycznego?**

## Ciepło jako sposób przekazywania informacji

Wyobraźmy sobie metalową płytę, którą ogrzewamy w jednym punkcie. Po chwili ciepło dociera do sąsiednich miejsc. Później rozchodzi się dalej, a początkowy rozkład temperatury staje się coraz gładszy.

Jądro ciepła opisuje, jak początkowe ogrzanie jednego miejsca wpływa na temperaturę w innym miejscu po zadanym czasie. Znając je, możemy wyznaczyć ewolucję całego rozkładu temperatury.

Możemy też spojrzeć na ten proces szerzej. Zamiast temperatury wprowadźmy dowolną funkcję: sygnał, pole pomiarowe albo informację zapisaną na powierzchni. Dyfuzja będzie ją rozprowadzać zgodnie z geometrią przestrzeni.

Krótki czas dyfuzji pozwala uchwycić lokalne otoczenie. Dłuższy łączy informacje z bardziej odległych obszarów. Czas staje się więc pokrętłem regulującym skalę, w której oglądamy dane.

To ciekawy punkt wyjścia do projektowania modeli. Operacje oparte na dyfuzji pojawiają się już w uczeniu na powierzchniach, między innymi w architekturze [DiffusionNet](https://arxiv.org/abs/2012.00888).

Mnie zainteresowało jednak bardziej podstawowe pytanie: co taki zestaw operacji potrafi reprezentować i jak dokładnie można to uzasadnić?

## Od pojedynczej odpowiedzi do całej reguły

W symulacji fizycznej często znamy właściwości materiału, źródła działające w układzie i równanie opisujące ich związek. Szukamy odpowiedzi: rozkładu temperatury, ciśnienia czy przemieszczeń.

Gdy zmieniamy materiał lub wymuszenie, potrzebujemy nowego rozwiązania.

Chciałbym mieć narzędzie, które odtwarza całą zależność między opisem problemu a jego rozwiązaniem. Matematycznie taka zależność jest operatorem: przyjmuje funkcje i zwraca funkcję.

Właśnie w tym kierunku rozwija się teoria operatorów neuronowych. Ich zadaniem jest uczenie odwzorowań między przestrzeniami funkcji, w szczególności zależności wynikających z równań fizyki. To perspektywa opisana w pracy [Kovachkiego i współautorów](https://www.jmlr.org/papers/v24/21-1524.html).

W naszych rozważaniach skupiliśmy się na matematycznych możliwościach konkretnego zestawu elementów. Udostępniliśmy konstrukcji dyfuzję względem jednego, ustalonego operatora odniesienia, mnożenie funkcji punkt po punkcie oraz proste kombinacje tych operacji.

Parametry wyznaczaliśmy z analizy matematycznej. Na tym etapie niczego nie trenowaliśmy.

## Problem: materiał nie jest wszędzie taki sam

Punktem odniesienia było równanie Darcy’ego:

$$−\text{div}(a∇u) = f.$$

Choć zapis może wyglądać technicznie, jego sens jest przystępny. Funkcja $a$ opisuje lokalną właściwość materiału, na przykład przepuszczalność. Funkcja $f$ określa źródła i ujścia. Szukane $u$ można interpretować jako ciśnienie.

Trudność bierze się z tego, że materiał może zachowywać się inaczej w różnych miejscach. Jedna część łatwo przepuszcza płyn, inna stawia większy opór. Rozwiązanie musi uwzględnić cały ten rozkład.

Tymczasem nasza dyfuzja korzysta z ustalonego operatora odniesienia. Sama nie dostosowuje się do każdej nowej mapy materiału.

Potrzebny jest mechanizm, który połączy informację o materiale z informacją o aktualnym przybliżeniu rozwiązania. W równaniu pojawia się wtedy współdziałanie ich zmian przestrzennych — iloczyn skalarny gradientów.

Jak odtworzyć ten efekt, jeśli konstrukcja nie ma dostępu do operacji obliczania gradientu?

## Najciekawszy moment: porównaj dwie kolejności

Oznaczmy przez $P_t$ operację dyfuzji przez czas $t$. Weźmy dwie funkcje, $b$ i $u$, i wykonajmy dwa doświadczenia.

Najpierw pomnóżmy funkcje, a potem poddajmy wynik dyfuzji. Następnie odwróćmy kolejność: rozprowadźmy każdą funkcję osobno i dopiero wtedy je pomnóżmy.

Wyniki na ogół będą różne.

W tej różnicy ukryta jest informacja o tym, jak zmiany obu funkcji współdziałają. Dla dostatecznie regularnych funkcji, przy małym czasie, otrzymujemy:

$$\frac{P_t(bu) − (P_t b)(P_t u)}{2t} → ∇b · ∇u.$$

To centralna intuicja naszego projektu: **porównując mnożenie przed dyfuzją i po dyfuzji, możemy odzyskać informację o gradientach.**

Podstawowa tożsamość ma klasyczne korzenie. Nasze zadanie polegało na ilościowym wykorzystaniu tego mechanizmu w konstrukcji operatorowej i oszacowaniu błędu, który wprowadza skończony czas dyfuzji.

Najbardziej lubię w tym pomyśle jego oszczędność. Dwie dostępne operacje ujawniają razem informację, której żadna z nich osobno nie dostarcza wprost.

To matematyczny odpowiednik chwili w warsztacie Starka, kiedy okazuje się, że znane podzespoły można połączyć w zupełnie nowy sposób.

## Co udało się uzyskać?

W opracowanym wyniku pokazujemy, że skończona liczba operacji dyfuzji, połączona z mnożeniem punktowym, wystarcza do przybliżania operatora rozwiązania równania Darcy’ego w określonej klasie problemów.

Pracujemy na torusie. Najłatwiej wyobrazić go sobie jako przestrzeń z okresowymi brzegami: wychodząc przez jedną stronę, wracamy przez przeciwną. To pozwala skoncentrować się na głównym mechanizmie bez dodatkowych trudności związanych z warunkami brzegowymi.

Zakładamy też, że współczynnik materiałowy pozostaje dodatni, ma ustalone ograniczenia i spełnia precyzyjny warunek regularności zapisany w ważonej normie współczynników Fouriera.

W tych ramach możemy dobrać konstrukcję do żądanej dokładności. Kontrola obejmuje całą dopuszczalną klasę współczynników i wymuszeń. Błąd mierzymy w normie energetycznej, związanej z gradientem rozwiązania, więc sprawdzamy również jego przestrzenne zmiany.

Konstrukcja rozwija klasyczną metodę iteracyjnego poprawiania przybliżenia. Jej istotą jest analiza pojedynczego kroku: jak zrealizować go przez dyfuzję i mnożenie oraz jak kontrolować powstające błędy. Dowód prowadzimy na poziomie funkcji i operatorów, bez wcześniejszego obcinania problemu do skończonego zestawu modów.

## Dowód spotyka komputer

Twierdzenie o możliwości reprezentacji to dopiero część historii. Jako inżynier chcę jeszcze wiedzieć, co dzieje się podczas obliczeń.

W opisanych eksperymentach konstrukcja osiągała założoną dokładność przy umiarkowanych wymaganiach. Przy bardziej wymagających ustawieniach ujawniła się jednak wrażliwość na błędy arytmetyki komputerowej.

Powód widać w naszej kluczowej formule. Dla bardzo małego czasu dyfuzji odejmujemy dwie niemal identyczne wartości, a następnie dzielimy różnicę przez małą liczbę. Komputer przechowuje liczby ze skończoną precyzją, więc część potrzebnej informacji może zniknąć podczas odejmowania.

Dochodzi do tego koszt rozdzielczości. Krótki opis konstrukcji może wymagać bardzo szczegółowej reprezentacji funkcji, aby rzeczywiście uzyskać gwarantowaną dokładność.

To ważna lekcja z tych badań: liczba parametrów opisujących model i koszt jego wykonania odpowiadają na dwa różne pytania. Nasz wynik daje matematyczną gwarancję reprezentacji. Praktyczna szybkość, stabilność oraz możliwość skutecznego uczenia wymagają dalszej pracy.

## Dlaczego chcę iść dalej?

Najbardziej przyciąga mnie perspektywa przeniesienia tego mechanizmu na bardziej złożone geometrie. Dyfuzja jest naturalna także na zakrzywionych powierzchniach i w szerszych strukturach matematycznych. Być może pozwoli budować modele korzystające bezpośrednio z geometrii problemu.

W materiałach mamy kandydacki argument dla takiego rozszerzenia, ale wymaga on dalszej weryfikacji. Traktuję go jako otwarty kierunek badań.

Kolejne pytania są równie konkretne: jak ograniczyć utratę precyzji? Jak dobierać czasy dyfuzji do obliczeń? Czy mechanizm można wykorzystać w uczonym modelu i zachować przy tym użyteczne gwarancje?

Właśnie takie przejście — od intuicji, przez dowód, do działającej technologii — fascynuje mnie najbardziej.

Do warsztatu Tony’ego Starka jeszcze daleko. Ale pomysł, że zwykłe rozchodzenie się ciepła może pomóc budować modele rozumiejące strukturę równań fizyki, zdecydowanie zasługuje na miejsce na mojej tablicy.
