# Lost Memories - Straight 3D Path

Rechte 3D-route zonder bochten.

Open `index.html` met Live Server.

Aanpassen:
- Camera/POV: `style.css` bij `:root`
  - `--player-screen-y`
  - `--tilt-angle`
  - `--camera-distance`
- Puzzelposities: `script.js` bij `placePuzzleButtons()`
- Stopmomenten: `script.js` bij `pathStages`

Update: het pad is breder en duidelijk bruin gemaakt in `.main-path` en `.inner-path`.

Update:
- Het pad is langer gemaakt: SVG viewBox/world height is nu 9000px hoog.
- De rechte route loopt van y=8800 naar y=200.
- De camera loopt langzamer over het pad via `WALK_DURATION = 9000` in script.js.
- Verhoog `WALK_DURATION` voor nog langzamer lopen.
