ECHO OFF
CLS
.\python -m pip install --upgrade pip
ECHO Uninstalling existing Torch
.\python.exe -m pip uninstall torch -y
.\python.exe -m pip uninstall torchaudio -y
.\python.exe -m pip uninstall torchvision -y
ECHO Installing PyTorch
REM .\python -m pip install --target=..\Lib\site-packages --upgrade torch==1.9.1+cu102 torchvision==0.10.1+cu102 torchaudio===0.9.1 -f https://download.pytorch.org/whl/torch_stable.html
.\python.exe -m pip install --upgrade --no-deps --force-reinstall torch torchvision torchaudio  --extra-index-url https://download.pytorch.org/whl/cu118
.\python.exe -m pip install sympy
ECHO The process has been completed!
ECHO Please review the log above for some error
ECHO You can safely close this window anytime
pause