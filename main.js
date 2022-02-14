import * as THREE from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/optimized/three.js";
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/loaders/OBJLoader.js';

import { EffectComposer } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/UnrealBloomPass.js';

// Useful variables
let orbitTime = 0;
let rotationTime = 0;
let systemRadius = 0.0;
let generalSpeed = 1;
const SUN_RADIUS = 5;
const lightIntensity = 0.8;

let planets = [];
let orbits = [];

let shouldRotate = true;
let shouldOrbit = true;
let shouldUseSpecialSun = false;


// Init elements for scene
const CANVAS = document.querySelector('#scene-canvas');

const RENDERER = new THREE.WebGLRenderer({canvas: CANVAS});
RENDERER.shadowMap.enabled = true;
RENDERER.shadowMap.type = THREE.PCFSoftShadowMap;
RENDERER.physicallyCorrectLights = true;

const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
CAMERA.position.z = 15;

const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const objLoader = new OBJLoader();

const axesHelper = new THREE.AxesHelper( SUN_RADIUS + 3 );
axesHelper.visible = false; // init: hidden
scene.add( axesHelper );

var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5)
scene.add( ambientLight )

const light = newPointLight();
scene.add(light);

// Camera control
const controls = new OrbitControls(CAMERA, CANVAS);
controls.update();

// Set background
spaceCubeBackground(textureLoader, scene);
scene.background = textureLoader.load("./textures/alf.jpg");

// Add sun and load teapot
const sun = newSun(SUN_RADIUS);
let teapot = objLoader.load("./models/teapot.obj", loadTeapotSun, onProgress, onError);

// Post-proccesing (glow effect)
const renderScene = new RenderPass( scene, CAMERA );

const bloom = {
    strength: 1,
    threshold: 0.3,
    radius: 0.4
};
const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 
                                        bloom.strength, bloom.radius, bloom.threshold );

const composer = new EffectComposer( RENDERER );
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass( renderScene );
composer.addPass( bloomPass );

// Add event listeners
document.getElementById('new-planet-submit')
    .addEventListener("click", AddNewPlanet, false);

document.getElementById('show-axes-helper')
    .addEventListener("click", (event) => {axesHelper.visible = event.target.checked}, false);

document.getElementById('should-rotate')
    .addEventListener("click", (event) => {shouldRotate = event.target.checked}, false);

document.getElementById('should-orbit')
    .addEventListener("click", (event) => {shouldOrbit = event.target.checked}, false);

document.getElementById('speed')
    .addEventListener("input", (event) => {generalSpeed = event.target.value}, false);

document.getElementById('special-sun')
    .addEventListener("click", ShowTeapot, false);

document.getElementById('bloom-strength')
    .addEventListener("input", (event) => {bloomPass.strength = event.target.value;}, false);
document.getElementById('bloom-threshold')
    .addEventListener("input", (event) => {bloomPass.threshold = event.target.value;}, false);
document.getElementById('bloom-radius')
    .addEventListener("input", (event) => {bloomPass.radius = event.target.value;}, false);

// Render scene
requestAnimationFrame(render);

// Functions
function spaceCubeBackground(textureLoader, scene) {
    let spaceTexture = textureLoader.load("./textures/space.jpg");
    let boxGeo = new THREE.BoxGeometry(100, 100, 100);
    let spaceMaterial = new THREE.MeshBasicMaterial({map:spaceTexture});
    spaceMaterial.side = THREE.BackSide;
    let sceneBox = new THREE.Mesh(boxGeo, spaceMaterial);
    scene.add(sceneBox);
}

function newPointLight() {
    const light = new THREE.PointLight( 0xffffff, 1);
    light.power = 300 * lightIntensity; 
    light.castShadow = true; 

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    return light;
}

function newSun(radius) {
    let texture = textureLoader.load("./textures/sunPOT.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2,2);
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    geometry.computeBoundingSphere();
    const material = new THREE.MeshLambertMaterial( { 
        emissive: 0xFFFFFF, 
        emissiveIntensity: lightIntensity*1.3,
        emissiveMap: texture,
        map: texture,
        combine: THREE.AddOperation
    } );
    material.side = THREE.FrontSide;
    systemRadius = radius;
    const sun = new THREE.Mesh( geometry, material );
    scene.add(sun);

    return sun;
}

function newPlanet(radius, color, orbitRadius, texture) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    geometry.computeBoundingSphere();
    let parameters;    
    if (texture) {
        parameters = {map: texture, combine: THREE.AddOperation};
    } else {
        parameters = {color: color};
    }
    let material = new THREE.MeshLambertMaterial(parameters);
    
    const planet = new THREE.Mesh( geometry, material );    
    putIntoOrbit(planet, radius, orbitRadius);

    planet.castShadow = true;
    planet.receiveShadow = true; 
    planets.push(planet);
    orbits.push(orbitRadius);
    scene.add(planet);
    systemRadius = orbitRadius + radius;
    return planet;
}

function putIntoOrbit(planet, radius, orbitRadius) {
    let speedFactor = 1 / (radius + orbitRadius);
    planet.position.x = Math.sin(speedFactor * orbitTime) * orbitRadius;
    planet.position.y = Math.cos(speedFactor * orbitTime) * orbitRadius;
}

function onError( error ) {
    console.log( 'An error happened' );
}

function onProgress ( xhr ) {
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
}

function loadTeapotSun(teapotOBJ) {
    teapotOBJ.traverse( function (child) {
                        if ( child instanceof THREE.Mesh ) {
                            child.material = sun.material;
                            child.material.side = THREE.DoubleSide;
                            child.scale.set(0.5,0.5,0.5);
                            child.geometry.boundingSphere = sun.geometry.boundingSphere;
                        }
                    });
    teapot = teapotOBJ;
    teapot.position.z = -3;
    teapot = teapot.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI/2);
    teapot = teapot.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI/2);
    teapot.visible = false;
    scene.add(teapot);
}

function AddNewPlanet(event) {
    let radius = parseInt(document.getElementById("new-planet-radius").value);
    let color = document.getElementById("new-planet-color").value;
    let texture = getTexture();
    let planetPosition = systemRadius + 1.0 + radius;

    newPlanet(radius, color, planetPosition, texture);
}

function getTexture() {
    let fileName = document.getElementById("texture-selector").value;
    let texture;
    if ( fileName != "" ) {
        texture = textureLoader.load( fileName );
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4,4);
    }
    return texture;
}

function ShowTeapot(event) {
    shouldUseSpecialSun = event.target.checked;
    teapot.visible = shouldUseSpecialSun;
    sun.visible = !shouldUseSpecialSun;
}

function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

function render () {
    
    if (resizeRendererToDisplaySize(RENDERER)) {
        const canvas = RENDERER.domElement;
        CAMERA.aspect = canvas.clientWidth / canvas.clientHeight;
        CAMERA.updateProjectionMatrix();
    }
    
    if (shouldRotate) {
        rotationTime += 0.1 * generalSpeed;
        if (teapot) {
            teapot.rotation.y = -1 * rotationTime*0.05;
        }
        sun.rotation.z = -1 * rotationTime*0.05;
        planets.forEach(planet => planet.rotation.z = -1 * rotationTime*0.2);
    }
    if (shouldOrbit) {
        orbitTime += 0.05 * generalSpeed;
        for ( var i = 0; i < planets.length; i++ ) {
            putIntoOrbit(planets[i], planets[i].geometry.boundingSphere.radius, orbits[i]);
        }
    }
    composer.render(scene, CAMERA);
    requestAnimationFrame(render);
}