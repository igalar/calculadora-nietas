@echo off
rem Abre la calculadora de las nietas en el navegador de este computador.
rem Deja esta ventana abierta mientras la usas; ciérrala para terminar.
cd /d "%~dp0"
start "" http://localhost:8000
python servidor.py 8000
