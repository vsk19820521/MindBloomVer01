$files = @('4-5', '6-7', '8-9')
foreach($b in $files) {
    $d = Get-Content "./data/puzzles_$b.json" | ConvertFrom-Json
    $e = 0
    $m = 0
    $h = 0
    foreach($day in $d) {
        if ($day.puzzles) {
            foreach($p in $day.puzzles) {
                if ($p.difficulty -eq 'Easy') { $e++ }
                elseif ($p.difficulty -eq 'Medium') { $m++ }
                elseif ($p.difficulty -eq 'Hard') { $h++ }
            }
        } else {
            # maybe flat array
            if ($day.difficulty -eq 'Easy') { $e++ }
            elseif ($day.difficulty -eq 'Medium') { $m++ }
            elseif ($day.difficulty -eq 'Hard') { $h++ }
        }
    }
    Write-Host "Band $b - Easy: $e, Medium: $m, Hard: $h"
}
