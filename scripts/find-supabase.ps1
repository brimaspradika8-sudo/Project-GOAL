param(
  [string]$Root = "c:\project\Project-GOAL\backend"
)

$ErrorActionPreference = "SilentlyContinue"

$files = Get-ChildItem -Path $Root -Recurse -File |
  Where-Object { $_.FullName -notlike "*\vendor\*" }

$matches = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  try {
    $m = Select-String -Path $f.FullName -Pattern "supabase" -CaseSensitive:$false
    if ($m) { $null = $matches.Add($f.FullName) }
  } catch {
    # ignore unreadable/binary files
  }
}

$matches | Sort-Object -Unique
