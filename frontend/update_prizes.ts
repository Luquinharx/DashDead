import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';
const prizes = [
    { id: 1, name: 'Normal (100k)', chance: 49, value: '100k', color: 'text-amber-500', icon: '??' },
    { id: 2, name: 'Rara (250k)', chance: 25, value: '250k', color: 'text-emerald-500', icon: '??' },
    { id: 3, name: 'Epica (500k)', chance: 15, value: '500k', color: 'text-blue-500', icon: '??' },
    { id: 4, name: 'Lendaria (1M)', chance: 10, value: '1M', color: 'text-purple-500', icon: '??' },
    { id: 5, name: 'Mitica (2.5M)', chance: 1, value: '2.5M', color: 'text-red-500', icon: '??' }
];

async function run() {
    try { await updateDoc(doc(db, 'config', 'casino'), { prizes }); } catch { await setDoc(doc(db, 'config', 'casino'), { prizes }, {merge:true}); }
    try { await updateDoc(doc(db, 'config', 'power_casino'), { prizes }); } catch { await setDoc(doc(db, 'config', 'power_casino'), { prizes }, {merge:true}); }
    console.log('Firebase updated successfully!');
    process.exit(0);
}
run();
