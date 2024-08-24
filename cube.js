const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
}

const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec3 uLightPosition;
    varying lowp vec4 vColor;
    varying lowp vec3 vLighting;

    void main(void) {
        vec3 ambientLight = vec3(0.2, 0.2, 0.2);  // Ambient light color
        vec3 lightDirection = normalize(uLightPosition - (uModelViewMatrix * aVertexPosition).xyz);
        float directional = max(dot(normalize(vec3(0, 0, 1)), lightDirection), 0.0);
        
        vec3 lighting = ambientLight + (1.0 * directional);
        vColor = aVertexColor * vec4(lighting, 1.0);
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
        lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
    },
};

const buffers = initBuffers(gl);

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
        -1.0,  1.0, -1.0,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const faceColors = [
        [1.0,  1.0,  1.0,  1.0],    
        [1.0,  0.0,  0.0,  1.0],    
        [0.0,  1.0,  0.0,  1.0],   
        [0.0,  0.0,  1.0,  1.0],    
        [1.0,  1.0,  0.0,  1.0],    
        [1.0,  0.0,  1.0,  1.0],    
    ];

    let colors = [];

    for (let j = 0; j < faceColors.length; ++j) {
        const c = faceColors[j];
        colors = colors.concat(c, c, c, c);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        3,  2,  6,      3,  6,  7,    // top
        4,  5,  1,      4,  1,  0,    // bottom
        1,  5,  6,      1,  6,  2,    // right
        4,  0,  3,      4,  3,  7,    // left
    ];

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
        indices: indexBuffer,
    };
}

let cubeRotation = 0.0;
let rotationEnabled = true;
let rotationDirection = 1; // 1 for clockwise, -1 for counter-clockwise
let rotationAxis = [0, 1, 0]; // Default rotation around Y axis
let cubeScale = 1.0;

function drawScene(gl, programInfo, buffers) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, gl.canvas.width / gl.canvas.height, 0.1, 100.0);

    const modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0.0, 0.0, -6.0]);
    mat4.scale(modelViewMatrix, modelViewMatrix, [cubeScale, cubeScale, cubeScale]);

    if (rotationEnabled) {
        cubeRotation += rotationDirection * 0.01;
    }

    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, rotationAxis);

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
    gl.uniform3f(programInfo.uniformLocations.lightPosition, 0.0, 0.0, 1.0);

    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function animate() {
    drawScene(gl, programInfo, buffers);
    requestAnimationFrame(animate);
}

// Event listener for the start/stop rotation button
document.getElementById('startStopRotationButton').addEventListener('click', () => {
    rotationEnabled = !rotationEnabled;
    document.getElementById('startStopRotationButton').textContent = rotationEnabled ? 'Stop Rotation' : 'Start Rotation';
});

// Event listeners for manual rotation buttons
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

// Event listener for the color button
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
        colors = colors.concat(c, c, c, c);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
});

// Event listener for the toggle rotation direction button
document.getElementById('toggleDirectionButton').addEventListener('click', () => {
    rotationDirection *= -1;
    document.getElementById('toggleDirectionButton').textContent = rotationDirection === 1 ? 'Clockwise Rotation' : 'Counter-Clockwise Rotation';
});

// Event listeners for rotation axis buttons
document.getElementById('rotateXButton').addEventListener('click', () => {
    rotationAxis = [1, 0, 0];
});
document.getElementById('rotateYButton').addEventListener('click', () => {
    rotationAxis = [0, 1, 0];
});
document.getElementById('rotateZButton').addEventListener('click', () => {
    rotationAxis = [0, 0, 1];
});

// Event listener for cube scale slider
document.getElementById('scaleSlider').addEventListener('input', (event) => {
    cubeScale = parseFloat(event.target.value);
});

animate();