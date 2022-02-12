import * as THREE from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/optimized/three.js";
import { DragControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/DragControls.js";
import { OrbitControls } from "https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/OrbitControls.js";
import { TrackballControls } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/controls/TrackballControls.js';
import { OBJLoader } from 'https://cdn.skypack.dev/pin/three@v0.137.5-HJEdoVYPhjkiJWkt6XIa/mode=imports,min/unoptimized/examples/jsm/loaders/OBJLoader.js';


const canvas = document.querySelector('#scene-canvas');
const renderer = new THREE.WebGLRenderer({canvas});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
let systemRadius = 0.0;


const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;

const scene = new THREE.Scene();
let objects = [];

const axesHelper = new THREE.AxesHelper( 5 );
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
objects.push(solarSystem);

// TODO: glowy sun: https://stackoverflow.com/a/50958608 
const sun = newSun(2, 0xffff00);
systemRadius = 2;
solarSystem.add(sun);
objects.push(sun);
sun.add(light);

const earth = newPlanet(1, 0x0000ff, 5);
systemRadius = 5 + 1;
solarSystem.add(earth);
objects.push(earth);

function newSun(radius, color) {
    const geometry = new THREE.SphereGeometry(radius);
    const material = new THREE.MeshLambertMaterial( { color: color, emissive:color, emissiveIntensity: lightIntensity} );
    const sphereElement = new THREE.Mesh( geometry, material );    
    return sphereElement;
}

function newPlanet(radius, color, positionX) {
    const geometry = new THREE.SphereGeometry(radius);
    const material = new THREE.MeshLambertMaterial( { color: color} );
    
    const sphereElement = new THREE.Mesh( geometry, material );    
    sphereElement.position.x = positionX;
    sphereElement.castShadow = true;
    sphereElement.receiveShadow = true; 
    return sphereElement;
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


// function onWindowResize( event ) {
// // https://stackoverflow.com/questions/47184264/threejs-calculating-fov-for-perspective-camera-after-browser-window-resize?rq=1
//     let oldHeight = camera.viewportHeight;
//     let oldWidth = camera.viewportWidth;
//     let newHeight = window.innerHeight;
//     let newWidth = window.innerWidth;
//     camera.viewportHeight = newHeight;
//     camera.viewportWidth = newWidth;
//     camera.aspectRatio = newWidth / newHeight;
//     let oldRadFOV = camera.vertFOV * Math.PI/180;
//     let newRadVertFOV = 2*Math.atan( Math.tan(oldRadFOV/2) * newHeight/oldHeight);
//     camera.vertFOV = newRadVertFOV * 180/Math.PI;

//     let radVertFOV = camera.vertFOV * Math.PI/180;
//     let radHorizFOV = 2 * Math.atan( Math.tan(radVertFOV/2) * camera.aspectRatio);
//     let horizFOV = radHorizFOV * 180/Math.PI;

//     camera.horizFOV = horizFOV;
//     camera.aspect = camera.aspectRatio;
//     camera.updateProjectionMatrix();
//     renderer.setSize( window.innerWidth, window.innerHeight );
    
// }

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

function render (time) {
    time *= 0.001 // time: miliseconds -> seconds
    
    if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }
    
    objects.forEach(obj => obj.rotation.z = time*0.3);

    renderer.render(scene, camera);
    requestAnimationFrame(render);

}
requestAnimationFrame(render);


let newPlanetSubmitButton = document.getElementById('new-planet-submit');
newPlanetSubmitButton.addEventListener("click", AddNewPlanet, false);

function AddNewPlanet(event) {
    let newPlanetRadius = parseInt(document.getElementById("new-planet-radius").value);
    let newPlanetColor = document.getElementById("new-planet-color").value;

    let planetPosition = systemRadius + 1.0 + newPlanetRadius;
    systemRadius = planetPosition + newPlanetRadius;

    let planet = newPlanet(newPlanetRadius, newPlanetColor, planetPosition);
    planet.position.set(planetPosition, 0, 0);
    
    // scene.add(planet);
    solarSystem.add(planet);
    objects.push(planet);
}