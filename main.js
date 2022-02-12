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

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;

const scene = new THREE.Scene();
let rotables = [];
let planets = [];
let orbits = [];

const axesHelper = new THREE.AxesHelper( 5 );
axesHelper.visible = false; // inicia escondido
scene.add( axesHelper );

// ambient light
var ambientLight = new THREE.AmbientLight ( 0xffffff, 0.5)
scene.add( ambientLight )

const lightIntensity = 1;
const light = newPointLight();

function newPointLight() {
    const light = new THREE.PointLight( 0xffffff, 1);
    light.power = 800*lightIntensity;
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
const sun = newSun(2, 0xffff00);
systemRadius = 2;
solarSystem.add(sun);
sun.add(light);

const earth = newPlanet(1, 0x0000ff, 5);
systemRadius = 5 + 1;
solarSystem.add(earth);

function newSun(radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    const material = new THREE.MeshLambertMaterial( { color: color, emissive:color, emissiveIntensity: lightIntensity} );
    const sun = new THREE.Mesh( geometry, material );    
    rotables.push(sun);
    return sun;
}

function newPlanet(radius, color, positionX) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    geometry.computeBoundingSphere();
    const material = new THREE.MeshLambertMaterial( { color: color} );
    
    const planet = new THREE.Mesh( geometry, material );    
    planet.position.x = positionX;
    planet.castShadow = true;
    planet.receiveShadow = true; 
    planets.push(planet);
    orbits.push(positionX);
    rotables.push(planet);
    scene.add(planet);
    return planet;
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

//window.addEventListener( 'resize', onWindowResize, false );


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
        rotables.forEach(rotatable => rotatable.rotation.z = rotationTime*0.2);
    }
    if (shouldOrbit) {
        orbitTime += 0.05 * generalSpeed;
        for ( var i = 0; i < planets.length; i++ ) {
            let speedFactor = 1 / (planets[i].geometry.boundingSphere.radius + orbits[i]);
            planets[i].position.x = Math.sin(speedFactor * orbitTime) * orbits[i];
            planets[i].position.y = Math.cos(speedFactor * orbitTime) * orbits[i];
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
    let newPlanetRadius = parseInt(document.getElementById("new-planet-radius").value);
    let newPlanetColor = document.getElementById("new-planet-color").value;

    let planetPosition = systemRadius + 1.0 + newPlanetRadius;
    systemRadius = planetPosition + newPlanetRadius;

    let planet = newPlanet(newPlanetRadius, newPlanetColor, planetPosition);
    planet.position.set(planetPosition, 0, 0);
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