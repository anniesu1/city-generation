import { vec2 } from "gl-matrix";

function random2(p: vec2) : vec2 {
    // return fract(sin(vec2(dot(p, vec2(127.1, 311.7)),
    //                       dot(p, vec2(269.5, 183.3))))
    //                       * 43758.5453);
    // TODO
    return vec2.fromValues(0.0, 0.0);
}

// function worley(p: vec2) {
//     // Divide image into mxn cells
//     let m: number = 65.0;
//     let n: number = 50.0;

//     // Determine which cell our current pixel is in
//     let UVCell: vec2 = vec2.fromValues(p[0] / this.width * m, p[1] / this.height * n);
//     let floorUVCell: vec2 = vec2.fromValues(Math.floor(UVCell[0]), Math.floor(UVCell[1]));

//     // Test each pixel against the point belonging to the cell in which
//     // the pixel lies and its eight surrounding cells
//     let minDistance = 500.0;
//     let minPoint: vec2 = vec2.fromValues(0.0, 0.0);

//     for (let i = -1; i <= 1; i++) {
//         for (let j = 1; j >= -1; j--) {
//             let neighbor: vec2 = new vec2(0.0);
//             vec2.add(neighbor, floorUVCell, vec2.fromValues(i, j));
//             let randomPoint: vec2 = new vec2(0.0); 
//             vec2.add(randomPoint, neighbor, random2(neighbor));

//             // If the pixel distance is smaller than minDistance, make that the pixel color
//             let distance: number = vec2.distance(UVCell, randomPoint);
//             if (distance < minDistance) {
//                 // Update minDistance and point
//                 minDistance = distance;

//                 // Extract color at our random point
//                 let currUV = vec2.fromValues(randomPoint[0] / m, randomPoint[1] / n);
//                 minPoint = currUV;

//                 let pixelColor: vec4 = texture(u_RenderedTexture, currUV);

//                 // Set color of pixel to that of our random point
//                 color = vec3(pixelColor[0], pixelColor[1], pixelColor[2]);
//             }
//         }
//     }
// }

// Create high-resolution 2D grid that spans your entire scene
class CityGrid {
    width: number;
    height: number;
    grid: number[][] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.initializeGrid(width, height);
    }

    initializeGrid(width: number, height: number) {
        for (let i = 0; i < width; i++) {
            this.grid[i] = [];
            for (let j = 0; j < height; j++) {
                this.grid[i][j] = 0;
            }
        }
    }

    rasterize() {
        // "Rasterize" every road in this grid with an adjustable 
        // line thickness to demarcate areas where buildings cannot be placed

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                if (i % 10 == 0 || j % 10 == 0) {
                    this.grid[i][j] = 1; // Road case
                } else {
                    this.grid[i][j] = 0; // Not a road
                }
                // if (noise > 0.6) {
                //     this.grid[i][j] = 1; // Set 1 (valid building spot)
                // } else {
                //     this.grid[i][j] = 0; // Set 0 (invalid building spot) 
                // }
            }
        }

        console.log('Rasterized grid of size: ' + this.grid.length);
    }

    generateValidPoints(numPoints: number) :  Array<vec2> {
        let outputPoints = new Array<vec2>();

        for (let i = 0; i < this.width; i++) {
            for (let j = 0; j < this.height; j++) {
                // Check if point belongs in grid using noise function
                let noise = Math.random();
                if (noise > 0.7 && this.grid[i][j] != 1) {
                    // If noise is above a threshold and there is not already a road, set
                    // down a building
                    this.grid[i][j] = 2;
                }
            }
        }
        return outputPoints;
    }

    setGridVBO() : any {
        let col1Array: number[] = [];
	    let col2Array: number[] = [];
	    let col3Array: number[] = [];
	    let col4Array: number[] = [];
	    let colorsArray: number[] = [];

        for (let i: number = 0; i < this.width; i++) {
            for (let j: number = 0; j < this.height; j++) {
                let cellType = this.grid[i][j];
                if (cellType != 0) {
                    col1Array.push(1);
                    col1Array.push(0);
                    col1Array.push(0);
                    col1Array.push(0);

                    col2Array.push(0);
                    col2Array.push(1);
                    col2Array.push(0);
                    col2Array.push(0);

                    col3Array.push(0);
                    col3Array.push(0);
                    col3Array.push(1);
                    col3Array.push(0);
            
                    col4Array.push(i - this.width / 2);
                    col4Array.push(0);
                    col4Array.push(j - this.height / 2);
                    col4Array.push(1);

                    if (cellType == 1) {
                        // Road - red
                        colorsArray.push(1);
                        colorsArray.push(0);
                        colorsArray.push(0);
                        colorsArray.push(1);
                    }

                    if (cellType == 2) {
                        // Building - blue
                        colorsArray.push(0);
                        colorsArray.push(0);
                        colorsArray.push(1);
                        colorsArray.push(1);
                    }

                    if (cellType == 3) {
                        // Water - green
                        colorsArray.push(1);
                        colorsArray.push(0);
                        colorsArray.push(0);
                        colorsArray.push(1);
                    }
                }
            }
            
        }

        let col1: Float32Array = new Float32Array(col1Array);
        let col2: Float32Array = new Float32Array(col2Array);
        let col3: Float32Array = new Float32Array(col3Array);
        let col4: Float32Array = new Float32Array(col4Array);
        let colors: Float32Array = new Float32Array(colorsArray);

        let output: any = {};
        output.transform1Array = col1;
        output.transform2Array = col2;
        output.transform3Array = col3;
        output.transform4Array = col4;
        output.colorsArray = colors;

        return output;
    }

    setBuildingVBO() {

    }
}

export default CityGrid;