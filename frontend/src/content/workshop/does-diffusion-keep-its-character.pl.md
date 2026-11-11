---
title: Jedna fala przeciw twierdzeniu
date: 2026-10-20
format: proof
summary: Jak jedna fala przy granicy rozdzielczości siatki obaliła nasze twierdzenie i co zostało po naprawie.
related: /research
tags: Matematyka, Nauka, AI
figure: bandedge
---

W warsztacie Tony’ego Starka najwięcej uczą próby, które kończą się na ścianie. W matematyce taką próbą jest kontrprzykład. Ten trafił w twierdzenie, które 14 października uważaliśmy za główny wynik drugiej pracy o modelach budowanych z dyfuzji.

## Co twierdziliśmy

W [poprzedniej notatce](/workshop/intelligence-from-heat) opisywałem konstrukcję, która z dyfuzji i mnożenia funkcji składa przybliżone rozwiązanie równania Darcy’ego. Ma budowę warstwową: pierwsza warstwa rozwiązuje równanie dla materiału jednorodnego, kolejne poprawiają wynik o to, czym prawdziwy materiał się od niego różni.

Druga praca pyta, co się z tą konstrukcją dzieje po przeniesieniu z przestrzeni ciągłej na siatkę o oczku $h$. Funkcje zastępujemy średnimi w komórkach. Operator z równania, który mierzy, jak mocno funkcja się wygina, zastępujemy jego siatkowym odpowiednikiem, porównującym wartości w sąsiednich komórkach. Parametry zostawiamy bez zmian.

W notatkach roboczych mieliśmy na to twierdzenie, w dowolnym wymiarze: dla każdego wejścia z $L^2$, czyli bez żadnych założeń o gładkości, wynik na siatce różni się od wyniku ciągłego, uśrednionego w tych samych komórkach, o wielkość rzędu $h^2$. To zbieżność drugiego rzędu: dwa razy gęstsza siatka, cztery razy mniejszy błąd. Obietnica była mocna, bo obejmowała także dane poszarpane, na przykład zaszumiony pomiar albo źródło o ostrych krawędziach.

Błąd mierzyliśmy w normie energetycznej. Liczy się w niej nie tylko to, o ile wynik się myli, ale i to, o ile myli się jego nachylenie.

Przed spisaniem manuskryptu komplet twierdzeń dostał do recenzji model językowy. Nie brał udziału w budowaniu dowodów i miał traktować każde stwierdzenie jako niesprawdzone.

Werdykt: narzędzia dowodu są poprawne, główne twierdzenie jest fałszywe.

## Jedna fala

Kontrprzykład mieści się w kilku linijkach i w jednym wymiarze: na odcinku długości jeden z okresowymi brzegami, podzielonym na $n$ komórek o szerokości $h = 1/n$.

Bierzemy materiał jednorodny. Poprawki nie mają wtedy czego poprawiać i z całej konstrukcji zostaje pierwsza warstwa. Rozwiązać równanie to odwrócić operator, więc ta warstwa jest jego przybliżoną odwrotnością. Na wejście podajemy jedną falę tuż poniżej granicy rozdzielczości: ma ona $n/2 − 1$ oscylacji, o jedną mniej, niż siatka jest w stanie pomieścić.

Siatka robi z taką falą dwie rzeczy.

Najpierw ją uśrednia. W każdej komórce mieści się prawie pół oscylacji, więc średnia wypada niżej niż grzbiet fali. Przy samej granicy rozdzielczości zostaje $2/π$ jej wysokości, czyli około 64%.

![Fala o pięciu oscylacjach na okresowym odcinku podzielonym na dziesięć komórek i jej średnie w komórkach](/figure/wave "Fala o pięciu oscylacjach na dziesięciu komórkach, czyli dokładnie na granicy rozdzielczości. Grube odcinki to średnie w komórkach, linia przerywana to fala, jaką widzi siatka: zostaje 64% wysokości. Kontrprzykład bierze falę o jedną oscylację rzadszą, żeby siatka nie myliła jej z lustrzanym odbiciem; na gęstej siatce ta jedna oscylacja nie robi różnicy.")

Potem działa na nią operatorem siatkowym. Na pojedynczej fali każdy z obu operatorów robi rzecz prostą: mnoży ją przez liczbę, tym większą, im fala krótsza. Na długich falach obie liczby są prawie równe. Im krótsza fala, tym bardziej operator siatkowy zostaje w tyle, a przy granicy rozdzielczości oddaje już tylko $4/π^2$ tego, co ciągły, czyli około 41%.

![Działanie operatora siatkowego na falę jako część działania operatora ciągłego, w zależności od liczby oscylacji; krzywa kończy się na 41%](/figure/symbol "Jaką część działania operatora ciągłego oddaje operator siatkowy na coraz krótszych falach, tu na siatce o dziesięciu komórkach. Na każdej siatce krzywa kończy się na 41%; tam leży kontrprzykład.")

Z tych dwóch liczb składa się cały rachunek. Naszą falę operator ciągły mnoży przez $π^2/h^2$, a siatkowy przez $4/h^2$. Odwrotności mnożą przez odwrotności tych liczb, więc różnią się o $(1/4 − 1/π^2) h^2$, czyli około $0,149 h^2$. To drugi rząd, zgodnie z twierdzeniem.

Norma energetyczna liczy jednak także nachylenie, a ta fala zmienia się prawie tak szybko, jak siatka pozwala. Na siatce nachylenie mierzy pierwiastek z $4/h^2$, czyli $2/h$, i przez tyle trzeba różnicę pomnożyć. Uśrednianie zostawia z fali $2/π$. Razem

$$\frac{4}{π}(\frac{1}{4} − \frac{1}{π^2}) h,$$

czyli około $0,189 h$. To pierwszy rząd: dwa razy gęstsza siatka, błąd tylko dwa razy mniejszy. I to dla wejścia o normie jeden, w zakresie parametrów, w którym twierdzenie miało obowiązywać.

## Policz, żeby uwierzyć

Nie przyjęliśmy tego na słowo. Odtworzyliśmy rachunek niezależnie, a potem policzyliśmy tę samą wielkość z parametrami wziętymi z pierwszej pracy dla dokładności $ε = 0,01$. Warstwa odwracająca jest wtedy sumą 94 dyfuzji o różnych czasach, z których najkrótszy jest rzędu $10^{−13}$.

| Komórek siatki, n | Błąd podzielony przez h |
| ----------------: | ----------------------: |
|                64 |                  0,1870 |
|               128 |                  0,1882 |
|               256 |                  0,1888 |
|               512 |                  0,1890 |
|              1024 |                  0,1892 |
|              2048 |                  0,1892 |

Gdyby twierdzenie było prawdziwe, liczby w prawej kolumnie malałyby o połowę z każdym wierszem. Stoją w miejscu, a dokładniej podchodzą od dołu do 0,1893, bo nasza fala leży o jedną oscylację poniżej granicy i ta jedna oscylacja znaczy coraz mniej.

To nie jest symulacja obarczona błędem pomiaru. Dla jednej fali wszystko sprowadza się do sumy 94 składników, którą liczy się wprost.

## Gdzie dowód przepuścił tę falę

W dwóch miejscach.

Pierwsze to parametr. Dyfuzja o czasie $t$ wygładza wszystko, co drobniejsze niż pierwiastek z $t$. Przyjęliśmy, że najkrótszy czas w warstwie odwracającej jest dłuższy niż $h^2$, czyli że każda z jej dyfuzji stłumi fale przy granicy rozdzielczości. Wartość pochodziła z naszego streszczenia pierwszej pracy, a nie z jej tekstu. W tekście ten czas jest rzędu $10^{−13}$, o sześć rzędów wielkości mniej niż $h^2$ na najgęstszej siatce z tabeli. Tych fal nic nie tłumi.

Drugie to poprawny argument użyty o krok za wcześnie. Wszystko, co konstrukcja wytwarza po drodze, jest gładkie, bo pierwsza warstwa wygładza dane, więc drobnych oscylacji tam nie ma. To prawda dla wszystkiego, co dzieje się po pierwszej warstwie. Sama pierwsza warstwa dostaje jednak surowe wejście.

Reszta wyszła z recenzji cało, także warstwy mnożące, które wymagały osobnego dowodu, bo średnia iloczynu to nie iloczyn średnich. Błąd siedział wyłącznie na wejściu.

## Co zostało po naprawie

Naprawa to jedno założenie: wejście nie może być dowolnie poszarpane. Jego pochodna też ma należeć do $L^2$ (jedna słaba pochodna). Norma energetyczna kosztuje czynnik $1/h$, a ta pochodna go spłaca, i wraca drugi rząd. Pomiędzy jest cała skala. Jeśli gładkość wejścia mierzyć liczbą $s$ od zera (surowe dane) do jedności (jedna pochodna), błąd maleje jak

$$h^{1+s}.$$

Kontrprzykład nie trafił do kosza. Jest w pracy jako twierdzenie: dla surowych danych lepszego rzędu niż pierwszy udowodnić się nie da, i widać to już w jednym wymiarze. Dowód daje ostrożniejszą stałą, $0,08$ zamiast $0,189$, bo ma obowiązywać na każdej dopuszczalnej siatce, a nie tylko na bardzo gęstych.

Druga runda recenzji znalazła jeszcze dziurę w samej naprawie. Twierdzenie ma działać w każdym wymiarze, a nasze sumowanie po falach, które siatka myli ze sobą, rozbiegało się od wymiaru czwartego. Tym razem wystarczyło poprawić dowód; teza się utrzymała.

Fałszywe twierdzenie przeżyło jeden dzień, w notatkach roboczych; do manuskryptu nie trafiło. Co praca mówi dzisiaj, opisuję w [Badaniach](/research).

## Co z tego zabieram

„Dla każdego wejścia” to najdroższe słowa w twierdzeniu. Zbieżność na gładkich danych ich nie sprawdza; sprawdza je dopiero najgorsza fala, jaką siatka potrafi pomieścić.

Parametry poprzedniej pracy czyta się z jej tekstu, także wtedy, gdy samemu się ją napisało.

Recenzent, który nie budował dowodu, ma jedną przewagę: nie wie, które kroki „na pewno działają”. Jego kontrprzykład był na tyle mały, że dało się go sprawdzić ręcznie, i dopiero wtedy wycofaliśmy twierdzenie.

U Starka test, który kończy się na ścianie, też jest wynikiem. Nasza ściana stoi dziś w pracy jako twierdzenie o tym, czego siatka dla surowych danych dać nie może.
