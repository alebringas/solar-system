import * as THREE from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/optimized/three.js";
import { DragControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/DragControls.js";
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/TrackballControls.js';
import { OBJLoader } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/loaders/OBJLoader.js';

let orbitTime = 0;
let rotationTime = 0;
const canvas = document.querySelector('#scene-canvas');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
let systemRadius = 0.0;
let shouldRotate = true;
let shouldOrbit = true;
let generalSpeed = 1;

const textureLoader = new THREE.TextureLoader();

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;

const scene = new THREE.Scene();
let planets = [];
let orbits = [];

const SUN_RADIUS = 5;

const axesHelper = new THREE.AxesHelper( SUN_RADIUS + 3 );
axesHelper.visible = false; // inicia escondido
scene.add( axesHelper );

// ambient light
var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5)
scene.add( ambientLight )

const lightIntensity = 0.4;
const light = newPointLight();

function newPointLight() {
    const light = new THREE.PointLight( 0xffffff, 1);
    light.power = 200 * lightIntensity; // 800 l
    light.castShadow = true; 

    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    return light;
}

// control de camara
// *** Orbit
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0, 0);
controls.update();

// *** Trackball
// const controls = new TrackballControls( camera, canvas );
// controls.rotateSpeed = 1.0;
// controls.zoomSpeed = 1.2;
// controls.panSpeed = 0.8;
// controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];

const solarSystem = new THREE.Object3D();
scene.add(solarSystem);

// TODO: glowy sun: https://stackoverflow.com/a/50958608 
const sun = newSun(SUN_RADIUS);
systemRadius = sun.geometry.boundingSphere.radius;
solarSystem.add(sun);
sun.add(light);

let earthRadius = 2;
const earth = newPlanet(1, 0x0000ff, systemRadius + earthRadius + 1);
solarSystem.add(earth);

function newSun(radius) {
    let texture = textureLoader.load("sun.png");
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    geometry.computeBoundingSphere();
    const material = new THREE.MeshLambertMaterial( { 
        emissive: 0xFFFFFF, 
        emissiveIntensity: lightIntensity*2,
        emissiveMap: texture,
        map: texture,
        combine: THREE.AddOperation
    } );
    const sun = new THREE.Mesh( geometry, material );  
    return sun;
}

function newPlanet(radius, color, orbitRadius, texture) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    geometry.computeBoundingSphere();
    const material = new THREE.MeshLambertMaterial( { color: color } );
        
    if (texture) {
        material.map = texture;
        material.combine = THREE.AddOperation;
    }
    
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

function render () {
    
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    
    if (shouldRotate) {
        rotationTime += 0.1 * generalSpeed;
        sun.rotation.z = rotationTime*0.05;
        planets.forEach(planet => planet.rotation.z = rotationTime*0.2);
    }
    if (shouldOrbit) {
        orbitTime += 0.05 * generalSpeed;
        for ( var i = 0; i < planets.length; i++ ) {
            putIntoOrbit(planets[i], planets[i].geometry.boundingSphere.radius, orbits[i]);
        }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);

}
requestAnimationFrame(render);


// let modelLoadDiv = document.getElementById('obj');
// modelLoadDiv.addEventListener("change", LoadObj, false );

// const objLoader = new OBJLoader();

// function LoadObj( event ) {
    
//     if ( modelLoadDiv.files && modelLoadDiv.files[0] ) {
//         objLoader.load(
//             modelLoadDiv.files[0].name,
//             // called when object is loaded
//             function (object) {
//                 object.position.x = 6;
//                 object.scale.set(0.5, 0.5, 0.5);
//                 solarSystem.add(object);
//             },
//             // called when loading is in progress
//             function ( xhr ) {
//                 console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
//             },
//             // called when loading has errors
//             function ( error ) {
//                 console.log( 'An error happened' );
//             }
//         );
//     }
// }


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