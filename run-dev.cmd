@echo off
cd /d "%~dp0"
set PATH=%~dp0.node;%PATH%
"%~dp0.node\node.exe" "%~dp0.node\node_modules\npm\bin\npm-cli.js" run dev
