#!/usr/bin/env python3
"""
Comprehensive script to replicate index_it.html mobile button styling to all language files.
This script:
1. Removes duplicate CSS blocks
2. Applies the exact mobile button styling from index_it.html
3. Ensures consistent .btn-container usage
"""

import os
import re
from pathlib import Path

# The working CSS from index_it.html
WORKING_BUTTON_CSS = """    /* Back to Home Button */
    .back-home-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 8px 16px;
      margin-bottom: 1.5em;
      min-height: 36px;

      background: #3d4ee9;
      color: #ffffff !important;
      border: 2px solid #3d4ee9;
      border-radius: 999px;

      font-family: 'Segoe UI', sans-serif;
      font-size: 0.85em;
      font-weight: 600;
      text-decoration: none !important;
      white-space: nowrap;

      transition: all 0.2s ease;
      cursor: pointer;
    }

    .back-home-btn:hover {
      background: #5563f0;
      border-color: #5563f0;
      box-shadow: 0 4px 12px rgba(61, 78, 233, 0.4);
      transform: translateY(-2px);
      text-decoration: none !important;
      color: #ffffff !important;
    }

    .back-home-btn:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(61, 78, 233, 0.3);
    }

    .back-home-btn i {
      font-size: 0.85em;
    }

    /* Button container alignment */
    .btn-container {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 1.3em;
    }

    /* Mobile optimization - matching index_it.html */
    @media (max-width: 600px) {
      .back-home-btn {
        padding: 7px 14px;
        font-size: 0.8em;
        min-height: 38px;
      }
    }

    @media (max-width: 400px) {
      .back-home-btn {
        padding: 6px 12px;
        font-size: 0.75em;
        min-height: 36px;
      }
    }"""

# Button text for each language (from existing script)
BUTTON_TEXT_MAP = {
    'index_en.html': 'Back to Home',
    'index_fr.html': 'Retour à l\'accueil',
    'index_es.html': 'Volver al inicio',
    'index_de.html': 'Zurück zur Startseite',
    'index_it.html': 'Torna alla home',
    'index_pt.html': 'Voltar ao início',
    'index_nl.html': 'Terug naar home',
    'index_ru.html': 'Назад на главную',
    'index_ch.html': '返回主页',
    'index_jp.html': 'ホームに戻る',
    'index_he.html': 'חזרה לעמוד הבית',
    'index_tr.html': 'Ana sayfaya dön',
    'index_sw.html': 'Rudi Nyumbani',
    'index_cy.html': 'Yn ôl i\'r cartref',
    'index_ksa.html': 'العودة إلى الصفحة الرئيسية',
    'index_yb.html': 'Pada Ibi-akọọlẹ',
    'index_test.html': 'Back to Home',
}

RTL_LANGUAGES = ['index_he.html', 'index_ksa.html']


def find_language_files():
    """Find all index_xxx.html files"""
    current_dir = Path('.')
    files = list(current_dir.glob('index_*.html'))
    return [f for f in files if f.name in BUTTON_TEXT_MAP]


def remove_duplicate_css(content):
    """Remove all duplicate .back-home-btn CSS blocks"""
    
    # Find all occurrences of back-home-btn blocks
    pattern = r'/\*\s*Back to Home Button\s*\*/.*?\.back-home-btn\s*\{[^}]+\}.*?\.back-home-btn:active\s*\{[^}]+\}'
    
    # Also match media query blocks
    media_pattern = r'/\*\s*Mobile optimization[^*]*\*/\s*@media[^{]+\{[^}]*\.back-home-btn\s*\{[^}]+\}\s*\}'
    
    # Count occurrences
    blocks = re.findall(pattern, content, re.DOTALL)
    media_blocks = re.findall(media_pattern, content, re.DOTALL)
    
    if len(blocks) > 1 or len(media_blocks) > 1:
        print(f"    Found {len(blocks)} duplicate CSS blocks and {len(media_blocks)} media query blocks")
        
        # Remove ALL occurrences
        content = re.sub(pattern, '', content, flags=re.DOTALL)
        content = re.sub(media_pattern, '', content, flags=re.DOTALL)
        
        # Also remove orphan @media blocks
        content = re.sub(r'@media\s*\(max-width:\s*\d+px\)\s*\{[^}]*\.back-home-btn[^}]*\}[^}]*\}', '', content, flags=re.DOTALL)
        
        print("    ✓ Removed all duplicate CSS blocks")
    
    return content


def insert_working_css(content):
    """Insert the working CSS from index_it.html"""
    
    # Find where to insert - right after .profile-photo styles
    insertion_point = content.find('.profile-photo {')
    
    if insertion_point == -1:
        print("    ⚠ Could not find .profile-photo CSS")
        return content
    
    # Find the closing brace of .profile-photo
    brace_count = 0
    start_counting = False
    insert_pos = insertion_point
    
    for i in range(insertion_point, len(content)):
        if content[i] == '{':
            brace_count += 1
            start_counting = True
        elif content[i] == '}' and start_counting:
            brace_count -= 1
            if brace_count == 0:
                insert_pos = i + 1
                break
    
    # Insert the new CSS after .profile-photo
    content = content[:insert_pos] + '\n\n' + WORKING_BUTTON_CSS + '\n' + content[insert_pos:]
    
    print("    ✓ Inserted working CSS from index_it.html")
    return content


def update_button_html(content, filename):
    """Update button HTML to use .btn-container"""
    button_text = BUTTON_TEXT_MAP.get(filename, 'Back to Home')
    arrow_icon = 'fa-arrow-right' if filename in RTL_LANGUAGES else 'fa-arrow-left'
    
    new_html = f'''  <!-- Back to Home Button -->
  <div class="btn-container">
    <a href="index.html" class="back-home-btn">
      <i class="fas {arrow_icon}"></i>
      {button_text}
    </a>
  </div>'''
    
    # Find and replace various button HTML patterns
    patterns = [
        r'<!--\s*Back to Home Button\s*-->.*?</div>',
        r'<div[^>]*>\s*<a[^>]*class="back-home-btn"[^>]*>.*?</a>\s*</div>',
    ]
    
    for pattern in patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, new_html, content, count=1, flags=re.DOTALL)
            print("    ✓ Updated button HTML")
            break
    
    return content


def process_file(filepath):
    """Process a single file"""
    filename = filepath.name
    print(f"\n{'='*60}")
    print(f"Processing: {filename}")
    print('='*60)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Step 1: Remove duplicates
        print("Step 1: Removing duplicate CSS...")
        content = remove_duplicate_css(content)
        
        # Step 2: Insert working CSS
        print("Step 2: Inserting working CSS from index_it.html...")
        content = insert_working_css(content)
        
        # Step 3: Update button HTML
        print("Step 3: Updating button HTML...")
        content = update_button_html(content, filename)
        
        # Save if changes made
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"\n✅ {filename} updated successfully!")
            return True
        else:
            print(f"\n⚠️ No changes needed for {filename}")
            return False
            
    except Exception as e:
        print(f"\n❌ Error processing {filename}: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main function"""
    print("="*70)
    print("  Replicating index_it.html Mobile Styling to All Language Files")
    print("="*70)
    print()
    print("This script will:")
    print("  1. Remove all duplicate CSS blocks")
    print("  2. Apply index_it.html mobile button styling (compact & clean)")
    print("  3. Ensure .btn-container usage")
    print()
    
    files = find_language_files()
    
    if not files:
        print("❌ No language files found!")
        return
    
    print(f"Found {len(files)} language files:")
    for f in files:
        status = "✓ TEMPLATE" if f.name == 'index_it.html' else "⏳ TO UPDATE"
        print(f"  {status} {f.name}")
    print()
    
    input("Press Enter to continue...")
    print()
    
    updated_count = 0
    for filepath in files:
        if process_file(filepath):
            updated_count += 1
    
    print("\n" + "="*70)
    print("  COMPLETE!")
    print("="*70)
    print(f"Files processed: {len(files)}")
    print(f"Files updated: {updated_count}")
    print(f"Files unchanged: {len(files) - updated_count}")
    print()
    print("Mobile button styling from index_it.html has been applied!")
    print("  ✓ Base size: 8px/16px padding, 0.85em font, 36px min-height")
    print("  ✓ @600px: 7px/14px padding, 0.8em font, 38px min-height")
    print("  ✓ @400px: 6px/12px padding, 0.75em font, 36px min-height")
    print()


if __name__ == '__main__':
    main()
