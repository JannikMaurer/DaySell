@echo off
chcp 65001 >nul
REM Installiert die Pakete (nur beim ersten Mal) und startet die Ausgaben-App.
REM Voraussetzung: Node.js (LTS) ist installiert, siehe LIESMICH.md.

cd /d "%~dp0"

if not exist "node_modules" (
  echo Installiere die benoetigten Pakete, das dauert beim ersten Mal ein paar Minuten ...
  call npm install
  if errorlevel 1 goto fehler
)

echo.
echo Gleich erscheint ein QR-Code.
echo iPhone: mit der normalen Kamera scannen und "In Expo Go oeffnen" tippen.
echo Android: in der App "Expo Go" auf "Scan QR code" tippen.
echo.
call npx expo start
goto ende

:fehler
echo.
echo Da ist etwas schiefgegangen. Ist Node.js installiert und bist du online?
:ende
pause
