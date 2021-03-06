import {vec2, vec3, vec4, mat4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import LSystem from './lsystem/LSystem';
import Plane from './geometry/Plane';
import CityGrid from './city/CityGrid';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
};

// Geometry
let square: Square;
let screenQuad: ScreenQuad;
let lSystem: LSystem;
let plane: Plane;
let cube: Cube; // TODO

// Road generation
let highwayT: mat4[] = [];
let roadT: mat4[] = [];
let prevIter: number = 100;
let prevRotation: number = 120;
let showPopDensity: boolean = false;
let showTerrainElevation: boolean = true;
let showTerrainBinary: boolean = false;

// City generation
let grid: CityGrid;
let gridWidth: number = 100;
let gridHeight: number = 100;

// Misc.
let time: number = 0.0;


function loadScene() {
  square = new Square();
  square.create();
  cube = new Cube(vec3.fromValues(0, 0, 0));
  cube.create();

  // Create terrain map
  screenQuad = new ScreenQuad();
  screenQuad.create();
  plane = new Plane(vec3.fromValues(0,0,0), vec2.fromValues(100,100), 20);
  plane.create();
}

function setTransformArrays(transforms: mat4[], col: vec4) {
  // Set up instanced rendering data arrays here.
  let colorsArray = [];
  let n: number = 100.0;
  let transform1Array = [];
  let transform2Array = [];
  let transform3Array = [];
  let transform4Array = [];

  for (let i = 0; i < transforms.length; i++) {
    let T = transforms[i];

    // Column 1
    transform1Array.push(T[0]);
    transform1Array.push(T[1]);
    transform1Array.push(T[2]);
    transform1Array.push(T[3]);

    // Column 2
    transform2Array.push(T[4]);
    transform2Array.push(T[5]);
    transform2Array.push(T[6]);
    transform2Array.push(T[7]);

    // Column 3
    transform3Array.push(T[8]);
    transform3Array.push(T[9]);
    transform3Array.push(T[10]);
    transform3Array.push(T[11]);

    // Column 4
    transform4Array.push(T[12]);
    transform4Array.push(T[13]);
    transform4Array.push(T[14]);
    transform4Array.push(T[15]);

    // Color (brown)
    colorsArray.push(col[0]);
    colorsArray.push(col[1]);
    colorsArray.push(col[2]);
    colorsArray.push(col[3]);
  }

  let colors: Float32Array = new Float32Array(colorsArray);
  let transform1: Float32Array = new Float32Array(transform1Array);
  let transform2: Float32Array = new Float32Array(transform2Array);
  let transform3: Float32Array = new Float32Array(transform3Array);
  let transform4: Float32Array = new Float32Array(transform4Array);

  square.setInstanceVBOs(colors, transform1, transform2, transform3, transform4);
  square.setNumInstances(transforms.length);
}

function setUpGrid() {
  grid = new CityGrid(gridWidth, gridHeight);
  grid.rasterize();
  grid.generateValidPoints(); // TODO: let player modify number of buildings
  let gridVBOData: any = grid.setGridVBO();
  let buildingVBOData: any = grid.setBuildingVBO();

  // let transform1Array: number[] = [];
  // let transform2Array: number[] = [];
  // let transform3Array: number[] = [];
  // let transform4Array: number[] = [];
  // let colorsArray: number[] = [];

  // for (let i = 0; i < gridWidth; i++) {
  //   for (let j = 0; j < gridHeight; j++) {
  //     if (gridVBOData[i][j]) {
  //       transform1Array.push(1);
  //       transform1Array.push(0);
  //       transform1Array.push(0);
  //       transform1Array.push(0);

  //       transform2Array.push(0);
  //       transform2Array.push(1);
  //       transform2Array.push(0);
  //       transform2Array.push(0);

  //       transform3Array.push(0);
  //       transform3Array.push(0);
  //       transform3Array.push(1);
  //       transform3Array.push(0);

  //       transform4Array.push(i);
  //       transform4Array.push(0);
  //       transform4Array.push(j);
  //       transform4Array.push(1);

  //       colorsArray.push(1);
  //       colorsArray.push(0);
  //       colorsArray.push(0);
  //       colorsArray.push(1);
  //     }
  //   }
  // }

  let colorsSquare: Float32Array = gridVBOData.colorsArray;
  let transform1Square: Float32Array = gridVBOData.transform1Array;
  let transform2Square: Float32Array = gridVBOData.transform2Array;
  let transform3Square: Float32Array = gridVBOData.transform3Array;
  let transform4Square: Float32Array = gridVBOData.transform4Array;

  square.setInstanceVBOs(colorsSquare, transform1Square, transform2Square, 
    transform3Square, transform4Square);
  square.setNumInstances(transform1Square.length / 4.0);
  console.log('Set up rasterization VBOs');

  let colorsCube: Float32Array = buildingVBOData.colorsArray;
  let transform1Cube: Float32Array = buildingVBOData.transform1Array;
  let transform2Cube: Float32Array = buildingVBOData.transform2Array;
  let transform3Cube: Float32Array = buildingVBOData.transform3Array;
  let transform4Cube: Float32Array = buildingVBOData.transform4Array;
  console.log('transform1cube.length = ' + transform1Cube.length);
  cube.setInstanceVBOs(colorsCube, transform1Cube, transform2Cube, transform3Cube, transform4Cube);
  cube.setNumInstances(transform1Cube.length / 4.0);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  // Set up camera and shaders
  const camera = new Camera(vec3.fromValues(10, 10, 10), vec3.fromValues(0, -2, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flatShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  const buildingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/building-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/building-frag.glsl')),
  ]);

  const terrain3DShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ])

  // Set the plane pos
  terrain3DShader.setPlanePos(vec2.fromValues(0, -100));

  // *** Render pass to fill our texture ***
  const textureShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/terrain-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/terrain-frag.glsl')),
  ]);

  const texturecanvas = canvas;
  const textureRenderer = new OpenGLRenderer(texturecanvas);
  if (textureRenderer == null) {
    console.log('texture renderer null');
  }

  // Resolution for the L-system
  const width = window.innerWidth;
  const height = window.innerHeight;

  textureRenderer.setSize(width, height);
  textureRenderer.setClearColor(0, 0, 0, 1);
  let textureData: Uint8Array = textureRenderer.renderTexture(camera, textureShader, [plane]);

  // Set up city generation
  setUpGrid();


  // *** TICK FUNCTION *** This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flatShader.setTime(time++);
    terrain3DShader.setTime(time++);
    buildingShader.setTime(time++);
    buildingShader.setEyeRefUp(camera.position, camera.target, camera.up);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    // Render 
    renderer.render(camera, flatShader, [screenQuad]); // Sky
    renderer.render(camera, terrain3DShader, [plane]); // Ground
    renderer.render(camera, instancedShader, [square]); // Roads
    renderer.render(camera, buildingShader, [cube]); // Buildings

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flatShader.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flatShader.setDimensions(window.innerWidth, window.innerHeight);

  
  // Start the render loop
  tick();
}

main();
