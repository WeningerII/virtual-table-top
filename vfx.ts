
import * as THREE from 'three';
import { Spell, VFXRequest } from '../types';

// A simple VFX manager to create and manage spell effects
export const vfxManager = {
    createEffect(request: VFXRequest, scene: THREE.Scene): void {
        switch (request.type) {
            case 'fireball':
                this.createFireballEffect(request.position, scene);
                break;
            case 'bless':
                this.createBlessEffect(request.position, scene);
                break;
            case 'fog-cloud':
                this.createFogCloudEffect(request.position, scene);
                break;
            case 'lightning-bolt':
                 if (request.targetPosition) {
                    this.createLightningBoltEffect(request.position, request.targetPosition, scene);
                }
                break;
            case 'attack-hit':
                 this.createAttackHitEffect(request.position, scene);
                 break;
            case 'generic-hit':
                 this.createGenericSpellEffect(request.position, scene);
                 break;
            default:
                // Generic effect for other spells
                this.createGenericSpellEffect(request.position, scene);
                break;
        }
    },

    createFireballEffect(position: THREE.Vector3, scene: THREE.Scene): void {
        const geometry = new THREE.SphereGeometry(1, 32, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.7 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        sphere.scale.set(0.1, 0.1, 0.1);
        scene.add(sphere);

        let scale = 0.1;
        const targetScale = 20 * 5; // Radius of 20ft
        const duration = 500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            scale = 0.1 + (targetScale - 0.1) * progress;
            sphere.scale.set(scale, scale, scale);
            material.opacity = 0.7 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(sphere);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    },

    createBlessEffect(position: THREE.Vector3, scene: THREE.Scene): void {
        const geometry = new THREE.CylinderGeometry(25, 25, 5, 32, 1, true);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.copy(position);
        cylinder.position.y += 2.5;
        scene.add(cylinder);

        const duration = 1500; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            cylinder.position.y += 0.5;
            material.opacity = 0.5 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(cylinder);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    },
    
    createFogCloudEffect(position: THREE.Vector3, scene: THREE.Scene): void {
        const geometry = new THREE.SphereGeometry(20 * 5, 32, 16); // 20ft radius
        const material = new THREE.MeshBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.6,
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        scene.add(sphere);

        setTimeout(() => {
            scene.remove(sphere);
            geometry.dispose();
            material.dispose();
        }, 10000);
    },

     createLightningBoltEffect(start: THREE.Vector3, end: THREE.Vector3, scene: THREE.Scene) {
        const material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
        const points = [start, end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, material);
        scene.add(line);
        
        setTimeout(() => {
            scene.remove(line);
            geometry.dispose();
            material.dispose();
        }, 300);
    },
    
    createAttackHitEffect(position: THREE.Vector3, scene: THREE.Scene): void {
        const geometry = new THREE.SphereGeometry(20, 16, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.copy(position);
        scene.add(sphere);

        const duration = 250; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            material.opacity = 0.8 * (1 - progress);
            sphere.scale.set(1 + progress, 1 + progress, 1 + progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(sphere);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    },


    createGenericSpellEffect(position: THREE.Vector3, scene: THREE.Scene): void {
        const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
        const material = new THREE.MeshBasicMaterial({ color: 0x8A2BE2, transparent: true, opacity: 0.8 });
        const torus = new THREE.Mesh(geometry, material);
        torus.position.copy(position);
        torus.rotation.x = Math.PI / 2;
        scene.add(torus);

        let scale = 0.1;
        const targetScale = 3;
        const duration = 800;
        const startTime = Date.now();

        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            
            scale = 0.1 + (targetScale - 0.1) * progress;
            torus.scale.set(scale, scale, scale);
            material.opacity = 0.8 * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                scene.remove(torus);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    },
};