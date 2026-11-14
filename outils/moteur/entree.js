// Construit vendor/three.bundle.js : three.js et les modules dont le site a besoin, exposés en global (window.THREE),
// pour que les fichiers js/ restent de simples scripts, sans étape de construction à la mise en ligne.
import * as CORE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

const THREE = Object.assign({}, CORE, { GLTFLoader, KTX2Loader, RGBELoader, MeshoptDecoder, EffectComposer, RenderPass, OutputPass, UnrealBloomPass, GTAOPass, SMAAPass, RoomEnvironment, Water, Sky });
window.THREE = THREE;
