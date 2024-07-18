import * as THREE from "three";
import gsap from "gsap";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* SECTION - Scene Setup */

/* Canvas */
const canvas = document.querySelector("canvas.webgl");

/* Scene */
const scene = new THREE.Scene();

/* Sizes */
const sizes = {
	width: window.innerWidth,
	height: window.innerHeight,
};

window.addEventListener("resize", () => {
	// Update sizes
	sizes.width = window.innerWidth;
	sizes.height = window.innerHeight;

	// Update camera
	camera.aspect = sizes.width / sizes.height; // for Perspective camera
	camera.updateProjectionMatrix();

	// Update renderer
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("dblclick", () => {
	if (!document.fullscreenElement) {
		console.log("go full");
		renderer.domElement.requestFullscreen();
	} else {
		console.log("leave full");
		document.exitFullscreen();
	}
});

/* ANCHOR Lights */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-5, 10, 10);
scene.add(directionalLight);

/* ANCHOR Camera */
const camera = new THREE.PerspectiveCamera(
	75,
	sizes.width / sizes.height,
	0.1,
	100
);
camera.position.x = 0;
camera.position.y = 3.5;
camera.position.z = 5;
// camera.lookAt(0, 0, 0);
scene.add(camera);

/* ANCHOR Renderer */
const renderer = new THREE.WebGLRenderer({
	canvas: canvas,
	// alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

/*!SECTION */

/* SECTION - Objects */
const textureLoader = new THREE.TextureLoader();

/* ANCHOR: Background */
const backgroundTexture = textureLoader.load("images/pixel-beach-darker.jpg");
backgroundTexture.colorSpace = THREE.SRGBColorSpace;

const backgroundGeometry = new THREE.PlaneGeometry(16, 9);
const backgroundMaterial = new THREE.MeshBasicMaterial({
	map: backgroundTexture,
	// side: THREE.DoubleSide,
	// transparent: true,
});

const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
backgroundMesh.position.z = -1; // Position the background behind the scene
backgroundMesh.position.y = 3.5;

scene.add(backgroundMesh);

/* ANCHOR: People */
let people = [];
let peopleCount = 10;

const runningPersonTexture = textureLoader.load("images/running.png");
runningPersonTexture.colorSpace = THREE.SRGBColorSpace;
const electrocutedPersonTexture = textureLoader.load("images/electrocuted.png");
electrocutedPersonTexture.colorSpace = THREE.SRGBColorSpace;

for (let i = 0; i < peopleCount; i++) {
	const planeGeometry = new THREE.PlaneGeometry(3, 4);
	const planeMaterial = new THREE.MeshBasicMaterial({
		map: runningPersonTexture,
		// color: 0x00ff00,
		side: THREE.DoubleSide,
		transparent: true,
	});
	const person = new THREE.Mesh(planeGeometry, planeMaterial);
	person.position.x = -5;
	person.position.y = 0.5;
	person.position.z = -i * 0.02;
	person.scale.set(0.3, 0.3, 1);
	people.push(person);
	scene.add(person);
}

/* ANCHOR: Clouds */
let clouds = [];
let cloudConfig = [
	{
		width: 3,
		x: -3.5,
		color: 0x00ff00,
		image: "images/cloud-1.png",
	},
	{
		width: 2,
		x: -0.75,
		color: 0xff0000,
		image: "images/cloud-2.png",
	},
	{
		width: 5,
		x: 3,
		color: 0x0000ff,
		image: "images/cloud-3.png",
	},
];

for (let i = 0; i < cloudConfig.length; i++) {
	const config = cloudConfig[i];
	const planeGeometry = new THREE.PlaneGeometry(config.width, 1.5);
	const cloudTexture = textureLoader.load(config.image);
	cloudTexture.colorSpace = THREE.SRGBColorSpace;
	const planeMaterial = new THREE.MeshBasicMaterial({
		map: cloudTexture,
		// color: config.color,
		side: THREE.DoubleSide,
		transparent: true,
	});
	const cloud = new THREE.Mesh(planeGeometry, planeMaterial);
	cloud.position.x = config.x;
	cloud.position.y = 6.25;
	cloud.position.z = 0.1;
	cloud.userData.ready = true;
	clouds.push(cloud);
	scene.add(cloud);
}

/* ANCHOR Audio */
let listener;
let thunderSounds = [];
document.getElementById("startButton").addEventListener("click", (event) => {
	document.getElementById("startScreen").remove();
	// create an AudioListener and add it to the camera
	listener = new THREE.AudioListener();
	camera.add(listener);
	const audioLoader = new THREE.AudioLoader();
	audioLoader.load("sounds/ambience.mp3", (buffer) => {
		console.log("Ambience sound loaded");
		const ambienceSound = new THREE.Audio(listener);
		ambienceSound.setBuffer(buffer);
		ambienceSound.setVolume(0.5);
		ambienceSound.play();
	});
	for (let i = 1; i <= 5; i++) {
		audioLoader.load(`sounds/thunder-${i}.mp3`, (buffer) => {
			console.log(`Thunder sound ${i} loaded`);
			const thunderSound = new THREE.Audio(listener);
			thunderSound.setBuffer(buffer);
			thunderSound.setVolume(0.5);
			thunderSounds.push(thunderSound);
		});
	}
});

/*!SECTION */

window.addEventListener("click", (event) => {
	/* Calculate the mouse position in normalized device coordinates */
	const mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	/* Create a raycaster and set it from the camera and mouse position */
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);

	/* Check if the ray intersects any cloud */
	const cloudIntersections = raycaster.intersectObjects(clouds);
	let thunderStartPoint = new THREE.Vector3(0, 0, 0);
	if (cloudIntersections.length > 0) {
		console.log("A cloud was intersected:", cloudIntersections[0].object);
		const intersectedCloud = cloudIntersections[0].object;
		if (intersectedCloud.userData.ready) {
			const cloudWidth = intersectedCloud.geometry.parameters.width;
			const randomX =
				intersectedCloud.position.x + (Math.random() - 0.5) * cloudWidth;
			thunderStartPoint.set(randomX, intersectedCloud.position.y, 0);

			intersectedCloud.material.opacity = 0.4;
			intersectedCloud.material.needsUpdate = true;
			intersectedCloud.userData.ready = false;

			if (thunderSounds.length > 0) {
				thunderSounds[Math.floor(Math.random() * thunderSounds.length)].play();
			}

			gsap.to(intersectedCloud.material, {
				opacity: 0.7,
				duration: 4,
				ease: "power1.inOut",
				onUpdate: () => {
					intersectedCloud.material.needsUpdate = true;
				},
				onComplete: () => {
					intersectedCloud.material.opacity = 1;
					intersectedCloud.material.needsUpdate = true;
					intersectedCloud.userData.ready = true;
				},
			});
		}
	} else {
		console.log("No cloud was intersected.");
	}

	const raycaster2 = new THREE.Raycaster();

	const points = [];
	let currentPoint = thunderStartPoint.clone();

	points.push(currentPoint.clone());
	let thunderStrike = [];

	while (currentPoint.y > 0 && thunderStrike.length == 0) {
		currentPoint = currentPoint.clone();

		/* Move the current point in a random direction */
		currentPoint.x = currentPoint.x + Math.random() * 0.5 - 0.25;
		currentPoint.y = currentPoint.y - Math.random() * 0.25;

		points.push(currentPoint.clone());

		raycaster2.set(
			currentPoint,
			new THREE.Vector3(currentPoint.x, currentPoint.y, -1)
		);
		thunderStrike = raycaster2.intersectObjects(people);
		console.log(thunderStrike);
	}

	const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
	const lineMaterial = new THREE.LineBasicMaterial({
		color: 0xffffff,
		transparent: true,
	});

	const thunderLine = new THREE.Line(lineGeometry, lineMaterial);
	scene.add(thunderLine);

	if (thunderStrike.length > 0) {
		console.log("The thunderLine intersects the person.");
		thunderStrike.forEach((strike) => {
			let person = strike.object;
			person.material.map = electrocutedPersonTexture;
			person.material.needsUpdate = true;
			gsap.killTweensOf(person.position);
		});
	} else {
		console.log("The thunderLine does not intersect the person.");
	}

	gsap.to(thunderLine.material, {
		opacity: 0,
		duration: 4,
		ease: "power1.inOut",
		onUpdate: () => {
			// thunderLine.material.transparent = true;
			thunderLine.material.needsUpdate = true;
		},
		onComplete: () => {
			scene.remove(thunderLine);
		},
	});
});

function animatePerson(person, targetX) {
	gsap.to(person.position, {
		x: targetX,
		duration: Math.random() * 3 + 2,
		ease: "power1.inOut",
		onComplete: () => {
			const randomTargetX = Math.random() * 10 - 5;
			if (randomTargetX < targetX) {
				person.scale.x = -1 * Math.abs(person.scale.x);
			} else {
				person.scale.x = Math.abs(person.scale.x);
			}
			animatePerson(person, randomTargetX);
		},
	});
}

people.forEach((person) => {
	animatePerson(person, 5);
});

/* SECTION - Render */
const clock = new THREE.Clock();

const tick = (t) => {
	const elapsedTime = clock.getElapsedTime();

	// Update controls
	// controls.update();

	// Render
	renderer.render(scene, camera);

	// Call tick again on the next frame
	window.requestAnimationFrame(tick);
};

tick();
