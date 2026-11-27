@echo off
chcp 65001 >nul
REM Richtet die Ausgaben-App ein und startet sie.
REM Voraussetzung: Node.js (LTS) ist installiert, siehe LIESMICH.md.

cd /d "%~dp0"
set "ZIEL=%~dp0..\ausgaben-app"

if exist "%ZIEL%\package.json" (
  echo Projekt gibt es schon in %ZIEL% - ich aktualisiere nur den App-Code.
) else (
  echo Lege das Expo-Projekt an ...
  call npx create-expo-app@latest "%ZIEL%" --template blank-typescript
  if errorlevel 1 goto fehler
)

echo Kopiere den App-Code ...
copy /Y "App.tsx" "%ZIEL%\" >nul
copy /Y "app.json" "%ZIEL%\" >nul
copy /Y "eas.json" "%ZIEL%\" >nul
xcopy /E /I /Y "src" "%ZIEL%\src" >nul

cd /d "%ZIEL%"
echo Installiere die benoetigten Pakete ...
call npx expo install expo-blur expo-status-bar react-native-safe-area-context @react-native-async-storage/async-storage
if errorlevel 1 goto fehler

echo.
echo Fertig. Gleich erscheint ein QR-Code.
echo iPhone: mit der Kamera scannen. Android: in der App "Expo Go" scannen.
echo.
call npx expo start
goto ende

:fehler
echo.
echo Da ist etwas schiefgegangen. Ist Node.js installiert und bist du online?
:ende
pause
