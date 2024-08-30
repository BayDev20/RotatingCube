const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

// Set up WebGL configuration
gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear color to black and fully opaque
gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
gl.enable(gl.DEPTH_TEST); // Enable depth testing
gl.depthFunc(gl.LEQUAL); // Set the depth function to LESS THAN OR EQUAL
gl.disable(gl.BLEND); // Disable blending

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying lowp vec4 vColor;

    void main(void) {
        vColor = aVertexColor;
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram));
}

const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
};

// Grid data
function initGridBuffers(gl) {
    const gridPositions = [];
    const gridSize = 10;
    const gridStep = 0.5;

    for (let i = -gridSize; i <= gridSize; i++) {
        gridPositions.push(-gridSize, i * gridStep, 0, gridSize, i * gridStep, 0);
        gridPositions.push(i * gridStep, -gridSize, 0, i * gridStep, gridSize, 0);
    }

    const gridColors = Array(gridPositions.length / 3).fill([0.5, 0.5, 0.5, 1.0]).flat();

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridPositions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridColors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        vertexCount: gridPositions.length / 3,
    };
}

const gridBuffers = initGridBuffers(gl);

// Cube data
function initCubeBuffers(gl) {
    const positions = [
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
    ];

    const faceColors = [
        [1.0, 1.0, 1.0, 1.0],
        [1.0, 0.0, 0.0, 1.0],
        [0.0, 1.0, 0.0, 1.0],
        [0.0, 0.0, 1.0, 1.0],
        [1.0, 1.0, 0.0, 1.0],
        [1.0, 0.0, 1.0, 1.0],
    ];

    let colors = [];

    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const indices = [
        0, 1, 2, 0, 2, 3,
        4, 5, 6, 4, 6, 7,
        3, 2, 6, 3, 6, 7,
        4, 5, 1, 4, 1, 0,
        1, 5, 6, 1, 6, 2,
        4, 0, 3, 4, 3, 7,
    ];

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
        vertexCount: indices.length,
    };
}

const cubeBuffers = initCubeBuffers(gl);

let cubeRotation = 0.0;
let zoomScale = 1.0;
let scaleX = 1.0;
let scaleY = 1.0;
let scaleZ = 1.0;
let rotationEnabled = true;
let rotationDirection = 1; // 1 for clockwise, -1 for counter-clockwise
let rotationAxis = [0, 1, 0]; // Default rotation around Y axis

function drawScene(gl, programInfo, gridBuffers, cubeBuffers) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -10.0]);
    mat4.scale(modelViewMatrix, modelViewMatrix, [zoomScale, zoomScale, zoomScale]);

    // Draw grid
    drawGrid(gl, programInfo, gridBuffers, projectionMatrix, modelViewMatrix);

    // Draw cube
    mat4.scale(modelViewMatrix, modelViewMatrix, [scaleX, scaleY, scaleZ]);
    if (rotationEnabled) {
        cubeRotation += rotationDirection * 0.01;
    }
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, rotationAxis);

    drawCube(gl, programInfo, cubeBuffers, projectionMatrix, modelViewMatrix);
}

function drawGrid(gl, programInfo, buffers, projectionMatrix, modelViewMatrix) {
    gl.useProgram(programInfo.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    gl.drawArrays(gl.LINES, 0, buffers.vertexCount);
}

function drawCube(gl, programInfo, buffers, projectionMatrix, modelViewMatrix) {
    gl.useProgram(programInfo.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

    gl.drawElements(gl.TRIANGLES, buffers.vertexCount, gl.UNSIGNED_SHORT, 0);
}

function animate() {
    drawScene(gl, programInfo, gridBuffers, cubeBuffers);
    requestAnimationFrame(animate);
}

// Event listeners for controls
document.getElementById('zoomSlider').addEventListener('input', (event) => {
    zoomScale = parseFloat(event.target.value);
});

document.getElementById('scaleXSlider').addEventListener('input', (event) => {
    scaleX = parseFloat(event.target.value);
});

document.getElementById('scaleYSlider').addEventListener('input', (event) => {
    scaleY = parseFloat(event.target.value);
});

document.getElementById('scaleZSlider').addEventListener('input', (event) => {
    scaleZ = parseFloat(event.target.value);
});

document.getElementById('startStopRotationButton').addEventListener('click', () => {
    rotationEnabled = !rotationEnabled;
    document.getElementById('startStopRotationButton').textContent = rotationEnabled ? 'Stop Rotation' : 'Start Rotation';
});

document.getElementById('rotateLeftButton').addEventListener('click', () => {
    if (!rotationEnabled) {
        cubeRotation -= 0.1;
    }
});

document.getElementById('rotateRightButton').addEventListener('click', () => {
    if (!rotationEnabled) {
        cubeRotation += 0.1;
    }
});

document.getElementById('colorButton').addEventListener('click', () => {
    const faceColors = [
        [Math.random(), Math.random(), Math.random(), 1.0], // Front face
        [Math.random(), Math.random(), Math.random(), 1.0], // Back face
        [Math.random(), Math.random(), Math.random(), 1.0], // Top face
        [Math.random(), Math.random(), Math.random(), 1.0], // Bottom face
        [Math.random(), Math.random(), Math.random(), 1.0], // Right face
        [Math.random(), Math.random(), Math.random(), 1.0]  // Left face
    ];
    let colors = [];
    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c); // Apply color to each vertex of the face
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
});

document.getElementById('rotateXButton').addEventListener('click', () => {
    rotationAxis = [1, 0, 0];
});

document.getElementById('rotateYButton').addEventListener('click', () => {
    rotationAxis = [0, 1, 0];
});

document.getElementById('rotateZButton').addEventListener('click', () => {
    rotationAxis = [0, 0, 1];
});

animate();
