@echo off

set SKETCH_PATH=c:\Users\de8827\bin

if "%1"=="onepage" goto onepage

:individual

rem frustum figures
for %%X in (T U V W) do (
  %SKETCH_PATH%\sketch -D %%X tsmf.sv -o fig%%X.tex
)

rem transform figures
for %%X in (A B C D E F G H) do (
  %SKETCH_PATH%\sketch -D %%X tsmx.sv -o fig%%X.tex
)

goto done

:onepage
%SKETCH_PATH%\sketch -T -D onepage tsmx.sv -o tsmx.tex
%SKETCH_PATH%\sketch -T -D onepage tsmf.sv -o tsmf.tex

:done
