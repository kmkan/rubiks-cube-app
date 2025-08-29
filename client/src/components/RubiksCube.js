// client/src/components/RubiksCube.js

import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { Cubelet } from './Cubelet';

const getInitialCubeState = () => {
  const cubelets = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubelets.push({
          id: `x${x}y${y}z${z}`,
          position: new THREE.Vector3(x, y, z),
          rotation: new THREE.Euler(0, 0, 0),
        });
      }
    }
  }
  return cubelets;
};

export const RubiksCube = forwardRef((props, ref) => {
  const [cubelets, setCubelets] = useState(getInitialCubeState());
  const isAnimating = useRef(false);
  const groupRef = useRef();

  useImperativeHandle(ref, () => ({
    rotateFace,
  }));

  const rotateFace = (axis, layer, direction, isWide = false) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    let rotationAxisKey;
    if (Math.abs(axis.x) > 0.5) rotationAxisKey = 'x';
    else if (Math.abs(axis.y) > 0.5) rotationAxisKey = 'y';
    else rotationAxisKey = 'z';
    const angle = (Math.PI / 2) * direction;
    const pivot = new THREE.Group();
    groupRef.current.add(pivot);
    const cubeletsToRotate = [];
    groupRef.current.children.forEach(child => {
      if (child.isMesh) {
        const pos = Math.round(child.position[rotationAxisKey]);
        const shouldRotate = isWide ? (pos === layer || pos === 0) : (pos === layer);
        if (shouldRotate) {
          cubeletsToRotate.push(child);
        }
      }
    });
    cubeletsToRotate.forEach(child => {
      pivot.attach(child);
    });
    gsap.to(pivot.rotation, {
      [rotationAxisKey]: pivot.rotation[rotationAxisKey] + angle,
      duration: 0.2,
      ease: 'power2.inOut',
      onComplete: () => {
        pivot.updateMatrixWorld();
        const updatedCubelets = [...cubelets];
        cubeletsToRotate.forEach(child => {
          const newPosition = new THREE.Vector3();
          const newQuaternion = new THREE.Quaternion();
          child.getWorldPosition(newPosition);
          child.getWorldQuaternion(newQuaternion);
          groupRef.current.attach(child);
          const cubeletData = updatedCubelets.find(c => c.id === child.userData.id);
          if (cubeletData) {
            cubeletData.position.copy(newPosition).round();
            cubeletData.rotation.setFromQuaternion(newQuaternion);
          }
        });
        groupRef.current.remove(pivot);
        setCubelets(updatedCubelets);
        isAnimating.current = false;
      },
    });
  };

  return (
    <group ref={groupRef}>
      {cubelets.map((cubelet) => (
        <Cubelet
          key={cubelet.id}
          userData={{ id: cubelet.id }}
          position={cubelet.position.toArray()}
          rotation={cubelet.rotation.toArray()}
        />
      ))}
    </group>
  );
});