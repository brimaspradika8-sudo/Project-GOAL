param(
  [string]$Root = "c:\project\Project-GOAL\backend"
)

$ErrorActionPreference = "SilentlyContinue"

$ext = @("*.php","*.env","*.js","*.ts","*.json","*.md","*.xml","*.yml","*.yaml")
$files = foreach($e in $ext){
  Get-ChildItem -Path $Root -Recurse -File -Filter $e | Where-Object { $_.FullName -notlike "*\vendor\*" }
}

$matches = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  try {
    $m = Select-String -Path $f.FullName -Pattern "supabase" -CaseSensitive:$false
    if ($m) { $null = $matches.Add($f.FullName) }
  } catch {}
}

$matches | Sort-Object -Unique
