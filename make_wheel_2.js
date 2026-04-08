const fs = require('fs');
let text = fs.readFileSync('frontend/src/components/pages/PowerRoleta.tsx', 'utf-8');

const girarStart = text.indexOf('const girar = useCallback(async () => {');
const girarEnd = text.indexOf('}, [spinning, girosDisponiveis, profile, refreshProfile, config.prizes, girosUsados, extraSpins, weeklyTotal]);');

if (girarStart !== -1 && girarEnd !== -1) {
    const skipLen = '}, [spinning, girosDisponiveis, profile, refreshProfile, config.prizes, girosUsados, extraSpins, weeklyTotal]);'.length;
    const new_girar = `const girar = useCallback(async () => {
    if (spinning || girosDisponiveis <= 0 || !profile?.userId) return;
    setSpinning(true);
    setResult(null);

    // Weighted Random Selection
    const rand = Math.random() * 100;
    let accumulated = 0;
    let selected = config.prizes[0];
    
    for (const p of config.prizes) {
        accumulated += p.chance;
        if (rand <= accumulated) {
            selected = p;
            break;
        }
    }

    const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    setPrizeNumber(prizeIndex);
    setMustSpin(true);

  }, [spinning, girosDisponiveis, profile, config.prizes]);`;
    text = text.substring(0, girarStart) + new_girar + text.substring(girarEnd + skipLen);
} else {
    console.log("Could not find girar");
}

const jsxStart = text.indexOf('{/* Machine Display */}');
const jsxEnd = text.indexOf('{/* Controls */}');
if (jsxStart !== -1 && jsxEnd !== -1) {
    const new_jsx = `{/* Wheel Display */}
            <div className="flex flex-col items-center justify-center my-8 z-10 w-full overflow-hidden max-w-sm sm:max-w-md mx-auto pointer-events-none">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={config.prizes.map((p, i) => ({ 
                      option: p.name.substring(0, 10),
                      style: { backgroundColor: i % 2 === 0 ? '#1f1c1c' : '#2a2626', textColor: p.color ? (p.color.includes('amber')?'#f59e0b':p.color.includes('emerald')?'#10b981':p.color.includes('blue')?'#3b82f6':p.color.includes('purple')?'#a855f7':p.color.includes('red')?'#ef4444':'#ffffff') : '#ffffff' }
                  }))}
                  backgroundColors={['#1f1c1c', '#2a2626']}
                  textColors={['#ffffff']}
                  outerBorderColor="#dc2626"
                  outerBorderWidth={6}
                  innerBorderColor="#1f2937"
                  innerBorderWidth={15}
                  innerRadius={10}
                  radiusLineColor="#3f3f46"
                  radiusLineWidth={2}
                  onStopSpinning={async () => {
                    setMustSpin(false);
                    const selected = config.prizes[prizeNumber];
                    
                    try {
                      await addDoc(collection(db, 'power_roletas'), {
                        userId: profile?.userId,
                        premio: selected.name,
                        data: Timestamp.now(),
                        entregue: false,
                      });

                      const hasWeeklyAvailable = weeklyTotal > girosUsados;
                      if (!hasWeeklyAvailable && extraSpins > 0) {
                        await updateDoc(doc(db, 'usuarios', profile?.userId), {
                            extraSpins: increment(-1)
                        });
                      }
                    } catch (err) {
                      console.error('Erro ao salvar:', err);
                    }
                    
                    setResult(selected);
                    setGirosUsados(prev => prev + 1);
                    await refreshProfile?.();
                    setSpinning(false);
                  }}
                />
            </div>

            `;
    text = text.substring(0, jsxStart) + new_jsx + text.substring(jsxEnd);
} else {
    console.log("Could not find jsx");
}

fs.writeFileSync('frontend/src/components/pages/PowerRoleta.tsx', text, 'utf-8');
console.log('Done replacement script 2');
