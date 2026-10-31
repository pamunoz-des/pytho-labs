# PYTHO Labs - Publicar sitio en GitHub desde Windows PowerShell
# Requiere Git y GitHub CLI (gh): https://cli.github.com/
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$repo = 'pamunoz-des/pytho-labs'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'No se encontró Git. Instálalo desde https://git-scm.com/download/win' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'No se encontró GitHub CLI. Ejecuta: winget install --id GitHub.cli -e' }

gh auth status 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Inicia sesión de GitHub en el navegador...' -ForegroundColor Cyan
    gh auth login --web --git-protocol https
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo autenticar GitHub.' }
}

if (-not (Test-Path '.git')) { git init -b main }
if (-not (git config user.name)) { Write-Warning 'Configura el usuario de Git: git config --global user.name "Tu nombre"' }
if (-not (git config user.email)) { Write-Warning 'Configura el correo de Git: git config --global user.email "tu@email.com"' }

git add .
$changes = git status --porcelain
if ($changes) { git commit -m 'feat: sitio web inicial de PYTHO Labs' }
if ($LASTEXITCODE -ne 0) { throw 'Falló git commit. Revisa tu identidad de Git.' }

# No sobrescribir repositorios existentes ni forzar pushes.
gh repo view $repo --json name 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "El repositorio $repo ya existe. No se modifica automáticamente." -ForegroundColor Yellow
    Write-Host "Revisa https://github.com/$repo antes de subir cambios."
    exit 0
}

gh repo create $repo --public --source . --remote origin --push
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear o publicar el repositorio.' }
Write-Host "Repositorio creado: https://github.com/$repo" -ForegroundColor Green
Write-Host 'Para habilitar Pages: Settings > Pages > Deploy from a branch > main / (root) > Save.'
