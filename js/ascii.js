// js/main.js  ─ ASCII spinning OBJECT based on the classic z-buffer approach:
/* Must be used with the following css: 
# your-id {
    white-space: pre;           preserves shape
    font-family: monospace;     characters equal spacing in x axis
    line-height: 0.9;           characters equal spacing in y axis
}
*/
const COLS = 25    // characters across      (screen height)
const ROWS = 9    // characters down        (screen width)
// INCLUDES WHITESPACE ^
const SCALE = 10   // projection multiplier   (size of cube WITHIN screen)
const DIST = 5 // camera distance           (perspective)

const XADJUST = 1.6  // y == x * XADJUST     


const screen = new Array(COLS * ROWS)
const zbuffer = new Array(COLS * ROWS)
const $out = document.getElementById('ASCII')

const symbols = '$$##!!++--..'
let rx = 0, ry = 0, rz = 0 // current angle of rotation in radians


// define the 8 vertices of the cube V = [x, y, z]
const cube_vertices = [
    [-1,-1,-1], // corner 0
    [-1,-1, 1], // corner 1
    [-1, 1,-1], // corner 2
    [-1, 1, 1], // corner 3
    [ 1,-1,-1], // corner 4
    [ 1,-1, 1], // corner 5
    [ 1, 1,-1], // corner 6
    [ 1, 1, 1]  // corner 7
]
// define vectors for the 6 faces of the cube (using two triangles each)
const triangle_faces = [
    // front face (+Z)
    [1, 5, 7],
    [1, 7, 3],
    // back face (-Z)
    [0, 2, 6],
    [0, 6, 4],
    // left face (-X)
    [0, 1, 3],
    [0, 3, 2],
    // right face (+X)
    [4, 6, 7],
    [4, 7, 5],
    // top face (+Y)
    [2, 3, 7],
    [2, 7, 6],
    // bottom face (-Y)
    [0, 4, 5],
    [0, 5, 1]
]

function drawCube() {
    // update screen buffer such that it contains an image of the cube
    // for each cube_face
    for (let i = 0; i < triangle_faces.length; i++) {
        let tsfrd_vertices = []
        // iterate through xyz for each triangle face
        for (let j = 0; j < 3; j++) {
            //tsfrd_vertices[j] = cube_vertices[i][j]
            const idx = triangle_faces[i][j]
            const vector = cube_vertices[idx]
            let vec_copy = [...vector] // copy is made to avoid changing the original

            // rotate it
            vec_copy = rotateX(vec_copy, rx)
            vec_copy = rotateY(vec_copy, ry)
            vec_copy = rotateZ(vec_copy, rz)

            // push it down range into the background (otherwise would overlap with screen)
            vec_copy[2] += DIST
            // scale the x and y values (o.w. the cube will be unit size)
            vec_copy[0] *= SCALE
            vec_copy[1] *= SCALE
            vec_copy[2] *= SCALE

            tsfrd_vertices[j] = vec_copy
        }

        // back face culling (find the normal vector, dot it with the camera vector)
        const vec_1 = [
            tsfrd_vertices[1][0] - tsfrd_vertices[0][0],
            tsfrd_vertices[1][1] - tsfrd_vertices[0][1],
            tsfrd_vertices[1][2] - tsfrd_vertices[0][2]
        ]
        const vec_2 = [
            tsfrd_vertices[2][0] - tsfrd_vertices[0][0],
            tsfrd_vertices[2][1] - tsfrd_vertices[0][1],
            tsfrd_vertices[2][2] - tsfrd_vertices[0][2]
        ]
        const normal_vec = cross_prod_V3(vec_1, vec_2)
        
        const camera_vec = [
            (tsfrd_vertices[0][0] + tsfrd_vertices[1][0] + tsfrd_vertices[2][0]) / 3,
            (tsfrd_vertices[0][1] + tsfrd_vertices[1][1] + tsfrd_vertices[2][1]) / 3,
            (tsfrd_vertices[0][2] + tsfrd_vertices[1][2] + tsfrd_vertices[2][2]) / 3
        ] // represents a vector from the screen origin to the cube center
     
        // only if the dot product is negative will we draw the computed face
        if (dot_prod_V3(normal_vec, camera_vec) < 0) {
            // project 3 dimensional vertices onto 2 dim screen
            const proj_vertices = tsfrd_vertices.map(project)
            // draw the triangles
            drawTriangle(proj_vertices[0], proj_vertices[1], proj_vertices[2], symbols[i])
        }
    }
}


/* MATRIX MATH v */
function cross_prod_V3(v1, v2) {
    // computes the cross product of two 3 dimensional vectors
    return [
        v1[1] * v2[2] - v1[2] * v2[1],
        v1[2] * v2[0] - v1[0] * v2[2],
        v1[0] * v2[1] - v1[1] * v2[0] 
    ]
}
function dot_prod_V3(v1, v2) {
    return v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]
}
function rotateX(V3, r) {
    return [
        V3[0],
        Math.cos(r)*V3[1] + (-Math.sin(r))*V3[2],
        Math.sin(r)*V3[1] + Math.cos(r)*V3[2]
    ]
}
function rotateY(V3, r) {
    return [
        Math.cos(r) * V3[0] - Math.sin(r) * V3[2],
        V3[1],
        Math.sin(r) * V3[0] + Math.cos(r) * V3[2]
    ]
}
function rotateZ(V3, r) {
    return [
        Math.cos(r) * V3[0] - Math.sin(r) * V3[1],
        Math.sin(r) * V3[0] + Math.cos(r) * V3[1],
        V3[2]
    ]
}
function project(V3) {
    // prevent divide by zero
    const z = Math.max(V3[2], 0.01)
    // normalize screen vectors
    const perspective = SCALE / z
    const x_ndc = V3[0] * perspective
    const y_ndc = V3[1] * perspective
    
    // center on the screen by subtracting half dimensions
    const screen_x = Math.round(COLS / 2 + x_ndc * XADJUST)
    const screen_y = Math.round(ROWS / 2 + y_ndc)
    return [screen_x, screen_y]
}
/* MATRIX MATH ^ */


/* DRAWING/PRINTING v */
function drawTriangle(v_0, v_1, v_2, symbol) {
    // sort vertices ST v0...v2 are ascending in order of y
    // (this is done so that the midpoint can be found mathematically later) 

    // sort vertices in order of ascending y value
    const [v0, v1, v2] = [v_0, v_1, v_2].sort((a, b) => a[1] - b[1])
    // prevent later division by zero, a 1D line does not need to be drawn anyways
    if (v2[1] - v0[1] === 0) return 
    
    // w/ vertices sorted, find midpoint using trig rules
const midpoint = [
    Math.floor(v0[0] + (v2[0] - v0[0]) * (v1[1] - v0[1]) / (v2[1] - v0[1])),
    Math.floor(v1[1])
]

    // if va == vb then just draw, OW draw using midpoint
    if (v1[1] == v2[1]) {
        drawUpperTriangle(v0, v1, v2, symbol)
    } else {
        drawUpperTriangle(v0, v1, midpoint, symbol)
    }
    if (v0[1] == v1[1]){
        drawLowerTriangle(v2, v0, v1, symbol)
    } else{
        drawLowerTriangle(v2, v1, midpoint, symbol)
    }
}
function drawUpperTriangle(t, b0, b1, symbol) {
    // called by drawTriangle, draws 1/2 of the cube's face
    // t, b0 and b1 are 2D vectors [x, y]

    // x will be conv to int later
    let x0 = t[0]
    let x1 = t[0]

    // incriment x using Thales theorem
    const x0_inc = (b0[0] - t[0]) / (b0[1] - t[1])
    const x1_inc = (b1[0] - t[0]) / (b1[1] - t[1])

    // y must be conv to int
const yt = Math.floor(t[1])
const yb = Math.floor(b0[1])

    if (yb === yt) return  // Flat triangle, nothing to draw

    for (let i = yt; i < yb+1; i++) {
        //update values of x0 and x1
        const xStart = Math.floor(Math.min(x0, x1))
        const xEnd   = Math.floor(Math.max(x0, x1))
        drawToBuffer(i, xStart, xEnd, symbol)
        x0 += x0_inc
        x1 += x1_inc
    }
}
function drawLowerTriangle(b, t0, t1, symbol) {
    // called by drawTriangle, draws 1/2 of the cube's face
    // t, b0 and b1 are 2D vectors [x, y]

    // x will be conv to int later
    let x0 = t0[0]
    let x1 = t1[0]

    // incriment x using Thales theorem
    const x0_inc = (b[0] - t0[0]) / (b[1] - t0[1])
    const x1_inc = (b[0] - t1[0]) / (b[1] - t1[1])

    // y must be conv to int
const yt = Math.floor(t0[1])
const yb = Math.floor(b[1])

    if (yb === yt) return  // Flat triangle, nothing to draw

    for (let i = yt; i < yb+1; i++) {
        //update values of x0 and x1
        const xStart = Math.floor(Math.min(x0, x1))
        const xEnd   = Math.floor(Math.max(x0, x1))
        drawToBuffer(i, xStart, xEnd, symbol)
        x0 += x0_inc
        x1 += x1_inc
    }
}
function drawToBuffer(y, xleft, xright, symbol) {
    // updates the buffer values at y from x1 to x2
    if (y < 0 || y >= ROWS) return

    let left = Math.max(0, Math.min(xleft, xright))
    let right = Math.min(COLS - 1, Math.max(xleft, xright))

    for (let x = left; x <= right; x++) {
        screen[y * COLS + x] = symbol
    }
}
/* DRAWING/PRINTING ^ */


/* MAIN METHOD V */
function frame() {
    // frame() flushes the ascii off the old screen and then draws the new frame
    screen.fill(' ')
    zbuffer.fill(-Infinity)

    drawCube()
    
    // draw screen using a single string inside our <pre> tag
    let out = ''
    for (let i = 0; i < screen.length; i++) {
    out += screen[i] // print char
    if ((i + 1) % COLS === 0) out += '\n' // newline behavior
    }
    
    $out.textContent = out

    // rotation speeds are adjustable
    rx += 0.05            
    ry += 0.05
    rz += 0.01
}

setInterval(frame, 20)  // Refresh frame with X ms delay