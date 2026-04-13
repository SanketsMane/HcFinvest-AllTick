const fs = require('fs');
const path = require('path');

const files = [
    'frontend/src/pages/Account.jsx',
    'frontend/src/pages/TradingPage.jsx',
    'frontend/src/pages/MobileTradingApp.jsx',
    'frontend/src/pages/Switch_Account.jsx'
];

const REPLACEMENTS = [
    {
        // Switch_Account.jsx large cards - match both COMPETITION and COMPETITION ACCOUNT
        pattern: /<span className=\"bg-amber-100 text-amber-600 text-\[9px\] px-1\.5 py-0\.5 rounded border border-amber-200 font-bold flex items-center gap-1\">\s*🏆 COMPETITION( ACCOUNT)?\s*<\/span>/g,
        replacement: '<span className="bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600 text-[9px] px-2.5 py-1 rounded-full border border-amber-200 font-bold flex items-center gap-1.5 shadow-sm uppercase tracking-wider">🏆 COMPETITION ACCOUNT</span>'
    }
];

files.forEach(f => {
    const fullPath = path.join('c:/Users/DELL/Desktop/HCFinvest', f);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    REPLACEMENTS.forEach(r => {
        if (r.pattern.test(content)) {
            content = content.replace(r.pattern, r.replacement);
            changed = true;
        }
    });
    if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${f}`);
    } else {
        console.log(`No changes needed: ${f}`);
    }
});
