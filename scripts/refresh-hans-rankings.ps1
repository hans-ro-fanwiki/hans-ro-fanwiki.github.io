# Run from an installed copy under the Windows account that has GitHub access.
param(
    [string]$StateDirectory = (Join-Path $env:LOCALAPPDATA 'HANS Wiki Ranking Refresh')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$env:GIT_TERMINAL_PROMPT = '0'
$env:GH_PROMPT_DISABLED = '1'

$repository = 'hans-ro-fanwiki/hans-ro-fanwiki.github.io'
$origin = "https://github.com/$repository.git"
$collectorBlob = '34e5ce91fe1d998e1b2ac36ec9baf7a32d64828c'
$snapshot = 'public/520520520/snapshot.json'
$mirror = Join-Path $StateDirectory 'source'
$runId = [DateTime]::UtcNow.ToString('yyyyMMdd-HHmmss') + "-$PID"
$worktree = Join-Path $StateDirectory "run-$runId"
$branch = "dev/rank-refresh-auto-$runId"
$logDirectory = Join-Path $StateDirectory 'logs'
$logFile = Join-Path $logDirectory "$runId.log"

function Write-RunLog([string]$Message) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') $Message"
    Add-Content -LiteralPath $logFile -Value $line -Encoding utf8
    Write-Host $line
}

function Invoke-Checked([string]$Executable, [string[]]$Arguments) {
    $result = & $Executable @Arguments 2>> $logFile
    if ($LASTEXITCODE -ne 0) {
        throw "$([IO.Path]::GetFileName($Executable)) $($Arguments[0]) exited with code $LASTEXITCODE"
    }
    return $result
}

function Wait-WikiCi([string]$Commit, [string]$BranchName) {
    $until = (Get-Date).AddMinutes(10)
    while ((Get-Date) -lt $until) {
        $json = Invoke-Checked $gh @('run','list','--repo',$repository,'--workflow','ci.yml',
            '--event','push','--branch',$BranchName,'--commit',$Commit,
            '--limit','1','--json','status,conclusion,url')
        $runs = @(ConvertFrom-Json -InputObject ($json -join "`n"))
        if ($runs.Count -gt 0 -and $runs[0].status -eq 'completed') {
            $run = $runs[0]
            if ($run.conclusion -ne 'success') {
                throw "GitHub Actions returned $($run.conclusion) for $BranchName ($($run.url))"
            }
            Write-RunLog "GitHub Actions passed for $BranchName ($($run.url))"
            return
        }
        Start-Sleep -Seconds 10
    }
    throw "Timed out waiting for GitHub Actions on $BranchName"
}

$null = New-Item -ItemType Directory -Force -Path $logDirectory
$exitCode = 0
$worktreeCreated = $false
try {
    Write-RunLog 'Starting HANS ranking capture.'
    $git = (Get-Command git.exe).Source
    $gh = (Get-Command gh.exe).Source
    $python = (Get-Command python.exe).Source
    $null = Get-Command curl.exe
    $credential = '!gh auth git-credential'
    $gitAuth = @('-c','credential.helper=', '-c',"credential.helper=$credential")

    if (!(Test-Path (Join-Path $mirror '.git'))) {
        Invoke-Checked $git @('clone','--single-branch','--branch','main','--no-checkout',$origin,$mirror)
    }
    $configuredOrigin = Invoke-Checked $git @('-C',$mirror,'remote','get-url','origin')
    if ($configuredOrigin -cne $origin) {
        throw 'Unexpected mirror remote.'
    }
    Invoke-Checked $git @('-C',$mirror,'fetch','--no-tags','origin','main')
    $base = Invoke-Checked $git @('-C',$mirror,'rev-parse','FETCH_HEAD')
    $candidate = Invoke-Checked $git @('-C',$mirror,'rev-parse',"${base}:scripts/capture-hans-rankings.py")
    if ($candidate -ne $collectorBlob) {
        throw 'The capture script has changed. Review it and update the installed collector pin.'
    }
    Invoke-Checked $git @('-C',$mirror,'worktree','add','--detach',$worktree,$base)
    $worktreeCreated = $true

    Invoke-Checked $python @('-I',(Join-Path $worktree 'scripts/capture-hans-rankings.py')) |
        ForEach-Object { Write-RunLog $_ }
    Invoke-Checked $git @('-C',$worktree,'add','--',$snapshot)
    Invoke-Checked $git @('-C',$worktree,'-c','user.name=HANS Wiki Ranking',
        '-c','user.email=hans-ro-fanwiki@users.noreply.github.com','commit','-m','Refresh HANS ranking snapshot')
    $commit = Invoke-Checked $git @('-C',$worktree,'rev-parse','HEAD')

    Invoke-Checked $git (@('-C',$worktree) + $gitAuth + @('push','origin',"HEAD:refs/heads/$branch"))
    Wait-WikiCi $commit $branch
    # A regular push rejects concurrent main changes. The next run uses the new main.
    Invoke-Checked $git (@('-C',$worktree) + $gitAuth + @('push','origin','HEAD:refs/heads/main'))
    Wait-WikiCi $commit 'main'
    Invoke-Checked $git (@('-C',$worktree) + $gitAuth + @('push','origin','--delete',$branch))
    Write-RunLog "Published HANS ranking snapshot ($commit)."
} catch {
    Write-RunLog "FAILED: $($_.Exception.Message)"
    $exitCode = 1
} finally {
    if ($worktreeCreated) {
        & $git -C $mirror worktree remove $worktree
        if ($LASTEXITCODE -ne 0) {
            Write-RunLog "Temporary worktree remains at $worktree"
        }
    }
}
exit $exitCode
