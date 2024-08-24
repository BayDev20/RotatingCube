# WebGL Rotating Cube with Dynamic Colors and Scaling

## Overview

This project showcases a rotating 3D cube rendered using WebGL. The cube can be dynamically rotated around different axes, scaled, and its colors can be changed in real-time. The application demonstrates basic 3D transformations and lighting effects.
![image](https://github.com/user-attachments/assets/cf052316-64a8-4eed-ab56-5e078e098b22)


## Features

- **Rotation Controls**: Start or stop the cube's rotation and rotate manually in the stopped state.
- **Axis Rotation**: Rotate the cube around the X, Y, or Z axis.
- **Scaling**: Adjust the scale of the cube using a slider.
- **Dynamic Colors**: Change the cube's colors dynamically using a button.
- **Rotation Direction Toggle**: Toggle the rotation direction between clockwise and counter-clockwise.

## Getting Started

### Prerequisites

- A modern web browser with WebGL support (e.g., Chrome, Firefox, Edge).

### Installation

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/BayDev20/RotatingCube
    ```
2. **Navigate to the Project Directory**:
    ```bash
    cd <project-directory>
    ```

3. **Open `index.html`** in your browser:
    Simply open `index.html` in a web browser to view the project.

### Project Structure

- `index.html`: The main HTML file containing the canvas and controls.
- `cube.js`: JavaScript file handling WebGL rendering, rotation, scaling, and color changes.

### Usage

1. **Start/Stop Rotation**:
   - Click the "Start Rotation" button to begin rotating the cube.
   - Click the "Stop Rotation" button to stop the rotation.

2. **Manual Rotation**:
   - Use the "Rotate Left" and "Rotate Right" buttons to manually rotate the cube when it is stopped.

3. **Change Colors**:
   - Click the "Change Colors" button to randomly update the cube's face colors.

4. **Toggle Rotation Direction**:
   - Click the "Toggle Rotation Direction" button to switch between clockwise and counter-clockwise rotation.

5. **Adjust Scale**:
   - Use the slider labeled "Cube Scale" to adjust the size of the cube.

6. **Axis Rotation**:
   - Click the "Rotate around X axis", "Rotate around Y axis", or "Rotate around Z axis" buttons to set the cube's rotation axis.

### Code Explanation

- **Shaders**: The vertex and fragment shaders handle the coloring and lighting of the cube.
- **Buffers**: Buffers store vertex positions, colors, and indices for rendering the cube.
- **Animation**: The `animate` function continuously updates and draws the scene.
