import React from 'react';

const colors = {
  white: '#FFFFFF',
  yellow: '#FFFF00',
  green: '#009B48',
  blue: '#0045AD',
  red: '#D42100',
  orange: '#FF8C00',
  black: '#1e1e1e',
};

export function Cubelet({ position, rotation }) {
  const [x, y, z] = Array.isArray(position) ? position : [position.x, position.y, position.z];

  const faceColors = [
    x === 1 ? colors.red : colors.black,
    x === -1 ? colors.orange : colors.black,
    y === 1 ? colors.white : colors.black,
    y === -1 ? colors.yellow : colors.black,
    z === 1 ? colors.green : colors.black,
    z === -1 ? colors.blue : colors.black,
  ];

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[0.95, 0.95, 0.95]} />
      {faceColors.map((color, index) => (
        <meshStandardMaterial
          key={index}
          attach={`material-${index}`}
          color={color}
          roughness={0.2}
        />
      ))}
    </mesh>
  );
}