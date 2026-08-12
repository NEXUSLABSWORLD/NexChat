# push_nexchat.ps1 — helper pour committer et pousser
param()

# Demande le chemin du repo local; si vide, utilise le dossier courant
$repoPath = Read-Host "Chemin du repo local (laisser vide = dossier courant)"
if ([string]::IsNullOrWhiteSpace($repoPath)) { $repoPath = (Get-Location).Path }

# Se placer dans le dossier
try {
    Set-Location $repoPath
} catch {
    Write-Error "Impossible d'accéder au chemin: $repoPath"
    exit 1
}

# Vérifier que git est disponible
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "Git introuvable dans le PATH. Installez Git et relancez le script."
  exit 1
}

# Afficher branche courante
$branch = (& git rev-parse --abbrev-ref HEAD) -replace '\r|\n',''
Write-Host "Branche courante: $branch"

# Option: configurer credential helper
$credChoice = Read-Host "Configurer credential.helper manager-core ? (y/N)"
if ($credChoice -match '^[Yy]') {
  git config --global credential.helper manager-core
  Write-Host "credential.helper = manager-core"
}

# Vérifier changements non commités
$status = (& git status --porcelain)
if ($status) {
  Write-Host "Modifications non committées :"
  Write-Host $status
  $doAddCommit = Read-Host "Ajouter et committer automatiquement ces changements ? (y/N)"
  if ($doAddCommit -match '^[Yy]') {
    $defaultMsg = "feat: add phase 3-4 implementations"
    $commitMsg = Read-Host "Message de commit (laisser vide pour défaut)"
    if ([string]::IsNullOrWhiteSpace($commitMsg)) { $commitMsg = $defaultMsg }
    git add .
    git commit -m $commitMsg
    Write-Host "Commit créé : $commitMsg"
  } else {
    Write-Host "Aucun commit créé. Reprenez manuellement si besoin."
  }
} else {
  Write-Host "Aucun changement à committer."
}

# Gérer dossier frontend imbriqué
$frontendGit = Join-Path $repoPath 'frontend\.git'
if (Test-Path $frontendGit) {
  Write-Host "Le dossier 'frontend' contient un repo Git imbriqué."
  $opt = Read-Host "1) convertir en submodule  2) retirer de l'index parent (par défaut 2) — saisir 1 ou 2"
  if ($opt -eq '1') {
    $url = Read-Host "URL du remote pour frontend (ex: https://github.com/user/frontend.git)"
    if (-not [string]::IsNullOrWhiteSpace($url)) {
      git submodule add $url frontend
      git add . && git commit -m "chore: add frontend as submodule"
      Write-Host "Submodule ajouté."
    } else {
      Write-Host "URL non fournie. Abandon."
    }
  } else {
    git rm --cached -r frontend || Write-Host "frontend n'était pas tracké ou git rm a échoué"
    $ig = Read-Host "Ajouter 'frontend' à .gitignore ? (y/N)"
    if ($ig -match '^[Yy]') {
      if (-not (Test-Path .gitignore)) { '' | Out-File -FilePath .gitignore -Encoding utf8 }
      # S'assurer de ne pas ajouter de doublons
      $gitignore = Get-Content .gitignore -ErrorAction SilentlyContinue | Out-String
      if ($gitignore -notmatch '/frontend') {
        Add-Content -Path .gitignore -Value "`n/frontend"
        git add .gitignore
      }
    }
    git commit -m "chore: untrack embedded frontend folder from parent repo" -q 2>$null || Write-Host "Aucun commit créé."
    Write-Host "'frontend' retiré de l'index parent."
  }
}

# Tentative de push
Write-Host "Tentative de push vers origin/$branch ..."
try {
  & git push origin $branch 2>&1 | ForEach-Object { Write-Host $_ }
} catch {
  Write-Host "Push échoué. Si authentification requise: exécutez `n  gh auth login --web `n puis relancez ce script."
}
Write-Host "Terminé."
