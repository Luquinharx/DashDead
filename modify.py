import codecs
import re
import sys

def main():
    file_path = 'frontend/src/components/pages/PowerRoleta.tsx'
    
    with codecs.open(file_path, 'r', 'utf8') as f:
        text = f.read()

    # 1. Imports
    if 'react-custom-roulette' not in text:
        text = text.replace("import { Gift } from 'lucide-react';", "import { Gift } from 'lucide-react';\nimport { Wheel } from 'react-custom-roulette';")

    # 2. State
    text = text.replace("const [slots, setSlots] = useState(['❓', '❓', '❓']);", "const [mustSpin, setMustSpin] = useState(false);\n  const [prizeNumber, setPrizeNumber] = useState(0);")

    # 3. girar() function internals
    # Remote the initial setSlots
    text = text.replace("setSlots(['🎰', '🎰', '🎰']);", "")
    
    # Replace interval spinning logic to Wheel preparation
    # Find all the interval logic up to clearInterval
    # interval is:
    # const interval = setInterval(() => {
    #     setSlots([...]);
    # }, 100);
    # await new Promise(r => setTimeout(r, 3000));
    # clearInterval(interval);
    
    interval_match = re.search(r"const interval = setInterval\([\s\S]*?clearInterval\(interval\);", text)
    if interval_match:
        wheel_setup = """const prizeIndex = config.prizes.findIndex(p => p.id === selected.id);
    setPrizeNumber(prizeIndex);
    setMustSpin(true);"""
        text = text.replace(interval_match.group(0), wheel_setup)

    # Remove the final setSlots
    text = text.replace("setSlots([selected.icon, selected.icon, selected.icon]);", "")

    # Move save to firestore out of \`girar\` to \`onStopSpinning\`
    save_logic_match = re.search(r"try\s*\{[\s\S]*?setSpinning\(false\);", text)
    save_logic_code = save_logic_match.group(0) if save_logic_match else ""
    if save_logic_match:
        text = text.replace(save_logic_match.group(0), "")

    # Modify the visual part: replace Machine Display with Wheel Display
    old_jsx = re.search(r"\{\/\* Machine Display \*\/\}[\s\S]*?\{\/\* Controls \*\/\}", text)
    
    # Adjust save logic for the Wheel component
    # The wheel will run \`onStopSpinning\` which takes over the saving
    save_logic_clean = save_logic_code.replace("setSpinning(false);", "") 

    wheel_jsx = """{/* Wheel Display */}
            <div className="relative z-10 flex items-center justify-center my-8 w-full overflow-hidden max-w-sm sm:max-w-md mx-auto">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={config.prizes.map((p, i) => ({ 
                      option: p.name.substring(0, 10),
                      style: { 
                          backgroundColor: i % 2 === 0 ? '#1f1c1c' : '#2a2626', 
                          textColor: p.color ? p.color.split('-')[1] : '#ffffff' 
                      }
                  }))}
                  backgroundColors={['#1f1c1c', '#2a2626']}
                  textColors={['#ffffff']}
                  outerBorderColor="#dc2626"
                  outerBorderWidth={5}
                  innerBorderColor="#1f2937"
                  innerBorderWidth={15}
                  innerRadius={10}
                  radiusLineColor="#3f3f46"
                  radiusLineWidth={1}
                  onStopSpinning={async () => {
                    setMustSpin(false);
                    const selected = config.prizes[prizeNumber];
                    
                    try {
                      await addDoc(collection(db, 'power_roletas'), {
                        userId: profile.userId,
                        premio: selected.name,
                        data: Timestamp.now(),
                        entregue: false,
                      });

                      const hasWeeklyAvailable = weeklyTotal > girosUsados;
                      if (!hasWeeklyAvailable && extraSpins > 0) {
                        await updateDoc(doc(db, 'usuarios', profile.userId), {
                            extraSpins: increment(-1)
                        });
                      }
                    } catch (err) {
                      console.error('Erro ao salvar:', err);
                    }
                    
                    setResult(selected);
                    setGirosUsados(prev => prev + 1);
                    await refreshProfile();
                    setSpinning(false);
                  }}
                />
            </div>

            {/* Controls */}"""

    if old_jsx:
        text = text.replace(old_jsx.group(0), wheel_jsx)
        
    # Change "Blood Slots" title to "Power Roleta"
    text = text.replace('<span className="text-red-600">Blood</span> Slots', '<span className="text-purple-600">Power</span> Roleta')
    
    with codecs.open(file_path, 'w', 'utf8') as f:
        f.write(text)

    print("Success")

if __name__ == '__main__':
    main()
