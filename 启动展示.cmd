@echo off
setlocal
set "ATLAS_HTML=%~dp0index.html"
if not exist "%ATLAS_HTML%" goto missing
set "ATLAS_BROWSER="
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "ATLAS_BROWSER=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "ATLAS_BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "ATLAS_BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if exist "%LocalAppData%\Microsoft\Edge\Application\msedge.exe" set "ATLAS_BROWSER=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "ATLAS_BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "ATLAS_BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if /I "%~1"=="/check" goto check
if defined ATLAS_BROWSER goto browser
start "" "%ATLAS_HTML%"
exit /b 0
:browser
start "" "%ATLAS_BROWSER%" --new-window "%ATLAS_HTML%"
exit /b 0
:check
echo HTML=%ATLAS_HTML%
if defined ATLAS_BROWSER echo BROWSER=%ATLAS_BROWSER%
if not defined ATLAS_BROWSER echo BROWSER=Windows default browser
exit /b 0
:missing
echo Please extract the entire ZIP before opening this launcher.
echo Keep this CMD file and index.html in the same folder.
pause
exit /b 1
