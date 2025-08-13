import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { VTTMap, Token, VTTObject, TerrainCell, VFXRequest, NpcAnimationState, StaticGameDataCache, ObjectBlueprint, MapNpcInstance, Viewport, EncounterConcept, SpellTargetingState } from './types';
import { assetManager } from './services/assetManager';
import { generateTerrainMesh } from '../utils/terrain';
import { vfxManager } from './vfx';

const createTokenMesh = (token: Token, cellSize: number, isPreview = false): THREE.Group => {
    const group = new THREE.Group();
    group.name = `vtt-token-${token.id}`;

    // Base
    const baseGeo = new THREE.CircleGeometry(token.size * cellSize / 2, 32);
    const baseMat = new THREE.MeshBasicMaterial({ 
        color: token.color,
        transparent: isPreview,
        opacity: isPreview ? 0.6 : 1.0,
     });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.rotation.x = -Math.PI / 2;
    group.add(base);

    // Portrait
    if (token.imageUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(token.imageUrl, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            const portraitGeo = new THREE.CircleGeometry((token.size * cellSize / 2) * 0.9, 32);
            const portraitMat = new THREE.MeshBasicMaterial({ 
                map: texture,
                transparent: isPreview,
                opacity: isPreview ? 0.6 : 1.0,
            });
            const portrait = new THREE.Mesh(portraitGeo, portraitMat);
            portrait.rotation.x = -Math.PI / 2;
            portrait.position.y = 1; 
            group.add(portrait);
        });
    } else {
         const canvas = document.createElement('canvas');
         canvas.width = 128;
         canvas.height = 128;
         const context = canvas.getContext('2d')!;
         context.fillStyle = token.color;
         context.fillRect(0, 0, 128, 128);
         context.font = 'bold 80px sans-serif';
         context.fillStyle = 'white';
         context.textAlign = 'center';
         context.textBaseline = 'middle';
         context.fillText(token.name.charAt(0).toUpperCase(), 64, 64);
         const texture = new THREE.CanvasTexture(canvas);
         const portraitGeo = new THREE.CircleGeometry((token.size * cellSize / 2) * 0.9, 32);
         const portraitMat = new THREE.MeshBasicMaterial({ map: texture, transparent: isPreview, opacity: isPreview ? 0.6 : 1.0 });
         const portrait = new THREE.Mesh(portraitGeo, portraitMat);
         portrait.rotation.x = -Math.PI / 2;
         portrait.position.y = 1;
         group.add(portrait);
    }
    
    group.userData = { id: token.id, type: 'token' };
    return group;
}


export class VTTRenderer {
    private renderer: THREE.WebGLRenderer;
    private labelRenderer: CSS2DRenderer;
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private mount: HTMLDivElement;
    private animationFrameId: number = 0;

    private tokenMeshes = new Map<string, THREE.Object3D>();
    private mapPlane: THREE.Mesh | null = null;
    private terrainMesh: THREE.Mesh | null = null;
    private gridHelper: THREE.GridHelper | null = null;
    private activeTokenIndicator: THREE.Mesh | null = null;
    private targetIndicator: THREE.Mesh | null = null;
    private measureLine: THREE.Line | null = null;
    private measureLabel: CSS2DObject | null = null;
    private spellTemplateMesh: THREE.Mesh | null = null;
    private placementPreviewMesh: THREE.Group | null = null;
    private activeAnimations: { object: THREE.Object3D, path: {x:number, y:number}[], startTime: number, duration: number }[] = [];

    private staticDataCache: StaticGameDataCache;

    constructor(mount: HTMLDivElement, staticDataCache: StaticGameDataCache) {
        this.mount = mount;
        this.staticDataCache = staticDataCache;
        this.scene = new THREE.Scene();

        const aspect = mount.clientWidth / mount.clientHeight;
        const frustumSize = 1500;
        this.camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 1, 10000);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.labelRenderer = new CSS2DRenderer();

        this.init();
    }

    private init() {
        this.scene.background = new THREE.Color(0x1a202c);
        
        this.renderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.mount.appendChild(this.renderer.domElement);
        
        this.labelRenderer.setSize(this.mount.clientWidth, this.mount.clientHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        this.mount.appendChild(this.labelRenderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(100, 200, 100);
        this.scene.add(directionalLight);

        window.addEventListener('resize', this.handleResize);
        this.animate();
    }
    
    public getGridIntersection(mouse: THREE.Vector2): THREE.Vector3 | null {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        return raycaster.ray.intersectPlane(plane, intersection) ? intersection : null;
    }

    public getIntersectedObject(mouse: THREE.Vector2): THREE.Object3D | null {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        const tokenMeshes = Array.from(this.tokenMeshes.values());
        const intersects = raycaster.intersectObjects(tokenMeshes, true);

        if (intersects.length > 0) {
            let currentObject = intersects[0].object;
            while (currentObject.parent && currentObject.parent.type !== 'Scene') {
                if (currentObject.userData.id) return currentObject;
                currentObject = currentObject.parent;
            }
            return currentObject.userData.id ? currentObject : null;
        }
        return null;
    }

    public getTokenMeshes(): Map<string, THREE.Object3D> { return this.tokenMeshes; }
    private handleResize = () => { /* ... same as before ... */ };

    private animate = () => {
        this.animationFrameId = requestAnimationFrame(this.animate);
        
        const now = Date.now();
        this.activeAnimations = this.activeAnimations.filter(anim => {
            const progress = (now - anim.startTime) / anim.duration;
            if (progress >= 1) { return false; }

            const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            const easedProgress = easeInOutQuad(progress);

            const pathIndex = Math.floor(easedProgress * (anim.path.length - 1));
            const nextIndex = Math.min(pathIndex + 1, anim.path.length - 1);
            const segmentProgress = (easedProgress * (anim.path.length - 1)) - pathIndex;
            
            const startPos = new THREE.Vector3(anim.path[pathIndex].x * 50, 2, anim.path[pathIndex].y * 50);
            const endPos = new THREE.Vector3(anim.path[nextIndex].x * 50, 2, anim.path[nextIndex].y * 50);

            anim.object.position.lerpVectors(startPos, endPos, segmentProgress);
            return true;
        });

        if (this.activeTokenIndicator && this.activeTokenIndicator.visible) {
            this.activeTokenIndicator.rotation.z -= 0.02;
            this.activeTokenIndicator.position.y = 5 + Math.sin(now * 0.005) * 2; // Bobbing motion
        }
        this.renderer.render(this.scene, this.camera);
        this.labelRenderer.render(this.scene, this.camera);
    };

    public updateTerrainMesh(terrainData: TerrainCell[][], cellSize: number) { /* ... same as before ... */ }
    public updateMapBackground(imageUrl: string, grid: VTTMap['grid']) { /* ... same as before ... */ }
    public update(props: { viewport: Viewport, activeTokenId: string | null, targetTokenId: string | null, measurePoints?: { start: THREE.Vector3; end: THREE.Vector3 } | null, cellSize?: number, placementPreviewToken?: Token | null }) { /* ... same as before ... */ }
    private updateIndicators(activeTokenId: string | null, targetTokenId: string | null) { /* ... same as before ... */ }
    private updatePlacementPreview(token: Token | null, cellSize: number) { /* ... same as before ... */ }
    public updateMeasurement(points: { start: THREE.Vector3; end: THREE.Vector3 } | null, cellSize: number) { /* ... same as before ... */ }
    public updateSpellTemplate(state: SpellTargetingState | null, casterPosition: THREE.Vector3 | null, targetPosition: THREE.Vector3 | null, cellSize: number) { /* ... same as before ... */ }

    public updateTokens(currentTokens: Token[], prevTokens: Token[], isDmMode: boolean, mapNpcInstances: MapNpcInstance[], cellSize: number) {
        // ... (removal and add/update logic from before)
        currentTokens.forEach(token => {
            // ...
            const existingMesh = this.tokenMeshes.get(token.id);
            if (existingMesh) { 
                if (!this.activeAnimations.some(a => a.object === existingMesh)) {
                    existingMesh.position.set(token.x * cellSize, 2, token.y * cellSize);
                }
            }
            // ...
        });
    }

    public startTokenAnimation(animationState: NpcAnimationState) {
        const tokenMesh = this.tokenMeshes.get(animationState.tokenId);
        if (tokenMesh) {
            this.activeAnimations.push({ object: tokenMesh, ...animationState });
        }
    }

    public showDamageNumber(damageInfo: { targetId: string; amount: number; isCrit: boolean }) {
        const targetMesh = this.tokenMeshes.get(damageInfo.targetId);
        if (!targetMesh) return;

        const div = document.createElement('div');
        div.textContent = damageInfo.amount.toString();
        div.className = `font-bold transition-all duration-1000 ease-out ${damageInfo.isCrit ? 'text-4xl text-yellow-400' : 'text-2xl text-red-500'}`;
        div.style.textShadow = '1px 1px 2px black';
        
        const label = new CSS2DObject(div);
        label.position.copy(targetMesh.position);
        this.scene.add(label);

        const startTime = Date.now();
        const duration = 1500;
        const animate = () => {
            const elapsedTime = Date.now() - startTime;
            const progress = elapsedTime / duration;
            if (progress < 1) {
                label.position.y += 0.5;
                div.style.opacity = `${1 - progress}`;
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(label);
            }
        };
        animate();
    }

    public playVFX(request: VFXRequest) {
        vfxManager.createEffect(request, this.scene);
    }
    
    public dispose() { /* ... same as before ... */ }
}