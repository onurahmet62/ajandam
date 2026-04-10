@echo off
echo ========================================
echo   Ajandam Desktop Build
echo ========================================
echo.

REM 1) Frontend build
echo [1/4] Frontend derleniyor...
cd /d "%~dp0client"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo HATA: Frontend build basarisiz!
    pause
    exit /b 1
)
echo Frontend build OK.
echo.

REM 2) Copy frontend build to backend wwwroot
echo [2/4] Frontend dosyalari backend'e kopyalaniyor...
cd /d "%~dp0api\Ajandam.API"
if exist wwwroot rmdir /s /q wwwroot
mkdir wwwroot
xcopy /s /e /q "%~dp0client\dist\*" wwwroot\
echo Kopyalama OK.
echo.

REM 3) Backend publish (self-contained)
echo [3/4] Backend derleniyor (self-contained)...
cd /d "%~dp0api"
dotnet publish Ajandam.API/Ajandam.API.csproj -c Release -r win-x64 --self-contained true -o publish /p:PublishSingleFile=false
if %ERRORLEVEL% neq 0 (
    echo HATA: Backend publish basarisiz!
    pause
    exit /b 1
)
echo Backend publish OK.
echo.

REM 4) Electron package
echo [4/4] Electron ile paketleniyor...
cd /d "%~dp0electron"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo HATA: Electron build basarisiz!
    pause
    exit /b 1
)
echo.
echo ========================================
echo   Build tamamlandi!
echo   Installer: electron\dist\
echo ========================================
pause
