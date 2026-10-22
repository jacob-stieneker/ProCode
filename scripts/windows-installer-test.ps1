param([ValidateSet('Install', 'Reinstall', 'Uninstall')][string]$Action = 'Install')
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_OS -ne 'Windows') {
  throw 'Installer lifecycle checks run only in the disposable Windows CI machine.'
}
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$installer = (Resolve-Path "release/windows/ProCode-$version-windows-x64-setup.exe").Path
$installDir = Join-Path $env:RUNNER_TEMP 'ProCode Installed'
$executable = Join-Path $installDir 'ProCode.exe'
$sentinel = Join-Path $env:APPDATA 'ProCode/installer-preservation-check.txt'
$shortcut = Join-Path $env:APPDATA 'Microsoft/Windows/Start Menu/Programs/ProCode.lnk'

function Invoke-Setup {
  $result = Start-Process -FilePath $installer -ArgumentList "/S /D=$installDir" -Wait -PassThru
  if ($result.ExitCode -ne 0) { throw "Installer exited with $($result.ExitCode)" }
  if (!(Test-Path $executable)) { throw 'Installed executable is missing.' }
  if (!(Test-Path $shortcut)) { throw 'Start menu shortcut is missing.' }
  if ((Get-Content $sentinel -Raw).Trim() -ne 'preserve-saved-work') {
    throw 'Installer changed existing app data.'
  }
}
if ($Action -eq 'Install') {
  $expected = (Get-Content "$installer.sha256").Split(' ')[0]
  if ((Get-FileHash $installer -Algorithm SHA256).Hash -ne $expected) {
    throw 'Installer checksum does not match.'
  }
  New-Item (Split-Path $sentinel) -ItemType Directory -Force | Out-Null
  Set-Content $sentinel 'preserve-saved-work'
  Invoke-Setup
  "PROCODE_DESKTOP_EXECUTABLE=$executable" | Out-File $env:GITHUB_ENV -Append -Encoding utf8
} elseif ($Action -eq 'Reinstall') {
  Invoke-Setup
} else {
  $uninstaller = Join-Path $installDir 'Uninstall ProCode.exe'
  $result = Start-Process -FilePath $uninstaller -ArgumentList '/S' -Wait -PassThru
  if ($result.ExitCode -ne 0) { throw "Uninstaller exited with $($result.ExitCode)" }
  if (Test-Path $executable) { throw 'Uninstall left the app executable behind.' }
  if (Test-Path $shortcut) { throw 'Uninstall left the Start menu shortcut behind.' }
  if ((Get-Content $sentinel -Raw).Trim() -ne 'preserve-saved-work') {
    throw 'Uninstall removed existing app data.'
  }
}
Write-Host "$Action verified, saved work preserved."
