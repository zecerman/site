// BOARD FUNCTIONS
const size = 28

function initBoard() {
    // create the grid and set its dimensions
    let board = document.querySelector('#board')
    board.style.gridTemplateRows = `repeat(${size}, 8px)`
    board.style.gridTemplateColumns = `repeat(${size}, 8px)`
    // populate the grid
    for (let i = 0; i < size**2; i++) {
        let square = document.createElement('div')
        // color squares white, and listening to be moused over or clicked
        square.style.backgroundColor = 'white'
        square.addEventListener('pointerover', colorSquare)
        square.addEventListener('pointerdown', colorSquare)
        // insert the square into the grid
        board.appendChild(square)
    }
        console.log("Board initialized with", board.children.length, "pixels");
}
function colorSquare(e) {
    // if m1 is down, then color black
    if (e.buttons === 1 || e.type === 'pointerdown') {
        this.style.backgroundColor = 'black'
    }
}

function resetBoard() {
    document.querySelectorAll('#board div')       // all squares in the grid
        .forEach(e => e.style.backgroundColor = 'white')
}

initBoard()

// ONNX FUNCTIONALITY
/*
async function test() {
    const sess = new onnx.InferenceSession()
    await sess.loadModel('../models/onnx_model.onnx')
    const input = new onnx.Tensor(
    new Float32Array(28 * 28),   // 28×28 = 784 zeros
    'float32',
    [1, 1, 28, 28]
    )
    const outputMap    = await sess.run([input])
    const outputTensor = outputMap.values().next().value
    console.log(`Output tensor: ${outputTensor.data}`)
}
test()
*/
