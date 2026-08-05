$file = "c:\Users\hp\OneDrive\Desktop\skilllinked\client\src\pages\Messaging\SidebarPanels.jsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)

$importCode = @'
import { AccountPanel } from '../../components/chat/AccountPanels';
import { PrivacyPanel } from '../../components/chat/PrivacyPanels';
import { 
  StorageDataPanel, FacebookInstagramPanel, 
  AccessibilityPanel, AppLanguagePanel, MetaVerifiedPanel 
} from '../../components/chat/SettingsModals';
import ChatSettings from '../../components/chat/ChatSettings';
'@

$newLines = @()
foreach ($line in $lines) {
    $newLines += $line
    if ($line -match "import \{ socket \} from '\.\./\.\./services/socket';") {
        $newLines += $importCode -split "`n"
    }
}

[System.IO.File]::WriteAllLines($file, $newLines, [System.Text.Encoding]::UTF8)
Write-Host "Imports added. Total lines: $($newLines.Count)"
