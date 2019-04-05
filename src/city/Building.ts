import { vec2, mat4 } from "gl-matrix";

class Building {
    x: number;
    y: number;
    gridWidth: number;
    gridHeight: number;
    rotationAngle: number;
    transforms: mat4[];

    constructor(x: number, y: number, gridWidth: number, gridHeight: number) {
        this.x = x;
        this.y = y;
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.rotationAngle = Math.random() * 2 * Math.PI; // Will rotate about Y axis
        this.transforms = [];
    }

    create() {
        // Sample noise function to jitter population (but population generally falls off from 
        // the center of the grid)
        let gridCenter: vec2 = vec2.fromValues(this.gridWidth / 2, this.gridHeight / 2);
        let height: number = Math.max(5.0, 50.0 - vec2.distance(vec2.fromValues(this.x, this.y), gridCenter));
        height += Math.max(0.0, (Math.random() - 0.5) * 15.0);

        // Save the transforms state
        let T: mat4 = this.getTransformationMatrix(height, 
            vec2.fromValues(this.x, this.y), this.rotationAngle);
        this.transforms.push(T);
        
        for (let i = 0; i < 3; i++) {
            // Walk down a random distance based on some height
            height -= Math.random() * 5.0;

            if (height < 5.0) {
                break;
            }

            // At lower height, create a new polygon with a different center (jitter x and z) (save transforms state)
            let rotationAngle: number = Math.random() * 2 * Math.PI;
            let center: vec2 = vec2.fromValues(this.x + (Math.random() - 0.5) * 0.8, this.y + (Math.random() - 0.5) * 0.8);
            let newT: mat4 = this.getTransformationMatrix(height, center, rotationAngle);
            //let newLength: number = this.transforms.push(newT);
            console.log('height = ' + height);
        }
    }

    getTransformationMatrix(height: number, center: vec2, rotationAngle: number) : mat4 {
        let transform: mat4 = mat4.create();
        transform[5] = height;
        transform[12] = center[0] - this.gridWidth / 2;
        transform[14] = center[1] - this.gridHeight / 2;
        mat4.rotateY(transform, transform, rotationAngle);

        return transform;
    }

    getTransforms() : mat4[] {
        return this.transforms;
    }
}

export default Building;