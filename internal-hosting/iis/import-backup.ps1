param([Parameter(Mandatory=$true)][string]$Backup,[string]$Connection='Server=.\SQLEXPRESS;Database=ModulTransformasi;Integrated Security=True;TrustServerCertificate=True',[string]$StorageRoot='D:\ModulTransformasi\Attachments')
$ErrorActionPreference='Stop'
$p=Get-Content -LiteralPath $Backup -Raw -Encoding UTF8 | ConvertFrom-Json
if($p.kind -ne 'mt-full-backup' -or -not $p.collections -or -not $p.includesAttachments){throw 'Full Backup All with attachments required.'}
$allowed='users programs charters tahap oneonone projectRisks projectStakeholders projectDecisions wbs kwide risks crs usul sub ind sh jj pantau adopsi tr reviu log bukti ms impl jjMod modMeta kwideLinks config files'.Split(' ')
foreach($name in $allowed){if($null -eq $p.collections.PSObject.Properties[$name] -or @($p.collections.$name).Count -ne $p.counts.$name){throw "Missing or incomplete collection $name"}}
if(@($p.collections.users | Where-Object {$_.data.role -eq 'SA' -and $_.data.aktif -eq $true}).Count -eq 0){throw 'No active superadmin in export'}
[void](New-Item -ItemType Directory -Force -Path $StorageRoot)
$c=New-Object System.Data.SqlClient.SqlConnection $Connection
$c.Open();$t=$c.BeginTransaction()
$created=New-Object 'System.Collections.Generic.List[string]'
try {
 $q=$c.CreateCommand();$q.Transaction=$t;$q.CommandText='SELECT COUNT(*) FROM dbo.Documents';if($q.ExecuteScalar() -ne 0){throw 'Target must be empty. Import never overwrites existing data.'}
 foreach($name in $allowed){
  foreach($row in @($p.collections.$name)){
   $d=$row.data
   if($name -eq 'users'){foreach($k in @('pw','password','passwordHash')){$d.PSObject.Properties.Remove($k)}}
   if($name -eq 'files'){
    if($row.id -notmatch '^[a-zA-Z0-9_-]{1,160}$' -or $null -eq $d.d){throw 'Invalid file chunk'}
    $n=[Guid]::NewGuid().ToString('N');$f=Join-Path $StorageRoot $n
    [IO.File]::WriteAllBytes($f,[Convert]::FromBase64String($d.d));$created.Add($f)
    $d.PSObject.Properties.Remove('d');$d | Add-Member -NotePropertyName '_disk' -NotePropertyValue $n
   }
   $q=$c.CreateCommand();$q.Transaction=$t;$q.CommandText='INSERT dbo.Documents(Collection,Id,Body) VALUES(@c,@i,@b)'
   [void]$q.Parameters.AddWithValue('@c',$name);[void]$q.Parameters.AddWithValue('@i',[string]$row.id)
   [void]$q.Parameters.AddWithValue('@b',($d | ConvertTo-Json -Depth 100 -Compress))
   [void]$q.ExecuteNonQuery()
  }
  Write-Host "Imported $name : $($p.counts.$name)"
 }
 $t.Commit()
} catch { $t.Rollback();foreach($f in $created){Remove-Item -LiteralPath $f -Force};throw } finally {$c.Close()}
Write-Host 'Import completed. Set local passwords using MT.exe set-password email. Verify counts, document access, and file preview before use.'
