# PowerShell Script to Apply Mobile Optimizations to All Language Files
# Author: GitHub Copilot
# Description: Applies mobile-optimized CSS to all index_xx.html language files

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Mobile Layout Optimization Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$files = @(
    "index_de.html", "index_es.html", "index_fr.html",
    "index_nl.html", "index_pt.html", "index_sw.html", "index_tr.html",
    "index_yb.html", "index_jp.html", "index_cy.html", "index_en.html"
)

$rtlFiles = @("index_he.html", "index_ksa.html")

$successCount = 0
$errorCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..." -ForegroundColor Yellow
        
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            
            # Apply all mobile optimizations
            $content = $content -replace '(word-wrap: break-word;)(\s+\})', '$1$2word-break: break-word;$2'
            $content = $content -replace 'gap: 8px;(\s+padding: (?:10|12)px (?:20|24)px;)', 'gap: 6px;$1padding: 8px 16px;'
            $content = $content -replace 'min-height: 44px;(\s+background)', 'min-height: 36px;$1'
            $content = $content -replace 'font-size: 0\.(?:9|95)em;(\s+font-weight: 600;)', 'font-size: 0.85em;$1'
            $content = $content -replace '(text-decoration: none !important;)(\s+transition)', '$1$2white-space: nowrap;$2'
            $content = $content -replace '(\.back-home-btn i \{[^\}]*font-size: )(?:0\.9|1)em;', '$10.85em;'
            
            # Add button container if not exists
            if ($content -notmatch '\.btn-container') {
                $content = $content -replace '(\.back-home-btn i \{[^\}]+\})', '$1

    /* Button container alignment */
    .btn-container {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 1.3em;
    }'
            }
            
            # Add flex-wrap to contact-info
            $content = $content -replace '(\.contact-info p \{[^\}]+)(margin: 0\.5em 0;)(\s+\})', '$1$2$3flex-wrap: wrap;$3'
            
            # Add footer link styling
            if ($content -notmatch 'footer a \{') {
                $content = $content -replace '(footer p \{[^\}]+\})', '$1

    footer a {
      display: inline-block;
      margin: 0.25em 0;
    }'
            }
            
            # Optimize 900px breakpoint
            $content = $content -replace '(max-width: 900px[^\}]+\{[^\}]+)(max-width: 350px;)', '$1max-width: 100%;'
            
            # Optimize 768px breakpoint
            $content = $content -replace '(@media \(max-width: 768px\) \{[^\}]+body \{[^\}]+)margin: 1em;(\s+padding: )1\.5em;', '$1margin: 0.75em;$2 1.25em;'
            $content = $content -replace '(max-width: 768px[^\}]+)width: 180px;(\s+height: )180px;(\s+order: -1;)', '$1width: 160px;$2160px;$3$4border-width: 4px;'
            $content = $content -replace '(max-width: 768px[^\}]+h1 \{[^\}]+)font-size: 1\.6em;', '$1font-size: 1.5em;$2margin: 0.5em 0;'
            $content = $content -replace '(max-width: 768px[^\}]+)width: 100%;(\s+justify-content: center;)', '$1width: auto;$2padding: 8px 18px;'
            
            # Add .btn-container centering for mobile
            if ($content -match 'max-width: 768px' -and $content -notmatch '\.btn-container \{[^}]+justify-content: center') {
                $content = $content -replace '(max-width: 768px[^\}]+)(\.back-home-btn \{)', '$1.btn-container {$2justify-content: center;$2}$2$2'
            }
            
            # Add centered contact-info on mobile
            $content = $content -replace '(max-width: 768px[^\}]+\.contact-info \{[^\}]+)margin-left: 0;(\s+\})', '$1margin-left: 0;$2text-align: center;$2}$2$2.contact-info p {$2justify-content: center;$2'
            
            # Optimize 600px breakpoint
            $content = $content -replace '(max-width: 600px[^\}]+)width: 150px;(\s+height: )150px;', '$1width: 140px;$2140px;'
            $content = $content -replace '(max-width: 600px[^\}]+h1 \{[^\}]+)font-size: 1\.4em;', '$1font-size: 1.35em;$2line-height: 1.25;'
            $content = $content -replace '(max-width: 600px[^\}]+\.back-home-btn \{[^\}]+)padding: 10px (?:16|20)px;(\s+font-size: )0\.(?:85|9)em;', '$1padding: 7px 14px;$2$20.8em;$2min-height: 38px;'
            
            # Add footer font-size for 600px
            if ($content -match 'max-width: 600px' -and $content -notmatch 'footer \{[^}]+font-size: 0\.9em') {
                $content = $content -replace '(max-width: 600px[^\}]+)(\.contact-info p \{)', '$1footer {$2font-size: 0.9em;$2}$2$2footer a {$2display: inline;$2margin: 0 0.25em;$2}$2$2'
            }
            
            # Optimize 400px breakpoint
            $content = $content -replace '(max-width: 400px[^\}]+)width: 120px;(\s+height: )120px;', '$1width: 110px;$2110px;'
            $content = $content -replace '(max-width: 400px[^\}]+)margin: 0\.25em;(\s+padding: )0\.75em;', '$1margin: 0.35em;$2$20.85em;'
            $content = $content -replace '(max-width: 400px[^\}]+\.back-home-btn \{[^\}]+)padding: (?:6|8)px (?:12|14|16)px;(\s+font-size: )0\.(?:75|8|85)em;', '$1padding: 6px 12px;$2$20.75em;$2min-height: 36px;'
            
            # Optimize landscape mode
            $content = $content -replace '(orientation: landscape[^\}]+)width: 150px;(\s+height: )150px;', '$1width: 120px;$2120px;'
            $content = $content -replace '(orientation: landscape[^\}]+\.header-flex \{[^\}]+)(\})', '$1text-align: left;$2'
            $content = $content -replace '(orientation: landscape[^\}]+)padding: 1em;', '$1padding: 0.75em 1em;'
            
            # Add h1 size for landscape
            if ($content -match 'orientation: landscape' -and $content -notmatch 'landscape[^}]+h1 \{') {
                $content = $content -replace '(orientation: landscape[^\}]+)(body \{)', '$1h1 {$2font-size: 1.3em;$2}$2$2'
            }
            
            # Enhance touch targets
            $content = $content -replace '(pointer: coarse[^\}]+a,\s+button,\s+select \{[^\}]+)(\})', '$1padding: 0.5em 0.75em;$2$2$2.contact-info a,$2footer a {$2padding: 0.5em;$2margin: 0.25em;$2'
            
            # Add mobile rendering optimizations at end
            if ($content -notmatch 'overflow-x: hidden') {
                $content = $content -replace '(html \{[^\}]+scroll-behavior: smooth;[^\}]+\})', '$1

    /* Prevent horizontal scroll on mobile */
    body {
      overflow-x: hidden;
    }

    /* Better text rendering on mobile */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }'
            }
            
            # Update HTML button wrapper
            $content = $content -replace '<div style="margin-bottom: 1\.3em;">', '<div class="btn-container">'
            
            # Save the file
            Set-Content -Path $file -Value $content -NoNewline -Encoding UTF8
            
            Write-Host "  ? Successfully updated $file" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "  ? Error updating $file : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "  ? File not found: $file" -ForegroundColor Red
        $errorCount++
    }
}

# Handle RTL files separately
Write-Host "`nProcessing RTL language files..." -ForegroundColor Cyan
foreach ($file in $rtlFiles) {
    if (Test-Path $file) {
        Write-Host "Processing $file (RTL)..." -ForegroundColor Yellow
        
        try {
            $content = Get-Content $file -Raw -Encoding UTF8
            
            # Apply same optimizations as LTR files (reusing patterns above)
            $content = $content -replace '(word-wrap: break-word;)(\s+\})', '$1$2word-break: break-word;$2'
            $content = $content -replace 'gap: 8px;(\s+padding: (?:10|12)px (?:20|24)px;)', 'gap: 6px;$1padding: 8px 16px;'
            $content = $content -replace 'min-height: 44px;(\s+background)', 'min-height: 36px;$1'
            $content = $content -replace 'font-size: 0\.(?:9|95)em;(\s+font-weight: 600;)', 'font-size: 0.85em;$1'
            $content = $content -replace '(\.back-home-btn i \{[^\}]*font-size: )(?:0\.9|1)em;', '$10.85em;'
            
            # Add button container with RTL alignment (flex-end instead of flex-start)
            if ($content -notmatch '\.btn-container') {
                $content = $content -replace '(\.back-home-btn i \{[^\}]+\})', '$1

    /* Button container alignment (RTL) */
    .btn-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.3em;
    }'
            }
            
            # Apply remaining optimizations
            $content = $content -replace '(\.contact-info p \{[^\}]+)(margin: 0\.5em 0;)(\s+\})', '$1$2$3flex-wrap: wrap;$3'
            $content = $content -replace '(orientation: landscape[^\}]+)width: 150px;(\s+height: )150px;', '$1width: 120px;$2120px;'
            
            # Add mobile rendering optimizations
            if ($content -notmatch 'overflow-x: hidden') {
                $content = $content -replace '(html \{[^\}]+scroll-behavior: smooth;[^\}]+\})', '$1

    /* Prevent horizontal scroll on mobile */
    body {
      overflow-x: hidden;
    }

    /* Better text rendering on mobile */
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }'
            }
            
            # Update HTML button wrapper
            $content = $content -replace '<div style="margin-bottom: 1\.3em;">', '<div class="btn-container">'
            
            Set-Content -Path $file -Value $content -NoNewline -Encoding UTF8
            
            Write-Host "  ? Successfully updated $file (RTL)" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "  ? Error updating $file : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "  ? File not found: $file" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  ? Successfully updated: $successCount files" -ForegroundColor Green
Write-Host "  ? Errors: $errorCount files" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Mobile optimization complete! ???" -ForegroundColor Green
Write-Host "Please review changes with: git diff" -ForegroundColor Yellow
Write-Host "Test on mobile or Chrome DevTools (F12 ? Device Mode)`n" -ForegroundColor Yellow
