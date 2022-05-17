"use strict"; // good practice - see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
/*global THREE, Coordinates, $, document, window, dat*/

var camera, scene, renderer;
var cameraControls, effectController;
var clock = new THREE.Clock();
var gridX = false;
var gridY = false;
var gridZ = false;
var axes = false;
var ground = true;

/** measures const */
var tableTopWidthX;
var tableTopWidthZ;
var tableTopHeight;

/** letters part */
var letter1;
var letter2;

var skybox;
var skyboxGeo;

var lightCandle;
var dirLight1;
var dirLight2;
var ambientLight;

var phongBalancedMaterial;
var candleMaterial;
var candle;

function init() {
	var canvasWidth = window.innerWidth - window.innerWidth / 90;
	var canvasHeight = window.innerHeight - window.innerHeight / 5;
	// For grading the window is fixed in size; here's general code:
	//var canvasWidth = window.innerWidth;
	//var canvasHeight = window.innerHeight;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );
	renderer.autoClear = false;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap; 

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 40000 );
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);

	camera.position.set( -2000, 500, 0 );
	cameraControls.target.set(4,301,92);

	fillScene();
}

function setMaterial(obj, material) {
	obj.traverse(function(obj) {
		  obj.material = material;
	});
}

function loadShader(shadertype) {
	return document.getElementById(shadertype).textContent;
}

function createShaderMaterial(id, light, ambientLight) {

	var shaderTypes = {

		'phongBalanced' : {

			uniforms: {

				"uDirLightPos":	{ type: "v3", value: new THREE.Vector3() },
				"uDirLightColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },

				"uAmbientLightColor": { type: "c", value: new THREE.Color( 0x050505 ) },

				"uMaterialColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },
				"uSpecularColor": { type: "c", value: new THREE.Color( 0xFFFFFF ) },

				uKd: {
					type: "f",
					value: 0.7
				},
				uKs: {
					type: "f",
					value: 0.3
				},
				shininess: {
					type: "f",
					value: 100.0
				},
				uGroove: {
					type: "f",
					value: 1.0
				}
			}
		}

	};

	var shader = shaderTypes[id];

	var u = THREE.UniformsUtils.clone(shader.uniforms);

	// this line will load a shader that has an id of "vertex" from the .html file
	var vs = loadShader("vertex");
	// this line will load a shader that has an id of "fragment" from the .html file
	var fs = loadShader("fragment");

	var material = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vs, fragmentShader: fs });

	material.uniforms.uDirLightPos.value = light.position;
	material.uniforms.uDirLightColor.value = light.color;

	material.uniforms.uAmbientLightColor.value = ambientLight.color;

	return material;

}

function fillScene() {
	// SCENE
	scene = new THREE.Scene();
	// scene.fog = new THREE.Fog( 0x808080, 3000, 6000 );
	
	//SKYBOX
	const skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);

	const skybox = new THREE.Mesh(skyboxGeo,
							new THREE.MeshBasicMaterial( { color: 0x00000, side: THREE.BackSide }));
	
	scene.add(skybox);

	// LIGHTS
	var light = new THREE.PointLight( 0xFFA500, 1, 500, 2 );
	light.castShadow = true;
	lightCandle = light;
	light.position.set( -60, 430, -150 );

	// var spheresize = 10;
	// var pointLightHelper = new THREE.PointLightHelper( light, spheresize );
	// scene.add( pointLightHelper );

	scene.add( light );

	light.shadow.mapSize.width = 512; // default
	light.shadow.mapSize.height = 512; // default
	light.shadow.camera.near = 0.5; // default
	light.shadow.camera.far = 500; // default

	ambientLight = new THREE.AmbientLight( 0x222222 );
	ambientLight.intensity = 0.0;

	dirLight1 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	dirLight1.position.set( 200, 400, 500 );
	dirLight1.intensity = 0.0;

	dirLight2 = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
	dirLight2.position.set( -400, 200, -300 );
	dirLight2.intensity = 0.0;

	scene.add(ambientLight);
	scene.add(dirLight1);
	scene.add(dirLight2);

	var materialColor = new THREE.Color();
	materialColor.setRGB(1.0, 0.8, 0.6);

	phongBalancedMaterial = createShaderMaterial("phongBalanced", lightCandle, ambientLight);
	phongBalancedMaterial.uniforms.uMaterialColor.value.copy(materialColor);
	phongBalancedMaterial.side = THREE.DoubleSide;

	if (ground) {
		Coordinates.drawGround({size:1000});
	}
	if (gridX) {
		Coordinates.drawGrid({size:1000,scale:0.01});
	}
	if (gridY) {
		Coordinates.drawGrid({size:1000,scale:0.01, orientation:"y"});
	}
	if (gridZ) {
		Coordinates.drawGrid({size:1000,scale:0.01, orientation:"z"});
	}
	if (axes) {
		Coordinates.drawAllAxes({axisLength:300,axisRadius:2,axisTess:50});
	}

	createTable();
	createLetter();
	candle = createCandle(new THREE.MeshPhongMaterial( {color: 0x915136, shininess: 100, side: THREE.DoubleSide} ));
}
//
function addToDOM() {
	var container = document.getElementById('webGL');

	container.appendChild( renderer.domElement );
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	if ( effectController.newGridX !== gridX || effectController.newGridY !== gridY || effectController.newGridZ !== gridZ || effectController.newGround !== ground || effectController.newAxes !== axes)
	{
		gridX = effectController.newGridX;
		gridY = effectController.newGridY;
		gridZ = effectController.newGridZ;
		ground = effectController.newGround;
		axes = effectController.newAxes;

		fillScene();
	}

	letter1.rotation.z = THREE.Math.degToRad(effectController.lz);
	letter2.rotation.z = THREE.Math.degToRad(effectController.lz2);

	if (!effectController.enableLighting) {
		lightCandle.intensity = 0.0;
		dirLight1.intensity = 1.0;
		dirLight2.intensity = 1.0;
		ambientLight.intensity = 1.0;
	} else {
		lightCandle.intensity = 1.0;
		dirLight1.intensity = 0.0;
		dirLight2.intensity = 0.0;
		ambientLight.intensity = 0.0;
	}

	if (lightCandle != null && effectController.enableLighting) {
		lightCandle.distance = effectController.lightDistance;
		lightCandle.intensity = effectController.lightIntensity;
		lightCandle.castShadow = effectController.enableShadow;
	}

	if (effectController.controlAmbientLight) 
		ambientLight.intensity = effectController.ambientLightIntensity;

	if (!effectController.enableShader) 
		setMaterial(candle, new THREE.MeshPhongMaterial( {color: 0x915136, shininess: 100, side: THREE.DoubleSide} ));
	else setMaterial(candle, phongBalancedMaterial);

	renderer.render(scene, camera);
}

function createLetter() {
	letter1 = new THREE.Object3D();
	var letter = new THREE.Object3D();
	letter2 = new THREE.Object3D();

	var geometry = new THREE.BoxGeometry(100, 100, 5);
	var material = new THREE.MeshLambertMaterial( {color: 0xFFFFFF} );

	createLetter2(letter2, geometry, material );

	createLetter1(letter1, geometry, material );

	letter1.add(letter2);

	createLetterCrane(letter, geometry, material );

	letter.add(letter1);


	scene.add(letter);
	
}

function createLetterCrane( part, geometry, material) 
{
	var plane = new THREE.Mesh( geometry, material );

	plane.rotation.x = Math.PI/2;
	plane.rotation.z = Math.PI/4;
	plane.position.y = tableTopHeight + 20;
	plane.position.x = 100;

	plane.castShadow = true;

	part.add(plane);
}

function createLetter1( part, geometry, material ) {
	var plane = new THREE.Mesh( geometry, material );

	plane.rotation.x = Math.PI/2;
	plane.rotation.z = Math.PI/4;
	plane.position.y = tableTopHeight + 20;
	plane.position.x = 100;

	plane.rotateX(50);
	plane.position.y += 15;

	plane.castShadow = true;

	part.add(plane);
}

function createLetter2( part, geometry, material ) {
	var plane = new THREE.Mesh( geometry, material );

	plane.rotation.x = Math.PI/2;
	plane.rotation.z = Math.PI/4;
	plane.position.y = tableTopHeight + 20;
	plane.position.x = 100;

	plane.rotateX(50);
	plane.position.y += 15;

	plane.scale.y = 0.5;

	plane.position.z = 50;
	plane.position.x = 50;
	plane.position.y = plane.position.y + 5;

	plane.rotateX(-100);

	plane.castShadow = true;

	part.add(plane);
}

function createTable() 
{
	var table = new THREE.Object3D();

	var geometry = new THREE.BoxGeometry(700, 700, 30);
	var material = new THREE.MeshLambertMaterial( {color: 0x582900} );
	var cube = new THREE.Mesh( geometry, material );

	tableTopWidthX = -200;
	tableTopWidthZ = 300;
	tableTopHeight = 250;

	cube.rotation.x = Math.PI/2;
	cube.position.y = 0;
	cube.scale.x = 1.4;
	cube.scale.y = 1.4;
	cube.receiveShadow = true;

	table.add(cube);

	var tableTop = cube.clone(false);
	tableTop.position.y = 25;
	tableTop.scale.x = 1.5;
	tableTop.scale.z = 0.5;
	tableTop.scale.y = 1.5;
	tableTop.receiveShadow = true;

	table.add(tableTop);

	table.position.y = tableTopHeight;

	table.scale.x = 0.5;
	table.scale.y = 0.5;
	table.scale.z = 0.5;
	table.receiveShadow = true;

	scene.add(table);

	var cylGeometry = new THREE.CylinderGeometry(20, 20, 250, 32);
	var cyl = new THREE.Mesh( cylGeometry, material );

	cyl.position.y = 130;
	cyl.position.x = 200;
	cyl.position.z = 180;

	scene.add(cyl);

	var cyl = cyl.clone();
	cyl.position.z = -180;

	scene.add(cyl);

	var cyl = cyl.clone();
	cyl.position.x = -200;
	cyl.position.z = 180;

	scene.add(cyl);

	var cyl = cyl.clone();
	cyl.position.z = -180;

	scene.add(cyl);

}

function createCandle(material) {

	//3dObj
	var candle = new THREE.Object3D();

	// disque
	var geometry = new THREE.CircleGeometry( 75, 100 );
	var circle = new THREE.Mesh( geometry, material );
	circle.position.y = 20;
	circle.rotation.x = -Math.PI/2;
	circle.castShadow = true;
	circle.receiveShadow = true;
	candle.add(circle);

	// Lathe
	var points = [];
	for ( let i = 0; i < 10; i ++ ) {
		points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 10 + 5, ( i - 5 ) * 2 ) );
	}
	var latheGeometry = new THREE.LatheGeometry( points );
	var lathe = new THREE.Mesh( latheGeometry, material );

	lathe.position.y = 50;

	lathe.rotation.x = Math.PI;

	lathe.scale.x = 3;
	lathe.scale.y = 3;
	lathe.scale.z = 3;
	lathe.castShadow = true;
	lathe.receiveShadow = true;
	candle.add( lathe );

	var geometry = new THREE.CylinderGeometry( 10, 16, 6, 64, 64 );
	var cylinder = new THREE.Mesh( geometry, material );

	cylinder.position.y = 30;

	cylinder.scale.x = 4;
	cylinder.scale.y = 4;
	cylinder.scale.z = 4;
	cylinder.castShadow = true;
	cylinder.receiveShadow = true;

	candle.add(cylinder)

	var geometry = new THREE.ConeGeometry( 25, 10, 30, 52, true );
	var cone = new THREE.Mesh( geometry, material );

	cone.position.y = 80;

	cone.rotation.x = Math.PI;

	cone.scale.x = 2.5;
	cone.scale.y = 2.5;
	cone.scale.z = 2.5;
	cone.castShadow = true;

	candle.add( cone );

	lathe = new THREE.Mesh( latheGeometry, material );

	lathe.position.y = 90;

	lathe.rotation.x = Math.PI;

	lathe.scale.x = 1.5;
	lathe.scale.y = 1.5;
	lathe.scale.z = 1.5;
	lathe.castShadow = true;
	candle.add( lathe );

	geometry = new THREE.CylinderGeometry( 7, 7, 30, 20);
	cylinder = new THREE.Mesh( geometry, material );

	cylinder.position.y = 100;
	cylinder.castShadow = true;

	candle.add(cylinder);

	geometry = new THREE.RingGeometry( 5, 12, 10 );
	var ring = new THREE.Mesh( geometry, material );

	ring.position.y = 110;
	ring.rotation.x = Math.PI/2;

	candle.add(ring);

	geometry = new THREE.CylinderGeometry( 17, 6, 34, 64, 64 );
	cylinder = new THREE.Mesh( geometry, material );

	cylinder.position.y = 130;

	candle.add(cylinder);

	geometry = new THREE.TorusGeometry( 20, 3, 16, 100 );
	var torus = new THREE.Mesh( geometry, material );
	torus.position.y = 148;
	torus.rotation.x = 55;
	torus.castShadow = true;
	candle.add( torus );

	geometry = new THREE.CylinderGeometry( 15, 15, 18, 12, 12 );
	cylinder = new THREE.Mesh( geometry, material );

	cylinder.position.y = 155;

	candle.add(cylinder);

	geometry = new THREE.TorusGeometry( 13, 3, 16, 100 );
	var torus = new THREE.Mesh( geometry, material );
	torus.position.y = 163;
	torus.rotation.x = 55;
	candle.add( torus );

	candle.position.y += tableTopHeight;
	candle.position.z -= tableTopWidthZ - 150;
	candle.position.x -= 60;

	var cireMaterial = new THREE.MeshLambertMaterial( { color: 0xFFF0bc } );
	geometry = new THREE.CylinderGeometry( 12, 12, 8, 12, 12 );
	cylinder = new THREE.Mesh( geometry, cireMaterial );

	cylinder.position.y = 165;

	candle.add(cylinder);

	geometry = new THREE.CylinderGeometry( 2, 2, 10, 12, 12 );
	cylinder = new THREE.Mesh( geometry, 
							   new THREE.MeshBasicMaterial( {color: 0x00000} ) );

	cylinder.position.y = 170;

	candle.add(cylinder);

	candle.castShadow = true;

	scene.add(candle);

	return candle;
}

function importObj() {
	var loader = new THREE.OBJLoader();
	// console.log("testObj");

	// Charger le fichier
	loader.load(
		'res/obj/skull.obj',
		function ( object ) {

			var material = new THREE.MeshLambertMaterial( { color: 0x582900 } );

			object.rotation.x = -Math.PI/2;
			object.rotation.z = Math.PI/4;

			object.position.x = tableTopWidthX + 100;
			object.position.y = tableTopHeight + 75;
			object.position.z = tableTopWidthZ - 150;

			object.material = material;

			object.traverse( function ( child ) {

				if ( child instanceof THREE.Mesh ) {
					child.castShadow = true;
				}
			
			} );

			scene.add( object );
		}
	);

}

function animate() {
	window.requestAnimationFrame(animate);
	importObj();
	render()
}

function setupGui() {

	effectController = {

		newGridX: gridX,
		newGridY: gridY,
		newGridZ: gridZ,
		newGround: ground,
		newAxes: axes,

		enableShadow: true,
		enableLighting: true,

		lightDistance: 500,
		lightIntensity: 1,

		controlAmbientLight: false,
		ambientLightIntensity: 1.0,

		enableShader: false,

		lz: 0,
		lz2: 0
	};

	var gui = new dat.GUI({ autoPlace: false });
	var customContainer = document.getElementById('gui-container');
	customContainer.appendChild(gui.domElement);

	var h = gui.addFolder("Grid display")
	h.add(effectController, "newGridX").name("Show XZ grid");
	h.add( effectController, "newGridY" ).name("Show YZ grid");
	h.add( effectController, "newGridZ" ).name("Show XY grid");
	h.add( effectController, "newGround" ).name("Show ground");
	h.add( effectController, "newAxes" ).name("Show axes");

	h = gui.addFolder("Letter angles")
	h.add(effectController, "lz", -180.0, 180.0, 0.025).name("Letter z");
	h.add(effectController, "lz2", -180.0, 180.0, 0.025).name("Letter2 z");

	h = gui.addFolder("Light lamp")
	h.add(effectController, "lightDistance", 0.0, 1000.0, 0.025).name("Light distance");
	h.add(effectController, "lightIntensity", 0.0, 100.0, 0.025).name("Light intensity");

	h = gui.addFolder("Global lighting")
	h.add(effectController, "enableShadow").name("Enable shadow");
	h.add(effectController, "enableLighting").name("Enable lighting");	
	h.add(effectController, "controlAmbientLight").name("Control Ambient Lighting");
	h.add(effectController, "ambientLightIntensity", 0.0, 1.0, 0.000025).name("Ambient Light intensity");

	h = gui.addFolder("Shader")
	h.add(effectController, "enableShader").name("Enable shader");
}

try {
	init();
	setupGui();
	addToDOM();
	animate();
} catch(e) {
	var errorReport = "Your program encountered an unrecoverable error, can not draw on canvas. Error was:<br/><br/>";
	//$('#container').append(errorReport+e);
}
