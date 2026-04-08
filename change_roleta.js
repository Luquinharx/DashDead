const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/pages/PowerRoleta.tsx', 'utf-8');

// replace slots state
code = code.replace(/const \[slots, setSlots\] = useState\(\['\?', '\?', '\?'\]\);/, 'const [rotation, setRotation] = useState(0);');

// replace girar logic
code = code.replace(/setSlots\(\['??', '??', '??'\]\);/, ''); 

const findInterval = /const interval = setInterval\([\s\S]*?clearInterval\(interval\);/g;
const replaceRotationLogic = \
    const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    const sliceAngle = 360 / config.prizes.length;
    const stopAngle = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
    const spins = 5 * 360;
    const finalRot = rotation + spins + stopAngle - (rotation % 360);
    setRotation(finalRot);

    await new Promise(r => setTimeout(r, 3000));
\;
code = code.replace(findInterval, replaceRotationLogic);

// remove final setSlots
code = code.replace(/setSlots\(\[selected\.icon, selected\.icon, selected\.icon\]\);/, '');

// Change JSX renderer from slot machine to Wheel
const oldJsxRegex = /(<div className="flex gap-2 sm:gap-6 p-6 sm:p-8 bg-black rounded-lg border-4 border-red-900\/40 shadow-\[0_0_50px_rgba\(0,0,0,0\.8\)\] relative z-10 w-full max-w-2xl justify-center">[\s\S]*?<\/div>\s*<\/div>)/;

// Let's replace the whole machine display with Wheel
code = code.replace(/\{\/\* Machine Display \*\/\}[\s\S]*?\{\/\* Controls \*\/}/, 
\{/* Wheel Display */}
            <div className="relative z-10 w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center my-8">
                {/* Pointer */}
                <div className="absolute -top-4 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                
                {/* Wheel Container */}
                <div 
                  className="w-full h-full rounded-full border-8 border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transition-transform ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                  style={{ transform: \otate(\\\deg)\, transitionDuration: spinning ? '3000ms' : '0ms' }}
                >
                  {config.prizes.map((p, i, arr) => {
                    const angle = 360 / arr.length;
                    const rotate = i * angle;
                    const skew = 90 - angle;
                    const color = i % 2 === 0 ? '#1f1c1c' : '#2a2626'; 
                    return (
                      <div 
                        key={p.id} 
                        className="absolute w-1/2 h-1/2 origin-bottom-right"
                        style={{
                          transform: \otate(\\\deg) skewY(\\\deg)\,
                          backgroundColor: color,
                          top: 0,
                          left: 0,
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                         <div 
                            className="absolute flex flex-col items-center justify-center text-center pt-8"
                            style={{
                              transform: \skewY(-\\\deg) rotate(\\\deg)\,
                              width: '200%',
                              height: '200%',
                              top: '-50%',
                              left: '-50%'
                            }}
                         >
                            <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transform -translate-y-4">{p.icon}</span>
                            <span className={cn("font-bold text-[10px] uppercase tracking-wider transform -translate-y-4", p.color)}>
                               {p.name.substring(0, 10)}
                            </span>
                         </div>
                      </div>
                    )
                  })}
                  {/* Inner Center Circle */}
                  <div className="absolute inset-0 m-auto w-12 h-12 bg-stone-900 rounded-full border-4 border-stone-700 z-10 shadow-[0_0_20px_rgba(0,0,0,1)] flex items-center justify-center">
                     <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,1)]"></div>
                  </div>
                </div>
            </div>

            {/* Controls */}
\);

fs.writeFileSync('frontend/src/components/pages/PowerRoleta.tsx', code);
console.log('Script done!');
