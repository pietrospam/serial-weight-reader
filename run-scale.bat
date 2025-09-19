@echo off
REM Serial Weight Reader - Windows Launcher
REM Usage: run-scale.bat [config-file]

echo.
echo ========================================
echo    Serial Weight Reader v1.0.0
echo ========================================
echo.

if "%1"=="" (
    echo Using default config.properties...
    dist\serial-weight-reader.exe config.properties
) else (
    echo Using config file: %1
    dist\serial-weight-reader.exe "%1"
)

echo.
echo Press any key to exit...
pause >nul