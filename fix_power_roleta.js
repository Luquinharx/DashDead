const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/pages/PowerRoleta.tsx', 'utf-8');

// 1. Import Wheel
if (!code.includes('react-custom-roulette')) {
  code = code.replace(/import \{ Gift \} from 'lucide-react';/, "import { Gift } from 'lucide-react';\nimport { Wheel } from 'react-custom-roulette';");
}

// 2. Replace \slots\ with \mustSpin\ and \prizeNumber\
code = code.replace(/const \[slots, setSlots\] = useState\(\['\?', '\?', '\?'\]\);/, 'const [mustSpin, setMustSpin] = useState(false);\n  const [prizeNumber, setPrizeNumber] = useState(0);');

// 3. Update \girar\ to use the wheel instead of interval
// We find where \girar\ sets interval:
const intervalRegex = /setSlots\(\['??', '??', '??'\]\);[\s\S]*?clearInterval\(interval\);[\s]*/;
const replacement = \
    const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    setPrizeNumber(prizeIndex);
    setMustSpin(true);
\;
code = code.replace(intervalRegex, replacement);

// We need to move the db saving to run AFTER spinning finishes, or let it fire initially. 
// The user expects the result to show up. 
// It's better to move db and setResult inside \onStopSpinning\.
// Wait, the entire spinning is async currently and waits 3000ms.
// If we use Wheel, \wait new Promise(...)\ is an option, or we can use the \onStopSpinning\ callback.
// Let's replace the timeout wait.
const timeoutRegex = /await new Promise\(r => setTimeout\(r, 3000\)\);\s*clearInterval\(interval\);/;
// Actually our previous regex probably ate that. Let's rebuild the \girar\ method completely.
