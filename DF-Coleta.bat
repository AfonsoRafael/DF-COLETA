@echo off
rem ===========================================================================
rem  DF-Coleta.bat — abre o painel de controle do DF Coleta
rem  (alternativa ao DF-Coleta.exe; os dois fazem a mesma coisa)
rem ===========================================================================
title DF Coleta - central de controle
cd /d "%~dp0"
chcp 65001 >nul

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\DF-Coleta.ps1" %*

if errorlevel 1 (
    echo.
    echo  O painel terminou com erro. Pressione qualquer tecla para fechar...
    pause >nul
)
