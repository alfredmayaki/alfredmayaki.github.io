# Update Mobile Button Sizes Across All Language Files
# This script makes buttons more compact on mobile devices

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Mobile Button Size Optimization Script" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Find all index_*.html files
$files = Get-ChildItem -Path . -Filter "index_*.html"

if ($files.Count -eq 0) {
    Write-Host "No index_*.html files found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($files.Count) language files to update:" -ForegroundColor Green
foreach ($file in $files) {
    Write-Host "  - $($file.Name)" -ForegroundColor Yellow
}
Write-Host ""

$updatedCount = 0
$errorCount = 0

foreach ($file in $files) {
    Write-Host "Processing: $($file.Name)..." -ForegroundColor Cyan
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $originalContent = $content
        
        # Pattern 1: Replace the old mobile media query with the new compact version
        $oldPattern1 = @'
    /\* Mobile optimization \*/
    @media \(max-width: 768px\) \{
      \.back-home-btn \{
        padding: 12px 24px;
        font-size: 1em;
        min-height: 48px;
        gap: 10px;
      \}
    \}
'@
        
        $newPattern1 = @'
    /* Mobile optimization - compact but touch-friendly */
    @media (max-width: 768px) {
      .back-home-btn {
        padding: 10px 18px;
        font-size: 0.9em;
        min-height: 42px;
        gap: 7px;
      }
    }

    @media (max-width: 480px) {
      .back-home-btn {
        padding: 9px 16px;
        font-size: 0.85em;
        min-height: 40px;
      }
    }
'@
        
        # Try to replace using regex
        if ($content -match '/\* Mobile optimization \*/\s+@media \(max-width: 768px\) \{[^}]+\.back-home-btn \{[^}]+\}\s+\}') {
            $content = $content -replace '/\* Mobile optimization \*/\s+@media \(max-width: 768px\) \{[^}]+\.back-home-btn \{[^}]+\}\s+\}', $newPattern1
            Write-Host "  ✓ Updated mobile media query" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Could not find mobile optimization pattern" -ForegroundColor Yellow
        }
        
        # Save if changes were made
        if ($content -ne $originalContent) {
            Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
            Write-Host "  ✓ $($file.Name) updated successfully" -ForegroundColor Green
            $updatedCount++
        } else {
            Write-Host "  - No changes needed for $($file.Name)" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "  ✗ Error processing $($file.Name): $_" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "Files processed: $($files.Count)" -ForegroundColor White
Write-Host "Files updated: $updatedCount" -ForegroundColor Green
Write-Host "Files unchanged: $($files.Count - $updatedCount - $errorCount)" -ForegroundColor Yellow
if ($errorCount -gt 0) {
    Write-Host "Errors: $errorCount" -ForegroundColor Red
}
Write-Host ""
Write-Host "Mobile buttons are now more compact!" -ForegroundColor Green
Write-Host "Changes applied:" -ForegroundColor White
Write-Host "  ✓ Reduced padding from 12px/24px to 10px/18px (tablet)" -ForegroundColor Gray
Write-Host "  ✓ Reduced padding to 9px/16px (phone)" -ForegroundColor Gray
Write-Host "  ✓ Reduced font size from 1em to 0.9em (tablet)" -ForegroundColor Gray
Write-Host "  ✓ Reduced font size to 0.85em (phone)" -ForegroundColor Gray
Write-Host "  ✓ Reduced min-height from 48px to 42px (tablet)" -ForegroundColor Gray
Write-Host "  ✓ Reduced min-height to 40px (phone)" -ForegroundColor Gray
Write-Host ""
Write-Host "Next step: Run standardize_back_button.py for a complete sync" -ForegroundColor Cyan
