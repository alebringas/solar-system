import * as THREE from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/optimized/three.js";
import { DragControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/DragControls.js";
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/TrackballControls.js';
import { OBJLoader } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/loaders/OBJLoader.js';

import { EffectComposer } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/postprocessing/UnrealBloomPass.js';

let orbitTime = 0;
let rotationTime = 0;
const CANVAS = document.querySelector('#scene-canvas');
const RENDERER = new THREE.WebGLRenderer({canvas: CANVAS});
RENDERER.shadowMap.enabled = true;
RENDERER.shadowMap.type = THREE.PCFSoftShadowMap;
RENDERER.physicallyCorrectLights = true;
let systemRadius = 0.0;
let shouldRotate = true;
let shouldOrbit = true;
let shouldUseSpecialSun = false;
let generalSpeed = 1;

const textureLoader = new THREE.TextureLoader();

const CAMERA = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
CAMERA.position.z = 10;

const scene = new THREE.Scene();
let planets = [];
let orbits = [];

setBackground();

function setBackground() {
    let spaceTexture = textureLoader.load("space.jpg");
    let boxGeo = new THREE.BoxGeometry(100, 100, 100);
    let spaceMaterial = new THREE.MeshBasicMaterial({map:spaceTexture});
    spaceMaterial.side = THREE.BackSide;
    let sceneBox = new THREE.Mesh(boxGeo, spaceMaterial);
    scene.add(sceneBox);
}

const SUN_RADIUS = 5;

const axesHelper = new THREE.AxesHelper( SUN_RADIUS + 3 );
axesHelper.visible = false; // inicia escondido
scene.add( axesHelper );

// ambient light
var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5)
scene.add( ambientLight )

const lightIntensity = 0.8;
const light = newPointLight();
scene.add(light);

function newPointLight() {
    const light = new THREE.PointLight( 0xffffff, 1);
    light.power = 300 * lightIntensity; // 800 l
    light.castShadow = true; 

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    return light;
}

// control de camara
// *** Orbit
const controls = new OrbitControls(CAMERA, CANVAS);
controls.target.set(0, 0, 0);
controls.update();

// *** Trackball
// const controls = new TrackballControls( camera, canvas );
// controls.rotateSpeed = 1.0;
// controls.zoomSpeed = 1.2;
// controls.panSpeed = 0.8;
// controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];

// TODO: glowy sun: https://stackoverflow.com/a/50958608 
const sun = newSun(SUN_RADIUS);
systemRadius = sun.geometry.boundingSphere.radius;
scene.add(sun);

let earthRadius = 2;
const earth = newPlanet(1, 0x0000ff, systemRadius + earthRadius + 1);
scene.add(earth);

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
    const sun = new THREE.Mesh( geometry, material );  
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
    

// const curve = new THREE.EllipseCurve(
// 	0.5,  0.5,            // ax, aY
// 	3, 5,           // xRadius, yRadius
// 	0,  2 * Math.PI,  // aStartAngle, aEndAngle
// 	false,            // aClockwise
// 	180                 // aRotation
// );

// const points = curve.getPoints( 50 );
// const ellgeometry = new THREE.BufferGeometry().setFromPoints( points );

// const ellmaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );

// // Create the final object to add to the scene
// const ellipse = new THREE.Line( ellgeometry, ellmaterial );
// scene.add(ellipse);


//const controls = new DragControls([sun, earth], camera, renderer.domElement);
//controls.addEventListener("drag", function(event) {
//    event.object.position.set(mouseX,mouseY,event.object.position.y);
//    renderer.render(scene, camera);  
//})


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

const objLoader = new OBJLoader();

let teapot = objLoader.load("./models/teapot.obj", loadTeapotSun, onProgress, onError);


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
    scene.add(teapotOBJ);
}

let newPlanetSubmitButton = document.getElementById('new-planet-submit');
newPlanetSubmitButton.addEventListener("click", AddNewPlanet, false);

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

let showAxesCheckbox = document.getElementById('show-axes-helper');
showAxesCheckbox.addEventListener("click", SetShowAxes, false);

function SetShowAxes() {
    axesHelper.visible = showAxesCheckbox.checked;    
}

let shouldRotateCheckbox = document.getElementById('should-rotate');
shouldRotateCheckbox.addEventListener("click", SetShouldRotate, false);
function SetShouldRotate() {
    shouldRotate = shouldRotateCheckbox.checked;    
}

let shouldOrbitCheckbox = document.getElementById('should-orbit');
shouldOrbitCheckbox.addEventListener("click", SetShouldOrbit, false);
function SetShouldOrbit() {
    shouldOrbit = shouldOrbitCheckbox.checked;
}

let speedRangeDiv = document.getElementById('speed');
speedRangeDiv.addEventListener("input", SetSpeed, false);
function SetSpeed() {
    generalSpeed = speedRangeDiv.value;
}

let specialSunDiv = document.getElementById('special-sun');
specialSunDiv.addEventListener("click", ShowTeapot, false);
function ShowTeapot() {
    shouldUseSpecialSun = specialSunDiv.checked;
    teapot.visible = shouldUseSpecialSun;
    sun.visible = !shouldUseSpecialSun;
}

const bloom = {
    bloomStrength: 1,
    bloomThreshold: 0.3,
    bloomRadius: 0.4
};

document.getElementById('bloom-strength')
        .addEventListener("input", (event) => {bloomPass.strength = event.target.value;}, false);
document.getElementById('bloom-threshold')
        .addEventListener("input", (event) => {bloomPass.threshold = event.target.value;}, false);
document.getElementById('bloom-radius')
        .addEventListener("input", (event) => {bloomPass.radius = event.target.value;}, false);


const renderScene = new RenderPass( scene, CAMERA );

const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
bloomPass.threshold = bloom.bloomThreshold;
bloomPass.strength = bloom.bloomStrength;
bloomPass.radius = bloom.bloomRadius;

const composer = new EffectComposer( RENDERER );
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass( renderScene );
composer.addPass( bloomPass );

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

    // RENDERER.render(scene, CAMERA);


    composer.render(scene, CAMERA);
    requestAnimationFrame(render);
}
requestAnimationFrame(render);