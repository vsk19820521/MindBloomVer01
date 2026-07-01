cd "d:\Pet Projects\MindBloomVer01\api"

$filesToRename = @(
    "admin-users.js", "admin-puzzles.js", "admin-failures.js", "admin-reports.js", "admin-resolve-reports.js",
    "login.js", "register.js", "get-user.js", "save-user.js", "delete-user.js", "list-users.js",
    "log-event.js", "log-failure.js", "report-puzzle.js", "puzzle-averages.js",
    "upload-drawing.js", "get-drawing-url.js"
)

foreach ($file in $filesToRename) {
    if (Test-Path $file) {
        Rename-Item -Path $file -NewName "_$file"
        Write-Host "Renamed $file to _$file"
    } else {
        Write-Host "File $file not found!"
    }
}
