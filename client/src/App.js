import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RubiksCube } from './components/RubiksCube';
import * as THREE from 'three';
import './App.css';

function App() {
  const cubeRef = useRef();
  const [isSolved, setIsSolved] = useState(true);
  const [solution, setSolution] = useState(null);
  const [isScrambling, setIsScrambling] = useState(false);

  const keyMap = {
    'U': { axis: new THREE.Vector3(0, 1, 0), layer: 1 },
    'D': { axis: new THREE.Vector3(0, 1, 0), layer: -1 },
    'L': { axis: new THREE.Vector3(1, 0, 0), layer: -1 },
    'R': { axis: new THREE.Vector3(1, 0, 0), layer: 1 },
    'F': { axis: new THREE.Vector3(0, 0, 1), layer: 1 },
    'B': { axis: new THREE.Vector3(0, 0, 1), layer: -1 },
    'M': { axis: new THREE.Vector3(1, 0, 0), layer: 0 },
    'S': { axis: new THREE.Vector3(0, 0, 1), layer: 0 },
    'E': { axis: new THREE.Vector3(0, 1, 0), layer: 0 },
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey) {
        event.preventDefault();
      }
      const key = event.key.toUpperCase();
      if (keyMap[key] && cubeRef.current) {
        const isWide = event.altKey && ['U', 'D', 'L', 'R', 'F', 'B'].includes(key);
        let direction = event.shiftKey ? -1 : 1;
        if (['U', 'R', 'F', 'S'].includes(key)) {
          direction *= -1;
        }
        const { axis, layer } = keyMap[key];
        cubeRef.current.rotateFace(axis, layer, direction, isWide);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleScramble = () => {
    setSolution(null);
    setIsScrambling(true);
    if (!cubeRef.current) return;
    const scrambleMoves = ['U', 'D', 'L', 'R', 'F', 'B'];
    let moveCount = 0;
    const scrambleLength = 25;
    let lastMoveKey = null;

    const performMove = () => {
      if (moveCount >= scrambleLength) {
        setIsScrambling(false); 
        setIsSolved(false); 
        return;
      }
      let randomMoveKey;
      do {
        randomMoveKey = scrambleMoves[Math.floor(Math.random() * scrambleMoves.length)];
      } while (randomMoveKey === lastMoveKey);
      lastMoveKey = randomMoveKey;
      const { axis, layer } = keyMap[randomMoveKey];
      const direction = Math.random() < 0.5 ? 1 : -1;
      cubeRef.current.rotateFace(axis, layer, direction);
      moveCount++;
      setTimeout(performMove, 210);
    };
    performMove();
  };

  const handleGenerateSolution = async () => {
    if (cubeRef.current) {
      setSolution("Solving...");
      const faceletString = cubeRef.current.getFaceletString();
      try {
        const response = await fetch('/api/solve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faceletString }),
        });
        const data = await response.json();
        if (response.ok) {
          setSolution(data.solution);
        } else {
          setSolution(`Error: ${data.error}`);
        }
      } catch (e) {
        setSolution("Error: Could not connect to the server.");
      }
    }
  };

  const handleStateChange = (solvedState) => {
    if (!isScrambling) {
      setIsSolved(solvedState);
      if(solvedState) {
        setSolution(null); 
      }
    }
  };

  return (
    <>
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1, color: 'white', fontFamily: 'sans-serif' }}>
        <p>Use keys: U, D, L, R, F, B, M, S, E</p>
        <p>Hold Shift for counter-clockwise</p>
        <p>Hold Alt for wide moves (e.g., Alt+R for Rw)</p>
        <button 
          onClick={handleScramble} 
          style={{ marginTop: '10px', padding: '8px', cursor: 'pointer' }}
        >
          Scramble
        </button>
        {!isSolved && (
          <button onClick={handleGenerateSolution} style={{ marginLeft: '10px', padding: '8px', cursor: 'pointer' }}>
            Show Solution
          </button>
        )}
      </div>

      <Canvas camera={{ position: [8, 8, 8], fov: 25 }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 10, 5]} intensity={1.8} />
        <OrbitControls />
        <RubiksCube ref={cubeRef} onStateChange={handleStateChange} />
      </Canvas>

      {solution && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '1.2em',
        }}>
          Solution: {solution}
        </div>
      )}
    </>
  );
}

export default App;