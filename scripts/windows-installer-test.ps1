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
function Wait-Removed([string]$Path) {
  $deadline = [DateTime]::UtcNow.AddSeconds(30)
  while ((Test-Path $Path) -and [DateTime]::UtcNow -lt $deadline) {
    Start-Sleep -Milliseconds 200
  }
  if (Test-Path $Path) { throw "Uninstall did not remove $Path within 30 seconds." }
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
  Wait-Removed $executable
  Wait-Removed $shortcut
  if ((Get-Content $sentinel -Raw).Trim() -ne 'preserve-saved-work') {
    throw 'Uninstall removed existing app data.'
  }
}
Write-Host "$Action verified, saved work preserved."
