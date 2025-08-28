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

export const RubiksCube = forwardRef(({ onStateChange }, ref) => {
  const [cubelets, setCubelets] = useState(getInitialCubeState());
  const isAnimating = useRef(false);
  const groupRef = useRef();

  const checkSolved = (currentCubelets) => {
    for (const cubelet of currentCubelets) {
      const pos = cubelet.position;
      const rot = cubelet.rotation;
      const expectedId = `x${Math.round(pos.x)}y${Math.round(pos.y)}z${Math.round(pos.z)}`;
      if (cubelet.id !== expectedId) return false;
      const isRotated = Math.abs(rot.x % (2 * Math.PI)) > 0.1 ||
                        Math.abs(rot.y % (2 * Math.PI)) > 0.1 ||
                        Math.abs(rot.z % (2 * Math.PI)) > 0.1;
      if (isRotated) return false;
    }
    return true;
  };
  
  const getFaceletString = () => {
    const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
    const faceNormals = {
      U: new THREE.Vector3(0, 1, 0), R: new THREE.Vector3(1, 0, 0), F: new THREE.Vector3(0, 0, 1),
      D: new THREE.Vector3(0, -1, 0), L: new THREE.Vector3(-1, 0, 0), B: new THREE.Vector3(0, 0, -1),
    };
    const faceletPositions = {
      U: [[-1, 1, -1], [0, 1, -1], [1, 1, -1], [-1, 1, 0], [0, 1, 0], [1, 1, 0], [-1, 1, 1], [0, 1, 1], [1, 1, 1]],
      R: [[1, 1, -1], [1, 1, 0], [1, 1, 1], [1, 0, -1], [1, 0, 0], [1, 0, 1], [1, -1, -1], [1, -1, 0], [1, -1, 1]],
      F: [[-1, 1, 1], [0, 1, 1], [1, 1, 1], [-1, 0, 1], [0, 0, 1], [1, 0, 1], [-1, -1, 1], [0, -1, 1], [1, -1, 1]],
      D: [[-1, -1, 1], [0, -1, 1], [1, -1, 1], [-1, -1, 0], [0, -1, 0], [1, -1, 0], [-1, -1, -1], [0, -1, -1], [1, -1, -1]],
      L: [[-1, 1, 1], [-1, 1, 0], [-1, 1, -1], [-1, 0, 1], [-1, 0, 0], [-1, 0, -1], [-1, -1, 1], [-1, -1, 0], [-1, -1, -1]],
      B: [[1, 1, -1], [0, 1, -1], [-1, 1, -1], [1, 0, -1], [0, 0, -1], [-1, 0, -1], [1, -1, -1], [0, -1, -1], [-1, -1, -1]],
    };
    let faceletString = '';
    for (const face of faceOrder) {
      const normal = faceNormals[face];
      for (const pos of faceletPositions[face]) {
        const positionVec = new THREE.Vector3(...pos);
        const cubelet = cubelets.find(c => c.position.equals(positionVec));
        if (!cubelet) return "Error: Cube state invalid.";
        const cubeletRotation = new THREE.Quaternion().setFromEuler(cubelet.rotation);
        let colorNormal = normal.clone().applyQuaternion(cubeletRotation.clone().invert());
        let color = '?';
        if (Math.abs(colorNormal.y - 1) < 0.1) color = 'U'; else if (Math.abs(colorNormal.x - 1) < 0.1) color = 'R';
        else if (Math.abs(colorNormal.z - 1) < 0.1) color = 'F'; else if (Math.abs(colorNormal.y - -1) < 0.1) color = 'D';
        else if (Math.abs(colorNormal.x - -1) < 0.1) color = 'L'; else if (Math.abs(colorNormal.z - -1) < 0.1) color = 'B';
        faceletString += color;
      }
    }
    return faceletString;
  };

  useImperativeHandle(ref, () => ({
    rotateFace,
    getFaceletString,
  }), [cubelets]);

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
        
        if (onStateChange) {
          onStateChange(checkSolved(updatedCubelets));
        }
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