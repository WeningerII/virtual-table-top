
import * as THREE from 'three';
import { TerrainCell } from '../types';

const vertexShader = `
  varying vec4 vColor;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vColor = color;
    vElevation = position.y;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec4 vColor;
  varying float vElevation;
  varying vec3 vNormal;

  void main() {
    vec3 grassColor = vec3(0.3, 0.6, 0.2);
    vec3 dirtColor = vec3(0.5, 0.35, 0.2);
    vec3 stoneColor = vec3(0.5, 0.5, 0.5);
    vec3 sandColor = vec3(0.9, 0.8, 0.6);
    vec3 waterColor = vec3(0.2, 0.4, 0.7);
    
    vec3 finalColor;

    // vColor.r = stone flag
    // vColor.g = dirt flag
    // vColor.b = water flag
    // vColor.a = sand flag

    if(vColor.b > 0.0){ // Water flag
        finalColor = waterColor;
    } else if (vColor.a > 0.0) { // Sand flag
        finalColor = sandColor;
    } else {
        // Calculate slope: dot product of normal with up vector.
        // 1.0 is flat, 0.0 is vertical.
        float slopeFactor = dot(vNormal, vec3(0.0, 1.0, 0.0));
        float stoneMix = smoothstep(0.75, 0.5, slopeFactor); // Mix in stone on steeper slopes (lower dot product)

        vec3 baseColor = mix(grassColor, dirtColor, vColor.g); // Mix dirt based on original type
        finalColor = mix(baseColor, stoneColor, stoneMix); // Mix stone based on slope
    }

    // Add some slight darkening based on elevation to simulate ambient occlusion
    finalColor.rgb *= (1.0 - clamp(vElevation / 200.0, 0.0, 0.3));

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export const generateTerrainMesh = (terrainData: TerrainCell[][], cellSize: number): THREE.Mesh => {
    if (!terrainData || terrainData.length === 0 || terrainData[0].length === 0) {
        // Return an empty mesh if terrain data is invalid to prevent crashes.
        return new THREE.Mesh();
    }
    const height = terrainData.length;
    const width = terrainData[0].length;
    
    const geometry = new THREE.PlaneGeometry(width * cellSize, height * cellSize, width - 1, height - 1);
    geometry.rotateX(-Math.PI / 2);

    const vertices = geometry.attributes.position.array as Float32Array;
    const colors: number[] = [];

    const elevationMultiplier = 20;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x);
            const dataCell = terrainData[y]?.[x] || { type: 'grass', elevation: 0 };
            
            // Ensure elevation is a valid number, defaulting to 0 if not.
            const elevation = (dataCell.elevation || 0) * elevationMultiplier;
            vertices[index * 3 + 1] = isNaN(elevation) ? 0 : elevation;

            let r = 0, g = 0, b = 0, a = 0; // r=stone, g=dirt, b=water, a=sand

            switch(dataCell.type) {
                case 'water': b = 1.0; break;
                case 'sand': a = 1.0; break;
                case 'stone': r = 1.0; break;
                case 'dirt': g = 1.0; break;
                case 'grass':
                default:
                    // Grass is the default, no flag needed
                    break;
            }

            colors.push(r, g, b, a);
        }
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        vertexColors: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.position.set((width * cellSize) / 2, 0, (height * cellSize) / 2);
    
    return mesh;
};
